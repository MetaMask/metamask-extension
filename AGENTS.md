# AGENTS.md

Instructions for AI coding agents working on MetaMask Browser Extension.

---

## Agent Instructions Summary

**Project Type:** Browser extension (Chrome/Firefox)
**Languages:** TypeScript (required for new code), JavaScript (legacy)
**UI Framework:** React with functional components + hooks
**State Management:** Redux + BaseController architecture
**Testing:** Jest (unit), Playwright (E2E)
**Build System:** Browserify (production), Webpack (development)
**Security:** LavaMoat policies required for all dependency changes

### Critical Rules for Agents

1. **ALWAYS use TypeScript** for new files (never JavaScript)
2. **ALWAYS run `yarn lint:changed:fix`** before committing
3. **ALWAYS update LavaMoat policies** after dependency changes: `yarn lavamoat:auto`
4. **ALWAYS colocate tests** with source files (`.test.ts`/`.test.tsx`)
5. **ALWAYS use yarn.cmd** if you're running in PowerShell
6. **NEVER use class components** (use functional components with hooks)
7. **NEVER modify git config** or run destructive git operations
8. **NEVER commit** unless explicitly requested by user
9. **NEVER stage changes** unless explicitly requested by user
10. **WHEN asked to commit, use Conventional Commits** format for commit messages
11. **WHEN asked to open a PR, use a Conventional Commits title** unless user specifies otherwise
12. **WHEN asked to open a PR, open it as DRAFT** unless user specifies otherwise
13. **WHEN using `.github/pull-request-template.md`, comment out non-applicable sections including the section title**

### Comprehensive Guidelines Location

Read these files for detailed coding standards:

- Controller patterns: `.cursor/rules/controller-guidelines/RULE.md`
- Unit testing standards: `.cursor/rules/unit-testing-guidelines/RULE.md`
- E2E testing standards: `./test/e2e/AGENTS.md`
- Front-end performance:
  - `.cursor/rules/front-end-performance-rendering/RULE.md` (rendering performance - start here)
  - `.cursor/rules/front-end-performance-hooks-effects/RULE.md` (hooks & effects)
  - `.cursor/rules/front-end-performance-react-compiler/RULE.md` (React Compiler & anti-patterns)
  - `.cursor/rules/front-end-performance-state-management/RULE.md` (Redux & state management)
- PR workflow: `.cursor/rules/pull-request-guidelines/RULE.md`
- Code style: `.cursor/rules/coding-guidelines/RULE.md`
- Official guidelines: `.github/guidelines/CODING_GUIDELINES.md`

---

## Common Commands

### Building

```bash
# Development Builds (with file watching and hot reload)
yarn webpack                  # Chrome MV3 (default)
```

### Testing

```bash
# Unit Tests
yarn test                  # Lint + unit tests
yarn test:unit             # Unit tests only
yarn test:unit:watch       # Watch mode
yarn test:unit:coverage    # With coverage report

# E2E Tests
yarn test:e2e:chrome       # Run all E2E tests (Chrome)
yarn test:e2e:firefox      # Run all E2E tests (Firefox)

# Single E2E test with options
yarn test:e2e:single test/e2e/tests/account-menu/account-details.spec.js \
  --browser=chrome \
  --leave-running \
  --debug

# Integration Tests
yarn test:integration
yarn test:integration:coverage

# Playwright Tests
yarn test:e2e:swap         # Swap functionality
yarn test:e2e:global       # Global tests
yarn test:e2e:benchmark    # Performance benchmarks
```

**Testing Notes:**

- Unit tests should be colocated with source files (`.test.ts`/`.test.tsx`)
- Always create a test build before running E2E tests
- Use `--leave-running` to debug failed E2E tests
- See `.cursor/rules/unit-testing-guidelines/RULE.md` for testing standards

### Linting & Formatting

```bash
# Run all linters
yarn lint                  # Prettier + ESLint + TypeScript + Styles + Images

# Individual linters
yarn lint:eslint           # ESLint only
yarn lint:tsc              # TypeScript type checking
yarn lint:prettier         # Prettier formatting check
yarn lint:styles           # Stylelint for SCSS

# Auto-fix
yarn lint:fix              # Fix all auto-fixable issues
yarn lint:eslint:fix       # Fix ESLint issues
yarn lint:prettier:fix     # Fix formatting

# Lint only changed files (faster)
yarn lint:changed
yarn lint:changed:fix
```

### Controller Development Patterns

When creating a controller, follow these critical patterns from `.cursor/rules/controller-guidelines/RULE.md`:

#### State Metadata Requirements

**Every state property MUST have metadata with these properties:**

| Property                                | Type    | Purpose                   | Example Value              |
| --------------------------------------- | ------- | ------------------------- | -------------------------- |
| `anonymous` OR `includeInDebugSnapshot` | boolean | Safe for Sentry? (no PII) | `anonymous: true`          |
| `includeInStateLogs`                    | boolean | Include in state logs?    | `false` for sensitive data |
| `persist`                               | boolean | Save to storage?          | `true` for user data       |
| `usedInUi`                              | boolean | Used by UI?               | `true` if rendered         |

