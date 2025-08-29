// Export interface and a permissive JSON Schema object for AJV runtime

export interface Chat {
    schemaVersion: 1;
    tenantId: string;
    chatId: string;
    version: number;
    state: 'virgin' | 'active' | 'inactive' | 'closed' | 'archived';
    createdAt: string;
    lastActivityAt: string;
    participants: {
        userIds: string[];
        agentIds: string[];
        botIds: string[];
    };
    connections: Array<{
        channel: 'whatsapp' | 'telegram' | 'instagram' | 'twilio_sms' | 'twilio_rcs' | 'chatwoot' | 'email' | 'webhook' | 'system' | 'other';
        providerConversationId: string;
    }>;
    memory: Record<string, unknown>;
    cursor: {
        last_ts_seconds: number | null;
        last_message_id: string | null;
        updated_at: string;
        imported_count: number;
    };
    message_count: number;
    participant_count: number;
    first_ts: string;
    last_ts: string;
    top_senders: Array<{ contact_id: string; count: number }>;
}

export const chatSchema: Record<string, any> = {
    $id: 'Chat',
    type: 'object',
    properties: {
        schemaVersion: { type: 'number', const: 1 },
        tenantId: { type: 'string' },
        chatId: { type: 'string' },
        version: { type: 'number' },
        state: { type: 'string', enum: ['virgin', 'active', 'inactive', 'closed', 'archived'] },
        createdAt: { type: 'string', format: 'date-time' },
        lastActivityAt: { type: 'string', format: 'date-time' },
        participants: {
            type: 'object',
            properties: {
                userIds: { type: 'array', items: { type: 'string' } },
                agentIds: { type: 'array', items: { type: 'string' } },
                botIds: { type: 'array', items: { type: 'string' } },
            },
            required: ['userIds', 'agentIds', 'botIds'],
            additionalProperties: false,
        },
        connections: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    channel: { type: 'string', enum: ['whatsapp', 'telegram', 'instagram', 'twilio_sms', 'twilio_rcs', 'chatwoot', 'email', 'webhook', 'system', 'other'] },
                    providerConversationId: { type: 'string' },
                },
                required: ['channel', 'providerConversationId'],
                additionalProperties: false,
            },
        },
        memory: { type: 'object', additionalProperties: true },
        cursor: {
            type: 'object',
            properties: {
                last_ts_seconds: { type: ['number', 'null'] },
                last_message_id: { type: ['string', 'null'] },
                updated_at: { type: 'string', format: 'date-time' },
                imported_count: { type: 'number' },
            },
            required: ['last_ts_seconds', 'last_message_id', 'updated_at', 'imported_count'],
            additionalProperties: false,
        },
        message_count: { type: 'number' },
        participant_count: { type: 'number' },
        first_ts: { type: 'string', format: 'date-time' },
        last_ts: { type: 'string', format: 'date-time' },
        top_senders: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    contact_id: { type: 'string' },
                    count: { type: 'number' },
                },
                required: ['contact_id', 'count'],
                additionalProperties: false,
            },
        },
    },
    required: ['schemaVersion', 'tenantId', 'chatId', 'version', 'state', 'createdAt', 'lastActivityAt', 'participants', 'connections', 'memory', 'cursor', 'message_count', 'participant_count', 'first_ts', 'last_ts', 'top_senders'],
    additionalProperties: false,
};

// Validation is wired in validators.ts to avoid ESM type issues


