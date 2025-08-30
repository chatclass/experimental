import { Message } from '../model/message.schema.js';
import { extractTextAndCaption } from './extract.js';
import { EvolutionMessageRow, MapperContext } from './types.js';

export function mapEvolutionRowToMessage(row: EvolutionMessageRow, ctx: MapperContext): { msg: Message; helpers: { wa_message_id: string; chat_id: string; sender_jid: string | null; ts_iso: string; instance_id: string; channel_id: string; contact_id: string } } {
    const chat_id = String(row.key?.remoteJid || row.key?.['remoteJid'] || '');
    const wa_message_id = String(row.key?.id || row.key?.['id'] || row.id);
    const from_me = Boolean(row.key?.fromMe || row.key?.['fromMe']);
    const sender_jid = (row.key?.participant || row.key?.['participant'] || row.participant || null) as string | null;

    const direction = from_me ? 'outbound' : 'inbound';
    const createdAt = new Date(row.messageTimestamp * 1000).toISOString();
    const { text } = extractTextAndCaption(row.messageType, row.message);

    const sender = from_me
        ? { channelId: chat_id, role: 'bot' as const, displayName: null }
        : { channelId: sender_jid || chat_id, role: 'user' as const, displayName: row.pushName || null };

    const messageId = wa_message_id; // we use provider id as canonical id in v1

    const canonical: Message = {
        schemaVersion: 1,
        tenantId: ctx.tenantId,
        messageId,
        chatId: chat_id,
        correlationId: null,
        causationMessageId: null,
        channel: 'whatsapp',
        direction,
        type: 'message',
        origin: 'provider',
        createdAt,
        sender,
        recipients: [],
        content: { text },
        context: row.contextInfo || null,
        raw: {
            key: row.key,
            message: row.message,
            messageType: row.messageType,
            pushName: row.pushName,
            participant: row.participant,
            messageTimestamp: row.messageTimestamp,
            instanceId: row.instanceId,
            source: row.source,
        },
        derived: [],
    };

    const instance_id = row.instanceId;
    const channel_id = ctx.channel_id;
    const contact_id = (sender_jid || chat_id || '').split('@')[0] || '';
    const ts_iso = createdAt;

    return {
        msg: canonical,
        helpers: { wa_message_id, chat_id, sender_jid, ts_iso, instance_id, channel_id, contact_id },
    };
}