**Example:**

```typescript
const tokensControllerMetadata = {
  tokens: {
    anonymous: true, // No PII, safe for Sentry
    includeInStateLogs: true, // Safe to include in logs
    persist: true, // Should be saved
    usedInUi: true, // Rendered in UI
  },
  apiKey: {
    anonymous: false, // Sensitive
    includeInStateLogs: false, // Must exclude from logs
    persist: true, // But should be saved
    usedInUi: false, // Backend only
  },
};
```

#### Default State Function Pattern

**ALWAYS export function, NEVER export object:**

```typescript
✅ CORRECT: Returns new object each time
export function getDefaultTokensControllerState(): TokensControllerState {
  return {
    tokens: [],
    lastUpdated: 0,
  };
}

❌ WRONG: Shared object reference (mutation risk)
export const defaultTokensControllerState = {
  tokens: [],
  lastUpdated: 0,
};
```

#### Constructor Single Options Bag

**ALWAYS use single options object, NO positional arguments:**

```typescript
✅ CORRECT:
constructor({
  messenger,
  state = {},
  apiKey,        // All options in one bag
  isEnabled,
}: TokensControllerOptions) {
  super({
    name: 'TokensController',
    metadata: tokensControllerMetadata,
    messenger,
    state: { ...getDefaultTokensControllerState(), ...state },
  });
}

❌ WRONG:
constructor(
  options: ControllerOptions,
  apiKey: string,     // Separate positional arg - BAD
  isEnabled: boolean, // Separate positional arg - BAD
) { }
```

#### Action Methods (Not Setters)

**Model high-level user actions, not property changes:**

```typescript
❌ WRONG: Generic setters
setTokenData(data: any) { }
updateField(field: string, value: any) { }

✅ CORRECT: Action-based methods
addToken(token: Token) {
  if (!token.address) {
    throw new Error('Token address required');
  }

  this.update((state) => {
    state.tokens.push(token);
    state.lastUpdated = Date.now();
  });
}

removeToken(address: string) {
  this.update((state) => {
    state.tokens = state.tokens.filter(t => t.address !== address);
    state.lastUpdated = Date.now();
  });
}
```

#### Keep State Minimal - Use Selectors

**NEVER store derived values in state:**

```typescript
❌ WRONG: Derived values in state
type State = {
  tokens: Token[];
  tokenCount: number;  // DON'T STORE - derive it!
  hasTokens: boolean;  // DON'T STORE - derive it!
};

✅ CORRECT: Minimal state + selectors
type State = {
  tokens: Token[];  // Only essential data
};

// Export selectors for derived values
export const tokensControllerSelectors = {
  selectTokens: (state: State) => state.tokens,
  selectTokenCount: (state: State) => state.tokens.length,
  selectHasTokens: (state: State) => state.tokens.length > 0,
};
```

#### Cleanup with destroy()

**Implement if controller has background tasks:**

```typescript
class TokensController extends BaseController</*...*/> {
  #pollInterval: NodeJS.Timeout | null = null;

  constructor(options: Options) {
    super(/* ... */);
    if (options.enablePolling) {
      this.#startPolling();
    }
  }

  destroy() {
    // Clean up resources
    if (this.#pollInterval) {
      clearInterval(this.#pollInterval);
      this.#pollInterval = null;
    }

    // Call super to clean up messenger
    super.destroy();
  }
}
```

**See `.cursor/rules/controller-guidelines/RULE.md` for complete patterns with detailed examples.**

---

### Decision: Which Test Build to Use?

```
IF you need to run E2E tests:
  IF you're iterating/debugging:
    → Use `yarn start:test` (faster, LavaMoat disabled)
  IF you're doing final verification:
    → Use `yarn build:test` (slower, LavaMoat enabled, matches production)

IF you're developing with feature flags:
  → Use `FEATURE_FLAG=1 yarn build:test`
  → Then run E2E: `yarn test:e2e:single path/to/test.spec.js`

IF you're working on Firefox compatibility:
  → Use `yarn build:test:mv2`
  → Then test: `yarn test:e2e:firefox`
```

### Decision: Where to Put New Code?

```
IF creating a controller:
  → app/scripts/controllers/controller-name/

IF creating a UI component:
  → ui/components/component-name/ (for reusable components)
  → ui/pages/page-name/ (for page-level components)

IF creating a utility function:
  → shared/lib/ (if used by both background and UI)
  → app/scripts/lib/ (if only used by background)
  → ui/helpers/ (if only used by UI)

IF creating constants:
  → shared/constants/

IF creating TypeScript types:
  → shared/types/ (for shared types)
  → types/ (for project-wide types)
  → [component-dir]/types.ts (for component-specific types)

IF creating a state migration:
  → Run: yarn generate:migration
  → Edits: app/scripts/migrations/[number].ts
```

### Decision: Which Browser Target?

```
IF user specifies Chrome, Edge, or Brave:
  → Use MV3 (Manifest V3)
  → Commands: yarn start, yarn dist, yarn build:test

IF user specifies Firefox:
  → Use MV2 (Manifest V2)
  → Commands: yarn start:mv2, yarn dist:mv2, yarn build:test:mv2
  → Set ENABLE_MV3=false

IF user doesn't specify:
  → Default to Chrome MV3
  → Use: yarn start
```

