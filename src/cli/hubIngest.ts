import { Command } from 'commander';
import { getHubDb, closeHubMongo } from '../db/hubmongo.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';
import { validateMessage } from '../schemas/validators.js';
import { mapHubEventToMessage } from '../evolution/hubMapper.js';

/**
 * Registers the 'ingest-hub' command for importing Hub events from MongoDB.
 * 
 * This command reads event data from the Hub MongoDB database and transforms
 * them into a canonical message format. It supports time-based filtering and
 * provides detailed logging of the import process.
 * 
 * The command processes events in chronological order and groups them by chat,
 * providing summary statistics for each chat processed.
 * 
 * @param program - The Commander.js program instance to register the command with
 * 
 * @example
 * ```bash
 * # Import events from the last 3 days (default)
 * npm run dev ingest-hub
 * 
 * # Import events from the last 7 days
 * npm run dev ingest-hub --days 7
 * 
 * # Dry run to see what would be imported (default behavior)
 * npm run dev ingest-hub --dry-run
 * 
 * # Actually import the data (disable dry run)
 * npm run dev ingest-hub --dry-run false
 * ```
 */
export function registerHubIngest(program: Command) {
    program
        .command('ingest-hub')
        .description('Ingest Hub events from hubdb MongoDB messages collection')
        .option('--days <n>', 'Limit to last N days', (v) => parseInt(v, 10), 3)
        .option('--dry-run', 'Do not write to MongoDB; map and print only', true)
        .action(async (opts: { days?: number; dryRun?: boolean }) => {
            const dryRun = opts?.dryRun !== false; // default true
            const days = Number.isFinite(opts?.days) ? (opts?.days as number) : 3;
            try {
                logger.info({ env: config.envName, dryRun, days }, 'Starting ingest-hub');

                const hub = await getHubDb();
                const collections = await hub.listCollections().toArray();
                logger.info({ collections }, 'Hub ingest collections');


                const now = new Date();
                const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
                const filter: any = {
                    created: { $gte: sinceDate, $lt: now },
                };
                // minimal logging; detailed diagnostics are available via hub-health

                const coll = hub.collection('message');
                const docs = await coll.find().limit(1).toArray();
                console.log(docs);


                console.log("sinceDate:", sinceDate, "now:", now);
                console.log("ISO:", sinceDate.toISOString(), now.toISOString());

                const anyDoc = await coll.findOne();
                console.log("Sample doc:", anyDoc);

                const match = await coll.findOne(filter);
                console.log("Matched doc:", match);


                // no pre-count/sample logs to keep CLI quiet

                const cursor = coll
                    .find(filter)
                    .sort({ created: 1 })
                    .project({ _id: 0 });

                const byChat = new Map<string, { count: number; firstTs: string | null; lastTs: string | null; sample: Array<{ id: string; ts: string; role: string; text: string }> }>();
                let total = 0;
                while (await cursor.hasNext()) {
                    const ev: any = await cursor.next();
                    if (!ev) break;

                    const { msg, helpers } = mapHubEventToMessage(ev, { tenantId: config.tenantId });
                    const { valid, errors } = await validateMessage(msg);
                    if (!valid) {
                        logger.warn({ errors, wa_message_id: helpers.wa_message_id }, 'Hub validation failed; skipping');
                        continue;
                    }

                    if (dryRun) {
                        logger.info({ chatId: helpers.chat_id, wa_message_id: helpers.wa_message_id, ts: helpers.ts_iso, role: msg.sender.role, text: (msg.content as any)?.text }, 'DRY RUN hub message');
                    }

                    const s = byChat.get(helpers.chat_id) || { count: 0, firstTs: null, lastTs: null, sample: [] };
                    s.count += 1;
                    s.firstTs = s.firstTs ?? helpers.ts_iso;
                    s.lastTs = helpers.ts_iso;
                    if (s.sample.length < 3) {
                        s.sample.push({ id: helpers.wa_message_id, ts: helpers.ts_iso, role: msg.sender.role, text: String((msg.content as any)?.text || '') });
                    }
                    byChat.set(helpers.chat_id, s);
                    total += 1;

                }

                logger.info({ totalChats: byChat.size, totalMessages: total, days }, 'DRY RUN hub chats summary');
                for (const [chatId, s] of byChat.entries()) {
                    logger.info({ chatId, count: s.count, firstTs: s.firstTs, lastTs: s.lastTs, sample: s.sample }, 'DRY RUN hub chat');
                }
            } catch (err) {
                logger.error({ err }, 'ingest-hub failed');
                process.exitCode = 1;
            } finally {
                await closeHubMongo().catch(() => { });
            }
        });
}


