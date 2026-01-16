# 13. JSON Configuration with Centralised TypeScript Types

Date: 2025-01-15

## Status

Accepted

## Context

The `core/` directory contained configuration data in multiple formats with unclear conventions:

- **JSON files** (`repos.json`, `artefacts.json`) - used by Python CLI and prebuild scripts
- **TypeScript files** (`github-labels-config.ts`, `webui-config.ts`, `microscope-list.ts`) - contained both data and types
- **TypeScript wrapper files** (`repos-and-refs.ts`, `claude-code-config.ts`, `dev-requirements.ts`) - imported JSON and added types, but were unused

This led to several problems:

1. **Inconsistent conventions** - some configs were JSON, some were TS, some had both
2. **Dead code** - TS wrapper files existed but were never imported
3. **Type duplication** - `webui/scripts/prebuild.ts` generated types from JSON at build time, duplicating type definitions
4. **Unclear data flow** - configuration passed through multiple transformations before reaching consumers

## Decision

Adopt a **JSON-first configuration architecture** with a single TypeScript module for types:

### Structure

```
core/
├── repos.json              # Data
├── artefacts.json          # Data
├── github-labels.json      # Data
├── webui-config.json       # Data
├── microscope-list.json    # Data
├── claude-code-config.json # Data
├── dev-requirements.json   # Data
└── index.ts                # Types + typed re-exports
```

### Principles

1. **JSON files are the source of truth for data** - machine-readable, language-agnostic
2. **`core/index.ts` is the source of truth for types** - single location for all TypeScript interfaces
3. **No type generation** - types are authored once in `index.ts`, not generated from JSON
4. **Direct imports** - consumers import from `core/index.ts`, not generated files

### Data Flow

```
core/*.json (data)
     ↓
core/index.ts (types + typed re-exports)
     ↓
consumers (webui, tools, etc.)
```

For webui specifically:
```
core/index.ts
     ↓
webui/src/config/index.ts (transforms to webUiAppContents format)
     ↓
React components
```

## Consequences

### Positive

- **Single source of truth** - JSON for data, `index.ts` for types
- **No dead code** - removed 6 unused TS files
- **Simpler prebuild** - only syncs docs, no config generation
- **Clear conventions** - all config is JSON, all types are in `index.ts`
- **Language-agnostic data** - Python, TypeScript, and other tools can read JSON directly
- **Type safety preserved** - TypeScript consumers get full typing via `index.ts`

### Negative

- **Python type duplication** - `smartem-workspace` still has separate Pydantic schemas that must be manually kept in sync with JSON structure
- **Transformation layer** - webui needs an adapter (`webui/src/config/index.ts`) to transform `repos.json` structure to the format components expect

### Neutral

- **Build dependency** - webui now has a build-time dependency on `core/index.ts` (Vite bundles it, so runtime bundle is still self-contained)

## Files Changed

### Created
- `core/index.ts` - centralised types and re-exports
- `core/github-labels.json` - converted from TS
- `core/webui-config.json` - converted from TS
- `core/microscope-list.json` - converted from TS

### Modified
- `webui/src/config/index.ts` - now imports from `core/index.ts` and transforms
- `webui/scripts/prebuild.ts` - simplified to docs sync only
- `tools/github/sync-labels.ts` - updated import path

### Deleted
- `core/github-labels-config.ts`
- `core/webui-config.ts`
- `core/microscope-list.ts`
- `core/repos-and-refs.ts`
- `core/claude-code-config.ts`
- `core/dev-requirements.ts`
- `webui/src/config/webui-app-contents.ts`

## Future Considerations

1. **JSON Schema validation** - could add `$schema` to JSON files for editor support and validation
2. **Python type generation** - could generate Pydantic models from JSON Schema to eliminate manual sync
3. **Shared validation** - could use JSON Schema as single source for both TS and Python types