---

## Project Structure

### High-Level Directory Layout

```
metamask-extension/
├── app/
│   ├── scripts/           # Background scripts & controllers (860 TS, 234 JS)
│   │   ├── controllers/   # Business logic controllers
│   │   ├── lib/           # Utility libraries
│   │   └── migrations/    # State migration scripts
│   ├── manifest/          # Browser extension manifests (MV2/MV3)
│   ├── images/            # Icons and images
│   └── *.html             # Extension HTML pages
├── ui/                    # React UI code (1,412 TSX, 1,292 JS)
│   ├── components/        # Reusable React components
│   ├── pages/             # Page-level components
│   ├── ducks/             # Redux slices (state management)
│   ├── hooks/             # Custom React hooks
│   ├── selectors/         # Redux selectors
│   └── store/             # Redux store configuration
├── shared/                # Code shared between background and UI
│   ├── constants/         # Shared constants (47 TS files)
│   ├── lib/               # Shared utilities (122 TS files)
│   ├── modules/           # Shared modules (45 TS files)
│   └── types/             # TypeScript type definitions
├── test/                  # Test files (586 TS, 79 JS)
│   ├── e2e/               # End-to-end tests
│   ├── integration/       # Integration tests
│   └── *.test.*           # Unit tests (colocated with source)
├── development/           # Build system and dev tools
│   ├── build/             # Build scripts
│   └── webpack/           # Webpack configuration
├── docs/                  # Documentation (54 files)
└── .cursor/rules/         # AI agent coding guidelines
```

### Finding Specific Code

| What You Need                | Where to Look                                   |
| ---------------------------- | ----------------------------------------------- |
| Controllers (business logic) | `app/scripts/controllers/`                      |
| React Components             | `ui/components/` or `ui/pages/`                 |
| Redux State Management       | `ui/ducks/` (slices) and `ui/selectors/`        |
| Background Scripts           | `app/scripts/`                                  |
| Constants                    | `shared/constants/`                             |
| Utility Functions            | `shared/lib/` or `ui/helpers/`                  |
| Type Definitions             | `shared/types/` or `types/`                     |
| State Migrations             | `app/scripts/migrations/`                       |
| Build Configuration          | `development/build/` and `development/webpack/` |
| Extension Manifests          | `app/manifest/v2/` or `app/manifest/v3/`        |

### Architecture Patterns

**Controllers** (Background Scripts):

- Inherit from `BaseController` (from `@metamask/base-controller`)
- Manage wallet state and business logic
- Communicate via Messenger pattern (pub/sub)
- Use selectors for derived state (not getter methods)
- See `.cursor/rules/controller-guidelines.mdc` for detailed patterns

**React Components** (UI):

- Functional components with hooks (no class components)
- Props destructured in function parameters
- Redux for global state, local state for UI-only data
- Performance optimizations: useMemo, useCallback, React.memo
- Unique IDs as keys (not array index for dynamic lists)
- Organized in component folders with tests, styles, and types
- See `.cursor/rules/coding-guidelines/RULE.md` and `.cursor/rules/front-end-performance-rendering/RULE.md`

**Testing**:

- Unit tests colocated with source files (`.test.ts`)
- Jest for unit tests, Playwright for E2E
- Test files organized with `describe` blocks by method/function
- See `.cursor/rules/unit-testing-guidelines/RULE.md` for testing patterns

### File Modification Patterns

When you modify certain files, you typically need to update related files:

**When modifying a Controller:**

```
app/scripts/controllers/foo/foo-controller.ts → ALSO UPDATE:
├── app/scripts/controllers/foo/foo-controller.test.ts (tests)
├── app/scripts/controllers/foo/types.ts (if types changed)
└── app/scripts/metamask-controller.ts (if adding/removing controller)
```

**When modifying a React Component:**

```
ui/components/foo/foo.tsx → ALSO UPDATE:
├── ui/components/foo/foo.test.tsx (tests)
├── ui/components/foo/foo.types.ts (if props changed)
├── ui/components/foo/foo.stories.tsx (if props changed)
└── ui/components/foo/index.ts (if exports changed)
```

**When modifying Redux State (ducks):**

```
ui/ducks/foo/foo.ts → ALSO UPDATE:
├── ui/ducks/foo/foo.test.ts (tests)
├── ui/selectors/foo.ts (selectors that depend on this state)
└── ui/components/*/foo-component.tsx (components using this state)
```

**When adding/removing dependencies:**

```
package.json → MUST UPDATE:
├── yarn.lock (run yarn install)
├── lavamoat/browserify/*/policy.json (run yarn lavamoat:auto)
├── lavamoat/build-system/policy.json (run yarn lavamoat:auto)
└── attribution.txt (run yarn attributions:generate)
```

**When modifying state shape:**

```
app/scripts/controllers/foo/foo-controller.ts → MUST CREATE:
└── app/scripts/migrations/[next-number].ts (migration for state change)
```
