# CLI Documentation

This document provides comprehensive documentation for all CLI commands available in the PG→Mongo Ingest tool.

## Overview

The CLI tool provides three main commands for different data ingestion scenarios:

1. **`ingest`** - Import WhatsApp Evolution data from PostgreSQL to MongoDB
2. **`ingest-hub`** - Import Hub events from MongoDB (with time-based filtering)
3. **`hub-health`** - Check Hub MongoDB connectivity and status

## Command: `ingest`

Imports WhatsApp Evolution messages from PostgreSQL to MongoDB using cursor-based pagination.

### Usage

```bash
npm run dev ingest [options]
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--dry-run` | boolean | `false` | Do not write to MongoDB; map and print messages only |
| `--chat <remoteJid>` | string | `19175769740@s.whatsapp.net` | Process only a single chat (remoteJid) |

### Examples

```bash
# Import all chats with default settings
npm run dev ingest

# Dry run to see what would be imported
npm run dev ingest --dry-run

# Process only a specific chat
npm run dev ingest --chat 19175769740@s.whatsapp.net

# Combine options for targeted import
npm run dev ingest --chat 19175769740@s.whatsapp.net --dry-run
```

### Features

- **Cursor-based pagination**: Resumes interrupted imports from exact position
- **Chat filtering**: Process specific chats or all chats
- **Time-based filtering**: Configured in `src/evolution/filter.ts`
- **Batch processing**: Processes messages in configurable batches
- **Progress tracking**: Logs import progress and statistics

### Filter Configuration

The import behavior is controlled by the filter configuration in `src/evolution/filter.ts`:

```typescript
// Import only specific chats
export const filterConfig: FilterConfig = {
  type: 'include-remoteJids',
  remoteJids: ['19175769740@s.whatsapp.net']
};

// Import last 7 days of all chats
export const filterConfig: FilterConfig = {
  type: 'relative-days',
  days: 7
};

// Import messages from specific date range
export const filterConfig: FilterConfig = {
  type: 'absolute',
  since: '2024-01-01T00:00:00Z',
  until: '2024-01-31T23:59:59Z'
};

// Import only most recent 1000 messages per chat
export const filterConfig: FilterConfig = {
  type: 'depth',
  depth: 1000
};
```

## Command: `ingest-hub`

Imports Hub events from MongoDB with time-based filtering and chat grouping.

### Usage

```bash
npm run dev ingest-hub [options]
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--days <n>` | number | `3` | Limit to last N days |
| `--dry-run` | boolean | `true` | Do not write to MongoDB; map and print only |

### Examples

```bash
# Import events from the last 3 days (default)
npm run dev ingest-hub

# Import events from the last 7 days
npm run dev ingest-hub --days 7

# Dry run to see what would be imported (default behavior)
npm run dev ingest-hub --dry-run

# Actually import the data (disable dry run)
npm run dev ingest-hub --dry-run false
```

### Features

- **Time-based filtering**: Import events from last N days
- **Chat grouping**: Groups events by chat and provides statistics
- **Sample collection**: Collects sample messages for each chat
- **Validation**: Validates messages before processing
- **Detailed logging**: Provides comprehensive import statistics

### Output Format

The command provides detailed statistics for each chat:

```
DRY RUN hub chats summary: { totalChats: 5, totalMessages: 150, days: 3 }
DRY RUN hub chat: { 
  chatId: "wa:wa-16466877999:553195500888", 
  count: 30, 
  firstTs: "2024-01-12T10:00:00.000Z", 
  lastTs: "2024-01-15T15:30:00.000Z", 
  sample: [
    { id: "msg1", ts: "2024-01-12T10:00:00.000Z", role: "user", text: "Hello" },
    { id: "msg2", ts: "2024-01-12T10:01:00.000Z", role: "bot", text: "Hi there!" }
  ]
}
```

## Command: `hub-health`

Checks Hub MongoDB connectivity and provides database statistics.

### Usage

```bash
npm run dev hub-health
```

### Examples

```bash
# Check Hub MongoDB health
npm run dev hub-health

# Example output:
# Hub health OK. Database=data Collection=message Count=15420
```

### Features

- **Connectivity test**: Verifies database connection
- **Collection statistics**: Counts documents in message collection
- **Error reporting**: Provides clear error messages for connection issues
- **Quick diagnostics**: Fast health check for troubleshooting

## Database Connections

### PostgreSQL (WhatsApp Evolution)

- **Connection**: Configured via `PG_CONNECTION` environment variable
- **Database**: Contains WhatsApp Evolution message data
- **Table**: `public."Message"` with WhatsApp-specific schema
- **Features**: Cursor-based pagination, time filtering, chat discovery

### MongoDB (Analytics)

- **Connection**: Configured via `MONGODB_URI` environment variable
- **Database**: `chat_analytics`
- **Collections**: `messages`, `chats`
- **Features**: Canonical message format, indexing, upsert operations

### Hub MongoDB

- **Connection**: Configured via `HUB_MONGODB_URI` environment variable
- **Database**: `data`
- **Collection**: `message` (Hub events)
- **Features**: Time-based filtering, event processing

## Environment Variables

Required environment variables:

```bash
# PostgreSQL (WhatsApp Evolution)
PG_CONNECTION=postgres://user:pass@host:5432/db

# MongoDB (Analytics)
MONGODB_URI=mongodb://localhost:27017

# Hub MongoDB
HUB_MONGODB_URI=mongodb://localhost:27017

# Application
TENANT_ID=default
ENV_NAME=dev
NODE_ENV=development
```

## Error Handling

All commands include comprehensive error handling:

- **Database connection errors**: Clear error messages with connection details
- **Validation errors**: Logged warnings for invalid messages
- **Processing errors**: Graceful handling with detailed error context
- **Resource cleanup**: Proper connection cleanup in finally blocks

## Performance Considerations

- **Batch processing**: Configurable batch sizes for memory management
- **Cursor pagination**: Efficient processing of large datasets
- **Connection pooling**: Reuses database connections
- **Progress logging**: Minimal logging during processing for performance

## Troubleshooting

### Common Issues

1. **Connection errors**: Check environment variables and network connectivity
2. **Validation failures**: Review message format and schema requirements
3. **Memory issues**: Reduce batch size in configuration
4. **Performance**: Use appropriate filter configurations to limit data scope

### Debug Mode

Enable detailed logging by setting:

```bash
NODE_ENV=development
```

This provides verbose logging for troubleshooting import issues.
