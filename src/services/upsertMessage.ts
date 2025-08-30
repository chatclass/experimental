import { getAnalyticsDb } from '../db/mongo.js';
import { Message } from '../model/message.schema.js';

export async function upsertMessage(doc: Message, helpers: { wa_message_id: string; chat_id: string; sender_jid: string | null; ts_iso: string; instance_id: string; channel_id: string; contact_id: string }): Promise<{ inserted: 0 | 1; updated: 0 | 1 }> {
    const db = await getAnalyticsDb();
    const messages = db.collection('messages');

    const update = {
        $setOnInsert: {
            wa_message_id: helpers.wa_message_id,
            chat_id: helpers.chat_id,
            sender_jid: helpers.sender_jid,
            instance_id: helpers.instance_id,
            channel_id: helpers.channel_id,
            contact_id: helpers.contact_id,
            tenant_id: doc.tenantId,
        },
        $set: {
            canonical: doc,
            ts_iso: helpers.ts_iso,
        },
    };

    const res = await messages.updateOne(
        { wa_message_id: helpers.wa_message_id },
        update,
        { upsert: true }
    );

    const inserted: 0 | 1 = res.upsertedId ? 1 : 0;
    const updated: 0 | 1 = res.matchedCount > 0 && res.modifiedCount > 0 ? 1 : 0;
    return { inserted, updated };
}


