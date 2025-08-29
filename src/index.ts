/**
 * PG→Mongo Ingest CLI
 * 
 * A command-line tool for ingesting WhatsApp Evolution data from PostgreSQL to MongoDB
 * and Hub events from MongoDB to target databases (PostgreSQL or MongoDB).
 * 
 * This tool provides multiple ingestion commands:
 * - `ingest`: Import WhatsApp Evolution data from PostgreSQL to MongoDB
 * - `hub-import`: Import Hub events from MongoDB to target database
 * - `health`: Check health status of connected databases
 * 
 * @packageDocumentation
 */

import { Command } from 'commander';
import { registerIngest } from './cli/ingest.js';
import { registerHubIngest } from './cli/hubIngest.js';
import { registerHubHealth } from './cli/health.js';
import { logger } from './config/logger.js';

const program = new Command();
program.name('pg-mongo-ingest');

registerIngest(program);
registerHubIngest(program);
registerHubHealth(program);

program.parseAsync(process.argv).catch((err) => {
    logger.error({ err }, 'CLI failed');
    process.exit(1);
});

['SIGINT', 'SIGTERM'].forEach((sig) => {
    process.on(sig as NodeJS.Signals, () => {
        logger.info({ sig }, 'Received signal, exiting');
        process.exit(0);
    });
});



