import 'dotenv/config';

export interface AppConfig {
    pgConnection: string;
    mongoUri: string;
    tenantId: string;
    envName: string;
    nodeEnv: 'development' | 'production' | string;
    batchSize: number;
    pgSslRejectUnauthorized?: boolean;
    pgSslMode?: 'disable' | 'require' | 'no-verify' | 'verify-full';
}

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing required env var ${name}`);
    }
    return value;
}

export const config: AppConfig = {
    pgConnection: requireEnv('PG_CONNECTION'),
    mongoUri: requireEnv('MONGODB_URI'),
    tenantId: process.env.TENANT_ID || 'default',
    envName: process.env.ENV_NAME || 'dev',
    nodeEnv: process.env.NODE_ENV || 'development',
    batchSize: 2000,
    pgSslRejectUnauthorized:
        process.env.PG_SSL_REJECT_UNAUTHORIZED === undefined
            ? undefined
            : String(process.env.PG_SSL_REJECT_UNAUTHORIZED).toLowerCase() === 'true',
    pgSslMode: (() => {
        const raw = (process.env.PG_SSL_MODE || process.env.PG_SSL || '').toLowerCase();
        if (!raw) return undefined;
        if (['disable', 'require', 'no-verify', 'verify-full'].includes(raw)) return raw as any;
        return undefined;
    })()
};


