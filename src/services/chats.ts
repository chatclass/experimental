import { getAnalyticsDb } from '../db/mongo.js';

export interface ChatCursorDoc {
    cursor?: {
        last_ts_seconds: number | null;
        last_message_id: string | null;
        updated_at: string;
        imported_count: number;
    };
}

export async function getExistingCursor(tenantId: string, chatId: string): Promise<{ last_ts_seconds: number | null; last_message_id: string | null } | null> {
    const db = await getAnalyticsDb();
    const doc = await db.collection<ChatCursorDoc>('chats').findOne(
        { tenantId, chatId },
        { projection: { _id: 0, cursor: 1 } }
    );
    if (!doc || !doc.cursor) return null;
    return { last_ts_seconds: doc.cursor.last_ts_seconds ?? null, last_message_id: doc.cursor.last_message_id ?? null };
}



