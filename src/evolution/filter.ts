/**
 * Configuration for filtering WhatsApp Evolution messages during import.
 * 
 * This type defines different filtering strategies that can be applied
 * to limit the scope of message imports from PostgreSQL to MongoDB.
 */
export type FilterConfig =
    /** Filter by specific chat IDs (remoteJids) */
    | { type: 'include-remoteJids'; remoteJids: string[] }
    /** Filter by message depth (most recent N messages per chat) */
    | { type: 'depth'; remoteJids?: string[]; depth: number }
    /** Filter by absolute date range */
    | { type: 'absolute'; remoteJids?: string[]; since?: string | null; until?: string | null }
    /** Filter by relative time period (last N days) */
    | { type: 'relative-days'; remoteJids?: string[]; days: number };

/**
 * Current filter configuration for WhatsApp Evolution message imports.
 * 
 * Edit this configuration to change which chats and time ranges are processed
 * during the ingest command execution.
 * 
 * @example
 * ```typescript
 * // Import only specific chats
 * export const filterConfig: FilterConfig = {
 *   type: 'include-remoteJids',
 *   remoteJids: ['19175769740@s.whatsapp.net', '1234567890@s.whatsapp.net']
 * };
 * 
 * // Import last 7 days of all chats
 * export const filterConfig: FilterConfig = {
 *   type: 'relative-days',
 *   days: 7
 * };
 * 
 * // Import messages from specific date range
 * export const filterConfig: FilterConfig = {
 *   type: 'absolute',
 *   since: '2024-01-01T00:00:00Z',
 *   until: '2024-01-31T23:59:59Z'
 * };
 * 
 * // Import only most recent 1000 messages per chat
 * export const filterConfig: FilterConfig = {
 *   type: 'depth',
 *   depth: 1000
 * };
 * ```
 */
export const filterConfig: FilterConfig = {
    type: 'include-remoteJids',
    remoteJids: [], // empty means discover all chats and run full import
};



