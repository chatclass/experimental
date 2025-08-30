import { getAnalyticsDb } from '../db/mongo.js';
import { Chat } from '../model/chat.schema.js';

export interface ChatUpsertInput {
    tenantId: string;
    chatId: string;
    last_ts_seconds: number | null;
    last_message_id: string | null;
    batch_imported_count: number;
    first_ts_iso_in_batch: string | null;
    last_ts_iso_in_batch: string | null;
    top_sender_contact_ids_in_batch: string[];
}

export async function upsertChat(input: ChatUpsertInput): Promise<void> {
    const db = await getAnalyticsDb();
    const chats = db.collection<Chat>('chats');

    const nowIso = new Date().toISOString();

    const update = {
        $setOnInsert: {
            schemaVersion: 1 as const,
            tenantId: input.tenantId,
            chatId: input.chatId,
            version: 1,
            state: 'active' as const,
            createdAt: nowIso,
            participants: { userIds: [], agentIds: [], botIds: [] },
            connections: [{ channel: 'whatsapp' as const, providerConversationId: input.chatId }],
            memory: {},
            participant_count: 0,
            first_ts: input.first_ts_iso_in_batch ?? nowIso,
            last_ts: input.last_ts_iso_in_batch ?? nowIso,
            top_senders: [],
        },
        $set: {
            lastActivityAt: input.last_ts_iso_in_batch ?? nowIso,
            'cursor.last_ts_seconds': input.last_ts_seconds,
            'cursor.last_message_id': input.last_message_id,
            'cursor.updated_at': nowIso,
        },
        $inc: {
            'cursor.imported_count': input.batch_imported_count,
            message_count: input.batch_imported_count,
        },
    } as any;

    if (input.first_ts_iso_in_batch) {
        update.$min = { ...(update.$min || {}), first_ts: input.first_ts_iso_in_batch };
    }
    if (input.last_ts_iso_in_batch) {
        update.$max = { ...(update.$max || {}), last_ts: input.last_ts_iso_in_batch };
    }

    // top_senders maintenance disabled per request
    // if (input.top_sender_contact_ids_in_batch.length > 0) {
    //   const addToSet = input.top_sender_contact_ids_in_batch.map((id) => ({ contact_id: id, count: 0 }));
    //   update.$addToSet = { ...(update.$addToSet || {}), top_senders: { $each: addToSet } };
    // }

    // Avoid conflict between $setOnInsert.message_count and $inc.message_count
    // Phase 1: ensure doc exists with message_count initialized (no $inc in this op)
    const existing = await chats.findOne(
        { tenantId: input.tenantId, chatId: input.chatId },
        { projection: { _id: 1 } }
    );

    if (!existing) {
        const initial: any = {
            $setOnInsert: { ...(update as any).$setOnInsert, message_count: 0 },
            $set: (update as any).$set,
        };
        // Do NOT apply $min/$max in the same op as $setOnInsert of the same fields to avoid conflicts
        await chats.updateOne(
            { tenantId: input.tenantId, chatId: input.chatId },
            initial,
            { upsert: true }
        );
    }

    // Phase 2: apply increments and the rest (safe on both first and subsequent passes)
    const second: any = {
        $inc: (update as any).$inc,
        $set: (update as any).$set,
    };
    if ((update as any).$min) second.$min = (update as any).$min;
    if ((update as any).$max) second.$max = (update as any).$max;
    // top_senders maintenance disabled
    await chats.updateOne(
        { tenantId: input.tenantId, chatId: input.chatId },
        second,
        { upsert: false }
    );
}


