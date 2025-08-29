import { Command } from 'commander';
import { getHubDb, closeHubMongo } from '../db/hubmongo.js';
import { logger } from '../config/logger.js';

/**
 * Registers the 'hub-health' command for checking Hub MongoDB connectivity and status.
 * 
 * This command provides a quick health check for the Hub MongoDB database by:
 * - Testing database connectivity
 * - Counting documents in the message collection
 * - Displaying database and collection information
 * 
 * It's useful for troubleshooting connection issues and verifying the database
 * is accessible before running import commands.
 * 
 * @param program - The Commander.js program instance to register the command with
 * 
 * @example
 * ```bash
 * # Check Hub MongoDB health
 * npm run dev hub-health
 * 
 * # Example output:
 * # Hub health OK. Database=data Collection=message Count=15420
 * ```
 */
export function registerHubHealth(program: Command) {
    program
        .command('hub-health')
        .description('Check Hub MongoDB connectivity and count documents in message collection')
        .action(async () => {
            try {
                const hub = await getHubDb();
                const coll = hub.collection('message');
                const total = await coll.estimatedDocumentCount();
                logger.info({ database: hub.databaseName, collection: coll.collectionName, total }, 'Hub health: collection document count');
                // Also print to console explicitly
                // eslint-disable-next-line no-console
                console.log(`Hub health OK. Database=${hub.databaseName} Collection=${coll.collectionName} Count=${total}`);
            } catch (err) {
                logger.error({ err }, 'Hub health failed');
                // eslint-disable-next-line no-console
                console.error('Hub health failed:', err);
                process.exitCode = 1;
            } finally {
                await closeHubMongo().catch(() => { });
            }
        });
}


