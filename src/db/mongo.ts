import { MongoClient, Db, Collection, Document, IndexDescription } from 'mongodb';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

const ANALYTICS_DB_NAME = 'chat_analytics';

let analyticsClient: MongoClient | null = null;
let analyticsDb: Db | null = null;

export async function getAnalyticsClient(): Promise<MongoClient> {
    if (!analyticsClient) {
        analyticsClient = new MongoClient(config.mongoUri);
        await analyticsClient.connect();
    }
    return analyticsClient;
}

export async function getAnalyticsDb(): Promise<Db> {
    if (!analyticsDb) {
        const cli = await getAnalyticsClient();
        analyticsDb = cli.db(ANALYTICS_DB_NAME);
    }
    return analyticsDb;
}

export async function initIndexes(): Promise<void> {
    const database = await getAnalyticsDb();
    const messages = database.collection('messages');
    const chats = database.collection('chats');

    // messages indexes
    await ensureIndex(messages, { key: { wa_message_id: 1 }, name: 'u_wa_message_id', unique: true });
    await ensureIndex(messages, { key: { chat_id: 1, ts_iso: 1 }, name: 'i_chat_ts' });

    // chats indexes
    await ensureIndex(chats, { key: { chat_id: 1 }, name: 'u_chat_id', unique: true });
    await ensureIndex(chats, { key: { last_ts: -1 }, name: 'i_last_ts' });
}

async function ensureIndex(coll: Collection<Document>, idx: IndexDescription & { name: string }): Promise<void> {
    const existing = await coll.indexExists(idx.name).catch(() => false);
    if (!existing) {
        const options: any = { name: idx.name };
        if ((idx as any).unique === true) options.unique = true;
        await coll.createIndex(idx.key as any, options);
        logger.info({ collection: coll.collectionName, index: idx.name }, 'Created index');
    }
}

export async function closeAnalyticsMongo(): Promise<void> {
    if (analyticsClient) {
        await analyticsClient.close();
        analyticsClient = null;
        analyticsDb = null;
    }
}


