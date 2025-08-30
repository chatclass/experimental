// Export interface and a permissive JSON Schema object for AJV runtime

export interface Message {
    schemaVersion: 1;
    tenantId: string;
    messageId: string;
    chatId: string;
    correlationId?: string | null;
    causationMessageId?: string | null;
    channel: 'whatsapp' | 'telegram' | 'instagram' | 'twilio_sms' | 'twilio_rcs' | 'chatwoot' | 'email' | 'webhook' | 'system' | 'other';
    direction: 'inbound' | 'outbound';
    type: 'message' | 'status' | 'system';
    origin: 'provider' | 'internal';
    createdAt: string;
    sender: {
        channelId: string;
        role: 'user' | 'agent' | 'bot' | 'system';
        displayName?: string | null;
    };
    recipients: Array<{
        channelId: string;
        role: 'user' | 'agent' | 'bot' | 'system';
        displayName?: string | null;
    }>;
    content: Record<string, unknown>;
    context?: Record<string, unknown> | null;
    raw: unknown;
    derived: Array<{
        source: string;
        kind: 'asr' | 'ocr' | 'nlp' | 'moderation' | 'translation' | 'summary' | 'tagging' | 'other';
        ts: string;
        data: unknown;
        meta?: Record<string, unknown> | null;
    }>;
}

export const messageSchema: Record<string, any> = {
    $id: 'Message',
    type: 'object',
    properties: {
        schemaVersion: { type: 'number', const: 1 },
        tenantId: { type: 'string' },
        messageId: { type: 'string' },
        chatId: { type: 'string' },
        correlationId: { type: 'string', nullable: true },
        causationMessageId: { type: 'string', nullable: true },
        channel: { type: 'string', enum: ['whatsapp', 'telegram', 'instagram', 'twilio_sms', 'twilio_rcs', 'chatwoot', 'email', 'webhook', 'system', 'other'] },
        direction: { type: 'string', enum: ['inbound', 'outbound'] },
        type: { type: 'string', enum: ['message', 'status', 'system'] },
        origin: { type: 'string', enum: ['provider', 'internal'] },
        createdAt: { type: 'string', format: 'date-time' },
        sender: {
            type: 'object',
            properties: {
                channelId: { type: 'string' },
                role: { type: 'string', enum: ['user', 'agent', 'bot', 'system'] },
                displayName: { type: 'string', nullable: true },
            },
            required: ['channelId', 'role'],
            additionalProperties: false,
        },
        recipients: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    channelId: { type: 'string' },
                    role: { type: 'string', enum: ['user', 'agent', 'bot', 'system'] },
                    displayName: { type: 'string', nullable: true },
                },
                required: ['channelId', 'role'],
                additionalProperties: false,
            },
        },
        content: { type: 'object', additionalProperties: true },
        context: { type: ['object', 'null'], additionalProperties: true },
        raw: {},
        derived: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    source: { type: 'string' },
                    kind: { type: 'string', enum: ['asr', 'ocr', 'nlp', 'moderation', 'translation', 'summary', 'tagging', 'other'] },
                    ts: { type: 'string', format: 'date-time' },
                    data: {},
                    meta: { type: 'object', nullable: true, additionalProperties: true },
                },
                required: ['source', 'kind', 'ts', 'data'],
                additionalProperties: false,
            },
        },
    },
    required: ['schemaVersion', 'tenantId', 'messageId', 'chatId', 'channel', 'direction', 'type', 'origin', 'createdAt', 'sender', 'recipients', 'content', 'raw', 'derived'],
    additionalProperties: false,
};

// Validation is wired in validators.ts to avoid ESM type issues


