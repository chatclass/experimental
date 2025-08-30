import { Command } from 'commander';
import { getPgPool, closePg } from '../db/postgres.js';
import { getAnalyticsDb, initIndexes, closeAnalyticsMongo } from '../db/mongo.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';
import { filterConfig } from '../evolution/filter.js';
import { discoverChatIds, readBatchByChat, ChatCursor, getLatestMessageMeta, getNthMostRecentBoundary } from '../evolution/reader.js';
import { mapEvolutionRowToMessage } from '../evolution/mapper.js';
import { validateMessage } from '../model/validators.js';
import { upsertMessage } from '../services/upsertMessage.js';
import { upsertChat } from '../services/upsertChat.js';

/**
 * Registers the 'ingest' command for importing WhatsApp Evolution data from PostgreSQL to MongoDB.
 * 
 * This command reads WhatsApp messages from a PostgreSQL database containing WhatsApp Evolution data
 * and transforms them into a canonical message format for storage in MongoDB. It supports various
 * filtering options and cursor-based pagination for efficient processing of large datasets.
 * 
 * The command implements several filtering strategies:
 * - **Chat-based filtering**: Process specific chats or all chats
 * - **Time-based filtering**: Absolute date ranges or relative time periods
 * - **Depth-based filtering**: Import only the most recent N messages
 * - **Cursor-based pagination**: Resume interrupted imports from exact position
 * 
 * @param program - The Commander.js program instance to register the command with
 * 
 * @example
 * ```bash
 * # Run ingest with default settings (all chats, no time limits)
 * npm run dev ingest
 * 
 * # Dry run to see what would be imported without writing to MongoDB
 * npm run dev ingest --dry-run
 * 
 * # Process only a specific chat
 * npm run dev ingest --chat 19175769740@s.whatsapp.net
 * 
 * # Combine options for targeted import
 * npm run dev ingest --chat 19175769740@s.whatsapp.net --dry-run
 * ```
 * 
 * @remarks
 * The command uses cursor-based pagination to enable resuming interrupted imports.
 * Cursor state is stored per chat and updated after each batch is processed.
 * 
 * Filtering is configured in `src/evolution/filter.ts` and supports:
 * - `include-remoteJids`: Process only specified chat IDs
 * - `absolute`: Import messages within specific date range
 * - `relative-days`: Import messages from last N days
 * - `depth`: Import only the most recent N messages per chat
 */
