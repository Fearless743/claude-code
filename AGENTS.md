# AGENTS.md — Agent Guidelines for claude-js

## Project Overview

Reverse-engineered Anthropic Claude Code CLI. Runtime: **Bun only**. ~1341 TSC errors from decompilation — these do **not** block runtime. `feature()` is polyfilled to always return `false`.

## Commands

```bash
# Install
bun install

# Dev (direct execution)
bun run dev                    # or: bun run src/entrypoints/cli.tsx
echo "say hello" | bun run src/entrypoints/cli.tsx -p   # pipe mode

# Build (outputs dist/cli.js, ~25MB)
bun run build

# Lint & Format
bun run lint                   # biome lint src/
bun run lint:fix               # biome lint --fix src/
bun run format                 # biome format --write src/

# Check for unused exports/imports
bun run check:unused           # knip-bun

# Tests
bun test                       # run all tests
bun test <path>                # run single test file, e.g. bun test src/utils/__tests__/array.test.ts
bun test --watch               # watch mode
```

**Test framework:** `bun:test` — uses `describe`, `test`, `expect`. Test files live in `__tests__/` dirs with `*.test.ts` naming. No test runner config beyond `bunfig.toml` (10s timeout).

## Code Style

### Formatting (biome.json)

| Rule | Setting |
|------|---------|
| Indent | 2 spaces |
| Quotes | Single (`'`) |
| Semicolons | `asNeeded` for `.ts`, `always` for `.tsx` |
| Trailing commas | `all` |
| Arrow parens | `asNeeded` |
| Line width | 80 for `.ts`, 120 for `.tsx` |
| Line endings | LF |
| Final newline | Yes |

### Imports

- **ESM only** — `"type": "module"`, use `.js` extension in import paths (even for `.ts` files)
- **Path alias**: `src/*` → `./src/*` (e.g., `import { x } from 'src/utils/foo.js'`)
- **Type imports**: Use `import type` for type-only imports
- **Ordering**: External packages first, then internal `./` and `src/` imports
- **Biome override**: `useImportType` is `off` — don't reorganize imports aggressively

### TypeScript

- `strict: false`, `skipLibCheck: true` — loose typing is intentional (decompiled code)
- **Don't fix TSC errors** — they're from decompilation (`unknown`/`never`/`{}` types)
- `noExplicitAny`: off — `any` is acceptable
- `noNonNullAssertion`: off — `!` is acceptable
- Prefer `type` over `interface` for object shapes (codebase convention)
- Generic type params: single uppercase letters (`T`, `K`, `V`)

### Naming Conventions

| Kind | Convention | Example |
|------|-----------|---------|
| Types/Interfaces | PascalCase | `ToolInputJSONSchema`, `PermissionMode` |
| Functions/Variables | camelCase | `findToolByName`, `initialState` |
| Constants | UPPER_SNAKE_CASE | `IMPORT_META_REQUIRE`, `BUILD_TARGET` |
| Files | camelCase or PascalCase | `autoCompact.ts`, `AppState.tsx` |
| Test files | `*.test.ts` | `array.test.ts` |
| Directories | camelCase | `__tests__`, `autoCompact/` |

### Error Handling

- Custom error classes extend `Error` (e.g., `FallbackTriggeredError`, `ImageSizeError`)
- Use `try/catch` with typed error handling
- Log errors via `src/utils/log.ts` (`logError`) or `src/utils/debug.ts` (`logAntError`)
- Don't swallow errors silently — log or rethrow

### React/Ink Components

- React 19 with `react-jsx` transform
- Components use React Compiler runtime (`_c()` memoization calls) — **do not remove these**
- TSX files: semicolons always, line width 120
- Custom Ink framework in `src/ink/` — use `useInput`, `useTerminalSize` hooks

### Biome Linter Rules (mostly off)

Most lint rules are disabled to accommodate decompiled code. Key ones that remain:
- `recommended` rules enabled as baseline
- `noConsole`: off — `console.log` is fine
- `noUnusedVariables`/`noUnusedImports`: off
- `useExhaustiveDependencies`: off
- `noForEach`: off — `.forEach()` is fine

## Architecture Quick Reference

| Layer | Key Files |
|-------|-----------|
| Entrypoint | `src/entrypoints/cli.tsx` |
| CLI definition | `src/main.tsx` |
| API query loop | `src/query.ts`, `src/QueryEngine.ts` |
| API client | `src/services/api/claude.ts` |
| Tool system | `src/Tool.ts`, `src/tools.ts`, `src/tools/*/` |
| UI (Ink) | `src/screens/REPL.tsx`, `src/components/` |
| State | `src/state/AppState.tsx`, `src/state/store.ts` |
| Types | `src/types/message.ts`, `src/types/permissions.ts` |

## Critical Gotchas

1. **Bun runtime only** — no Node.js APIs. Use `Bun.build`, `Bun.file`, etc.
2. **`feature()` always returns `false`** — feature-gated code is dead code
3. **Don't fix TSC errors** — decompilation artifacts, not runtime issues
4. **React Compiler `_c()` calls** — decompiled memoization boilerplate, leave intact
5. **`bun:bundle` import** — resolved by polyfill at dev-time, build-time macro at build
6. **No CI/CD configured** — no lint/test gates, verify manually before committing
