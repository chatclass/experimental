import { Message } from '../model/message.schema.js';

export function mapHubEventToMessage(ev: any, ctx: { tenantId: string }): { msg: Message; helpers: { wa_message_id: string; chat_id: string; sender_jid: string | null; ts_iso: string; instance_id: string; channel_id: string; contact_id: string } } {
    const chat_id = String(
        ev?.message?.user?.sessionId || ev?.session?.sessionId || ev?.message?.user?.externalId || ''
    );
    const wa_message_id = String(ev?.message?.id || ev?.rawMessage?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id || '');
    const timestampSeconds = Number(ev?.message?.timestamp || ev?.rawMessage?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.timestamp || Date.now() / 1000);
    const createdAt = new Date(Math.floor(timestampSeconds) * 1000).toISOString();
    const text = (ev?.message?.content?.body
        || ev?.rawMessage?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body
        || '').toString();

    const inbound = String(ev?.type || '').toUpperCase().includes('USER');

    const waId = String(ev?.message?.user?.waId || ev?.from?.userId || ev?.session?.user?.waId || '');
    const displayName = ev?.message?.user?.name || ev?.rawMessage?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name || null;

    const sender = inbound
        ? { channelId: waId || chat_id, role: 'user' as const, displayName }
        : { channelId: chat_id, role: 'bot' as const, displayName: null };

    const msg: Message = {
        schemaVersion: 1,
        tenantId: ctx.tenantId,
        messageId: wa_message_id,
        chatId: chat_id,
        correlationId: null,
        causationMessageId: null,
        channel: 'whatsapp',
        direction: inbound ? 'inbound' : 'outbound',
        type: 'message',
        origin: 'provider',
        createdAt,
        sender,
        recipients: [],
        content: { text },
        context: ev?.session || null,
        raw: ev,
        derived: [],
    };

    const instance_id = String(ev?.from?.instance || ev?.message?.user?.sessionId || '');
    const channel_id = `hub:${String(ev?.from?.type || 'wa')}:${instance_id || 'unknown'}`;
    const contact_id = waId || '';
    const sender_jid = waId || null;
    const ts_iso = createdAt;

    return { msg, helpers: { wa_message_id, chat_id, sender_jid, ts_iso, instance_id, channel_id, contact_id } };
}


