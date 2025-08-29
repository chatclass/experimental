export function extractTextAndCaption(messageType: string, message: any): { text: string; message_type?: string } {
    try {
        if (messageType === 'conversation') {
            const text = message?.conversation;
            if (typeof text === 'string' && text.length > 0) return { text };
        }
        const extText = message?.extendedTextMessage?.text;
        if (typeof extText === 'string' && extText.length > 0) {
            return { text: extText };
        }
        const caption = message?.imageMessage?.caption;
        if (typeof caption === 'string' && caption.length > 0) {
            return { text: caption };
        }
    } catch {
        // fallthrough
    }
    return { text: `[non-text:${messageType}]`, message_type: messageType };
}



