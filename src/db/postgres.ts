import { Pool, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

let pool: Pool | null = null;

export function getPgPool(): Pool {
    if (!pool) {
        let ssl: any = undefined;
        if (config.pgSslMode === 'disable') {
            ssl = undefined;
        } else if (config.pgSslMode === 'no-verify') {
            ssl = { rejectUnauthorized: false };
        } else if (config.pgSslMode === 'require' || config.pgSslMode === 'verify-full') {
            ssl = { rejectUnauthorized: config.pgSslMode === 'verify-full' };
        } else if (config.pgSslRejectUnauthorized !== undefined) {
            ssl = { rejectUnauthorized: config.pgSslRejectUnauthorized };
        }
        if (ssl && ssl.rejectUnauthorized === false) {
            // Ensure Node TLS also does not reject self-signed certs in this process
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        }
        logger.info({ pgSslMode: config.pgSslMode ?? null, pgSslRejectUnauthorized: config.pgSslRejectUnauthorized ?? null, usingSsl: !!ssl, rejectUnauthorized: ssl ? ssl.rejectUnauthorized : undefined }, 'PG SSL config');
        pool = new Pool({ connectionString: config.pgConnection, ssl });
        pool.on('error', (err) => {
            logger.error({ err }, 'Postgres pool error');
        });
    }
    return pool;
}

export async function runQuery<T extends QueryResultRow = any>(sql: string, params: any[]): Promise<QueryResult<T>> {
    const client = await getPgPool().connect();
    try {
        return await client.query<T>(sql, params);
    } finally {
        client.release();
    }
}

export async function closePg(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}


