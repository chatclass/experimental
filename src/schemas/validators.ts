import { messageSchema, Message } from './message.schema.js';
import { chatSchema, Chat } from './chat.schema.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let validateMessageFn: any | null = null;
let validateChatFn: any | null = null;

function getAjv(): any {
    const Ajv: any = require('ajv');
    const addFormats: any = require('ajv-formats');
    const ajv: any = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    return ajv;
}

export async function validateMessage(doc: Message): Promise<{ valid: boolean; errors: any }> {
    if (!validateMessageFn) {
        const ajv = getAjv();
        validateMessageFn = ajv.compile(messageSchema);
    }
    const valid = !!validateMessageFn(doc);
    return { valid, errors: validateMessageFn.errors };
}

export async function validateChat(doc: Chat): Promise<{ valid: boolean; errors: any }> {
    if (!validateChatFn) {
        const ajv = getAjv();
        validateChatFn = ajv.compile(chatSchema);
    }
    const valid = !!validateChatFn(doc);
    return { valid, errors: validateChatFn.errors };
}


