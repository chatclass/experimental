import { runQuery } from '../db/postgres.js';
import { EvolutionMessageRow } from './types.js';

/**
 * Cursor for pagination through WhatsApp Evolution messages.
 * 
 * Used to track the last processed message position to enable resuming
 * imports from where they left off. The cursor is stored per chat and
 * updated after each batch is processed.
 * 
 * @example
 * ```typescript
 * const cursor: ChatCursor = {
 *   last_ts_seconds: 1701111559,
 *   last_message_id: "wamid.HBgMNTUzMTk1NTAwODg4FQIAEhgWM0VCMEMwRERGRkMwOEVDNjZFRjEyMQA="
 * };
 * ```
 */
export interface ChatCursor {
    /** Unix timestamp in seconds of the last processed message */
    last_ts_seconds: number | null;
    /** WhatsApp message ID of the last processed message */
    last_message_id: string | null;
}

/**
 * Discovers all unique chat IDs from the WhatsApp Evolution PostgreSQL database.
 * 
 * This function queries the Message table to find all distinct remoteJid values,
 * which represent unique chat conversations. The results are filtered to remove
 * null/empty values and limited to prevent memory issues with large datasets.
 * 
 * @param limit - Maximum number of chat IDs to return (default: 10000)
 * @returns Promise resolving to an array of chat ID strings
 * 
 * @example
 * ```typescript
 * const chatIds = await discoverChatIds(1000);
 * console.log(`Found ${chatIds.length} chats`);
 * // Output: Found 500 chats
 * ```
 */
export async function discoverChatIds(limit = 10000): Promise<string[]> {
    const sql = `
    SELECT DISTINCT "key"->>'remoteJid' AS chat_id
    FROM public."Message"
    WHERE "key"->>'remoteJid' IS NOT NULL
    LIMIT $1
  `;
    const res = await runQuery<{ chat_id: string }>(sql, [limit]);
    return res.rows.map((r) => r.chat_id).filter(Boolean);
}

/**
 * Reads a batch of WhatsApp Evolution messages for a specific chat using cursor-based pagination.
 * 
 * This function implements efficient pagination by using a cursor that tracks the last
 * processed message position. It supports filtering by time bounds and ensures
 * consistent ordering for reliable resumption.
 * 
 * The cursor-based approach allows for:
 * - Resuming interrupted imports from the exact position
 * - Processing large datasets without loading everything into memory
 * - Consistent results even if new messages are added during processing
 * 
 * @param chat_id - The chat ID to read messages for (null for all chats)
 * @param cursor - Cursor object tracking the last processed message position
 * @param batchSize - Number of messages to read in this batch
 * @param bounds - Optional time bounds for filtering messages
 * @param bounds.sinceSeconds - Start timestamp in seconds (inclusive)
 * @param bounds.untilSeconds - End timestamp in seconds (inclusive)
 * @returns Promise resolving to an array of EvolutionMessageRow objects
 * 
 * @example
 * ```typescript
 * const cursor: ChatCursor = { last_ts_seconds: null, last_message_id: null };
 * const bounds = { sinceSeconds: 1701111559, untilSeconds: 1701197959 };
 * 
 * const messages = await readBatchByChat(
 *   "19175769740@s.whatsapp.net",
 *   cursor,
 *   100,
 *   bounds
 * );
 * 
 * // Update cursor for next batch
 * if (messages.length > 0) {
 *   const last = messages[messages.length - 1];
 *   cursor.last_ts_seconds = last.messageTimestamp;
 *   cursor.last_message_id = last.key?.id;
 * }
 * ```
 */
export async function readBatchByChat(
    chat_id: string | null,
    cursor: ChatCursor,
    batchSize: number,
    bounds?: { sinceSeconds?: number | null; untilSeconds?: number | null }
): Promise<EvolutionMessageRow[]> {
    const sql = `
    SELECT id, "key", "pushName", participant, "messageType", message,
           "contextInfo", "source", "messageTimestamp", "instanceId"
    FROM public."Message"
    WHERE ($1::text IS NULL OR "key"->>'remoteJid' = $1)
      AND (
            $2::int4 IS NULL
         OR "messageTimestamp" > $2
         OR ("messageTimestamp" = $2 AND "key"->>'id' > $3)
        )
      AND ($5::int4 IS NULL OR "messageTimestamp" >= $5)
      AND ($6::int4 IS NULL OR "messageTimestamp" <= $6)
    ORDER BY "messageTimestamp" ASC, "key"->>'id' ASC
    LIMIT $4
  `;
    const res = await runQuery<EvolutionMessageRow>(sql, [
        chat_id,
        cursor.last_ts_seconds,
        cursor.last_message_id,
        batchSize,
        bounds?.sinceSeconds ?? null,
        bounds?.untilSeconds ?? null,
    ]);
    return res.rows;
}

/**
 * Gets metadata about the most recent message in a specific chat.
 * 
 * This function is used to determine the latest message timestamp and ID
 * for a chat, which is useful for:
 * - Setting up relative time filters (e.g., "last N days")
 * - Determining the end boundary for import ranges
 * - Validating cursor positions
 * 
 * @param chat_id - The chat ID to get the latest message for
 * @returns Promise resolving to message metadata or null if no messages exist
 * 
 * @example
 * ```typescript
 * const latest = await getLatestMessageMeta("19175769740@s.whatsapp.net");
 * if (latest) {
 *   console.log(`Latest message: ${latest.message_id} at ${new Date(latest.ts_seconds * 1000)}`);
 * }
 * ```
 */
export async function getLatestMessageMeta(chat_id: string): Promise<{ ts_seconds: number; message_id: string } | null> {
    const sql = `
    SELECT "messageTimestamp" AS ts_seconds, "key"->>'id' AS message_id
    FROM public."Message"
    WHERE "key"->>'remoteJid' = $1
    ORDER BY "messageTimestamp" DESC, "key"->>'id' DESC
    LIMIT 1
  `;
    const res = await runQuery<{ ts_seconds: number; message_id: string }>(sql, [chat_id]);
    return res.rows[0] || null;
}

/**
 * Gets metadata about the Nth most recent message in a specific chat.
 * 
 * This function is used to implement "depth-based" filtering, where you want
 * to import only the most recent N messages from a chat. It's useful for:
 * - Limiting import scope to recent activity
 * - Testing with a subset of data
 * - Incremental imports focusing on recent messages
 * 
 * @param chat_id - The chat ID to get the boundary message for
 * @param depth - How many messages back from the latest to go (1 = second most recent)
 * @returns Promise resolving to message metadata or null if fewer than depth+1 messages exist
 * 
 * @example
 * ```typescript
 * // Get the 100th most recent message (start import from there)
 * const boundary = await getNthMostRecentBoundary("19175769740@s.whatsapp.net", 100);
 * if (boundary) {
 *   console.log(`Importing from message ${boundary.message_id} onwards`);
 * }
 * ```
 */
export async function getNthMostRecentBoundary(chat_id: string, depth: number): Promise<{ ts_seconds: number; message_id: string } | null> {
    if (depth <= 0) return null;
    const sql = `
    SELECT "messageTimestamp" AS ts_seconds, "key"->>'id' AS message_id
    FROM public."Message"
    WHERE "key"->>'remoteJid' = $1
    ORDER BY "messageTimestamp" DESC, "key"->>'id' DESC
    OFFSET $2 LIMIT 1
  `;
    const res = await runQuery<{ ts_seconds: number; message_id: string }>(sql, [chat_id, depth]);
    // If there are fewer than depth+1 rows, boundary is null -> start from beginning
    return res.rows[0] || null;
}


