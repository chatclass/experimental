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

### API Reference

- **[📋 Modules Overview](https://chatclass.github.io/experimental/modules.html)** - All project modules and their exports
- **[🏗️ Class Hierarchy](https://chatclass.github.io/experimental/hierarchy.html)** - Class inheritance and structure
- **[⚙️ Configuration](https://chatclass.github.io/experimental/modules/config.html)** - Environment and logging configuration
- **[🗄️ Database](https://chatclass.github.io/experimental/modules/db.html)** - MongoDB and PostgreSQL connections
- **[🔄 Evolution](https://chatclass.github.io/experimental/modules/evolution.html)** - Data mapping and transformation
- **[📊 Services](https://chatclass.github.io/experimental/modules/services.html)** - Business logic and data operations
- **[🎯 CLI Commands](https://chatclass.github.io/experimental/modules/cli.html)** - Command-line interface functions
- **[📝 Models](https://chatclass.github.io/experimental/modules/model.html)** - Data schemas and validation

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



