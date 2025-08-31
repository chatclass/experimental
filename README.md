# PG→Mongo Ingest v1

A command-line tool for ingesting WhatsApp Evolution data from PostgreSQL to MongoDB and Hub events from MongoDB.

## Quick Start

```bash
npm run dev
```

## Documentation

- **[📖 Full Documentation](https://chatclass.github.io/experimental/)** - Complete API documentation hosted on GitHub Pages
- **[🔧 CLI Documentation](CLI_DOCUMENTATION.md)** - Comprehensive guide to all CLI commands and options
- **[📚 Documentation Guide](DOCUMENTATION.md)** - How to use and customize TypeDoc

## Environment Variables

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

## Available Commands

- `ingest` - Import WhatsApp Evolution data from PostgreSQL to MongoDB
- `ingest-hub` - Import Hub events from MongoDB with time-based filtering
- `hub-health` - Check Hub MongoDB connectivity and status

## Configuration

Edit filter configuration in `src/evolution/filter.ts` to control import behavior.



