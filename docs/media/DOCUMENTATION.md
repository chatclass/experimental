# Documentation

This project uses [TypeDoc](https://typedoc.org/) to generate API documentation from TypeScript source code.

## Generating Documentation

### Generate Documentation
```bash
npm run docs
```

This will generate documentation in the `docs/` directory.

### Watch Mode
```bash
npm run docs:watch
```

This will watch for file changes and regenerate documentation automatically.

## Configuration

The TypeDoc configuration is in `typedoc.json`. Key settings:

- **Entry Points**: `src/index.ts` - the main entry point for documentation
- **Output**: `docs/` directory
- **Theme**: Default theme with markdown plugin
- **Exclusions**: Test files, node_modules, and dist directory
- **Categories**: Organized by CLI Commands, Database, Data Models, Services, Configuration

## Adding Documentation

### JSDoc Comments

Add JSDoc comments to your functions, classes, and interfaces:

```typescript
/**
 * Registers a new CLI command
 * 
 * @param program - The Commander.js program instance
 * @param name - The command name
 * @param description - Command description
 * 
 * @example
 * ```bash
 * npm run dev my-command
 * ```
 */
export function registerCommand(program: Command, name: string, description: string) {
  // implementation
}
```

### Package Documentation

Use `@packageDocumentation` to document the main module:

```typescript
/**
 * Main module description
 * 
 * This module provides...
 * 
 * @packageDocumentation
 */
```

### Type Documentation

Document interfaces and types:

```typescript
/**
 * Configuration options for the application
 */
export interface Config {
  /** Database connection string */
  databaseUrl: string;
  /** API key for external service */
  apiKey?: string;
}
```

## Viewing Documentation

After generation, you can:

1. Open `docs/README.md` for the main documentation
2. Open `docs/globals.md` for API reference
3. Use a markdown viewer or convert to HTML for better viewing

## Customization

To customize the documentation:

1. Edit `typedoc.json` for configuration changes
2. Add more JSDoc comments to your code
3. Modify the markdown plugin settings if needed

## Integration with CI/CD

You can integrate documentation generation into your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Generate Documentation
  run: npm run docs
- name: Deploy Documentation
  run: |
    # Deploy docs/ to GitHub Pages or other hosting
```