export function registerIngest(program: Command) {
    program
        .command('ingest')
        .description('Ingest WhatsApp Evolution messages from Postgres to MongoDB')
        .option('--dry-run', 'Do not write to MongoDB; map and print messages only', false)
        .option('--chat <remoteJid>', 'Process only a single chat (remoteJid)', '19175769740@s.whatsapp.net')
        .action(async (opts: { dryRun?: boolean; chat?: string }) => {
            const dryRun = !!opts?.dryRun;
            const singleChat = opts?.chat || undefined;
            try {
                logger.info({ env: config.envName, dryRun, singleChat }, 'Starting ingest');
                await getPgPool();
                if (!dryRun) {
                    await getAnalyticsDb();
                    await initIndexes();
                }

                // Discover chats
                let chatIds: string[] = [];
                if (singleChat) {
                    chatIds = [singleChat];
                } else if (filterConfig.type === 'include-remoteJids') {
                    chatIds = filterConfig.remoteJids.length > 0 ? filterConfig.remoteJids : await discoverChatIds();
                } else {
                    // For simplicity v1: discover all chats then filter range in per-chat reading
                    chatIds = await discoverChatIds();
                }
                logger.info({ chatCount: chatIds.length }, 'Discovered chats');

                let totalInserted = 0;
                let totalUpdated = 0;

                for (const chatId of chatIds) {
                    // Attempt to resume from embedded chat cursor if present
                    const { getExistingCursor } = await import('../services/chatCursor.js');
                    const existing = await getExistingCursor(config.tenantId, chatId);
                    const cursor: ChatCursor = existing ?? { last_ts_seconds: null, last_message_id: null };
                    let batchCount = 0;
                    let importedForChat = 0;
                    let firstIso: string | null = null;
                    let lastIso: string | null = null;
                    // const topSenders: Record<string, number> = {};
                    // compute bounds per filter
                    let bounds: { sinceSeconds?: number | null; untilSeconds?: number | null } | undefined;
                    if (filterConfig.type === 'absolute') {
                        const sinceSeconds = filterConfig.since ? Math.floor(new Date(filterConfig.since).getTime() / 1000) : null;
                        const untilSeconds = filterConfig.until ? Math.floor(new Date(filterConfig.until).getTime() / 1000) : null;
                        bounds = { sinceSeconds, untilSeconds };
                    } else if (filterConfig.type === 'relative-days') {
                        const latest = await getLatestMessageMeta(chatId);
                        if (latest) {
                            const untilSeconds = latest.ts_seconds;
                            const sinceSeconds = untilSeconds - filterConfig.days * 24 * 60 * 60;
                            bounds = { sinceSeconds, untilSeconds };
                        }
                    } else if (filterConfig.type === 'depth') {
                        const boundary = await getNthMostRecentBoundary(chatId, filterConfig.depth);
                        if (boundary) {
                            bounds = { sinceSeconds: boundary.ts_seconds, untilSeconds: undefined };
                        }
                    }

                    while (true) {
                        const rows = await readBatchByChat(chatId, cursor, config.batchSize, bounds);
                        if (rows.length === 0) break;
                        batchCount += 1;

                        for (const row of rows) {
                            const ctx = { tenantId: config.tenantId, channel_id: `ev:cloud:${row.instanceId}` };
                            const { msg, helpers } = mapEvolutionRowToMessage(row, ctx);

                            const { valid, errors } = await validateMessage(msg);
                            if (!valid) {
                                logger.warn({ errors, wa_message_id: helpers.wa_message_id }, 'Validation failed; skipping');
                                continue;
                            }

                            if (dryRun) {
                                logger.info({ chatId: helpers.chat_id, wa_message_id: helpers.wa_message_id, ts: helpers.ts_iso, from: msg.sender, text: (msg.content as any)?.text }, 'DRY RUN message');
                            } else {
                                const res = await upsertMessage(msg, helpers);
                                totalInserted += res.inserted;
                                totalUpdated += res.updated;
                                importedForChat += (res.inserted || res.updated) ? 1 : 0;
                            }
                            firstIso = firstIso ?? helpers.ts_iso;
                            lastIso = helpers.ts_iso;
                            // if (helpers.contact_id) topSenders[helpers.contact_id] = (topSenders[helpers.contact_id] || 0) + 1;

                            // advance cursor candidate
                            cursor.last_ts_seconds = row.messageTimestamp;
                            cursor.last_message_id = String(row.key?.id || row.key?.['id'] || row.id);
                        }
                    }

                    if (!dryRun) {
                        await upsertChat({
                            tenantId: config.tenantId,
                            chatId,
                            last_ts_seconds: cursor.last_ts_seconds,
                            last_message_id: cursor.last_message_id,
                            batch_imported_count: importedForChat,
                            first_ts_iso_in_batch: firstIso,
                            last_ts_iso_in_batch: lastIso,
                            top_sender_contact_ids_in_batch: [],
                        });
                    }

                    logger.info({ chatId, batches: batchCount, importedForChat, dryRun }, 'Processed chat');
                }

                logger.info({ totalInserted, totalUpdated, dryRun }, 'Ingest complete');
            } catch (err) {
                logger.error({ err }, 'Ingest failed');
                process.exitCode = 1;
            } finally {
                await closePg().catch(() => { });
                if (!dryRun) await closeAnalyticsMongo().catch(() => { });
            }
        });
}


