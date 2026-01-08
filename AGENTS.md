# AGENTS.md

Instructions for AI coding agents working on MetaMask Browser Extension.

---

## Agent Instructions Summary

**Project Type:** Browser extension (Chrome/Firefox)
**Languages:** TypeScript (required for new code), JavaScript (legacy)
**UI Framework:** React 17 with functional components + hooks
**State Management:** Redux + BaseController architecture
**Testing:** Jest (unit), Playwright (E2E)
**Build System:** Browserify (production), Webpack (development)
**Security:** LavaMoat policies required for all dependency changes

### Critical Rules for Agents

1. **ALWAYS use TypeScript** for new files (never JavaScript)
2. **ALWAYS run `yarn lint:changed:fix`** before committing
3. **ALWAYS update LavaMoat policies** after dependency changes: `yarn lavamoat:auto`
4. **ALWAYS colocate tests** with source files (`.test.ts`/`.test.tsx`)
5. **NEVER use class components** (use functional components with hooks)
6. **NEVER modify git config** or run destructive git operations
7. **NEVER commit** unless explicitly requested by user
8. **NEVER stage changes** unless explicitly requested by user
9. **NEVER use array index as key** in dynamic lists (use unique IDs)

### Comprehensive Guidelines Location

Read these files for detailed coding standards:

- Controller patterns: `.cursor/rules/controller-guidelines/RULE.md`
- Unit testing standards: `.cursor/rules/unit-testing-guidelines/RULE.md`
- E2E testing standards: `.cursor/rules/e2e-testing-guidelines/RULE.md`
- Front-end performance:
  - `.cursor/rules/front-end-performance-rendering/RULE.md` (rendering performance - start here)
  - `.cursor/rules/front-end-performance-hooks-effects/RULE.md` (hooks & effects)
  - `.cursor/rules/front-end-performance-react-compiler/RULE.md` (React Compiler & anti-patterns)
  - `.cursor/rules/front-end-performance-state-management/RULE.md` (Redux & state management)
- PR workflow: `.cursor/rules/pull-request-guidelines/RULE.md`
- Code style: `.cursor/rules/coding-guidelines/RULE.md`
- Official guidelines: `.github/guidelines/CODING_GUIDELINES.md`

---

## Quick Setup

### Prerequisites

- **Node.js+** (use `nvm use` to auto-select development version specified in `.nvmrc`)
- **Yarn** (managed by Corepack, included with Node.js)
- **Infura API Key** (free at https://infura.io)

### First-Time Setup

```bash
# 1. Enable Corepack (manages Yarn)
corepack enable

# 2. Install dependencies
yarn install

# 3. Copy and configure environment
cp .metamaskrc.dist .metamaskrc

# 4. Edit .metamaskrc and add your Infura API key
# INFURA_PROJECT_ID=your_key_here

# 5. Start development build (Chrome/Chromium with MV3)
yarn start

# 6. Load extension in browser
# Chrome: See docs/add-to-chrome.md
# Firefox: See docs/add-to-firefox.md
```

### Optional Configuration

In `.metamaskrc`, you can also configure:

- `PASSWORD` - Auto-fill development wallet password
- `SEGMENT_WRITE_KEY` - For MetaMetrics debugging
- `SENTRY_DSN` - For error tracking debugging

### Common Setup Issues

| Issue                            | Solution                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `command not found: yarn`        | Run `corepack enable`                                                                                   |
| Build fails with policy errors   | Run `yarn lavamoat:auto`                                                                                |
| Invalid Infura key error         | Check `INFURA_PROJECT_ID` in `.metamaskrc`                                                              |
| Ganache won't start              | Ensure port 8545 is available                                                                           |
| Git hooks not working in VS Code | Follow [Husky troubleshooting](https://typicode.github.io/husky/troubleshooting.html#command-not-found) |

---

## Common Commands

### Building

```bash
# Development Builds (with file watching and hot reload)
yarn start                  # Chrome MV3 (default)
yarn start:mv2             # Firefox MV2
yarn start:flask           # Flask build (beta features)
yarn start:with-state      # Start with preloaded wallet state

# Production Builds
yarn dist                  # Chrome MV3
yarn dist:mv2              # Firefox MV2

# Test Builds (for E2E testing)
yarn build:test            # Build with LavaMoat enabled
yarn start:test            # Build with LavaMoat disabled (faster iteration)
yarn build:test:flask      # Flask test build
yarn build:test:mv2        # Firefox MV2 test build

# Download pre-built test builds (fastest)
yarn download-builds --build-type test
```

**Build System Notes:**

- `yarn start` uses Webpack (faster, development)
- `yarn dist` uses Browserify + LavaMoat (production)
- `--apply-lavamoat=false` flag speeds up development builds
- Test builds are required for E2E tests (not dev builds)

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

### Development Tools

```bash
# Test Dapps
yarn dapp                  # Start test dapp on :8080
yarn dapp-multichain       # Multichain test dapp
yarn dapp-solana           # Solana test dapp
yarn dapp-chain            # Dapp with local Ganache

# DevTools
yarn devtools:react        # React DevTools
yarn devtools:redux        # Redux DevTools
yarn start:dev             # Start with both DevTools

# Local Blockchain
yarn ganache:start         # Start Ganache on port 8545
yarn anvil                 # Start Anvil (Foundry)

# Storybook
yarn storybook             # Component documentation/development
yarn storybook:build       # Build static storybook

# Git Hooks
yarn githooks:install      # Install pre-commit hooks
```

### Dependency Management

```bash
# When adding/updating/removing dependencies:

# 1. Install/update package
yarn add package-name
yarn upgrade package-name

# 2. Deduplicate lockfile
yarn lint:lockfile:dedupe:fix

# 3. Update allow-scripts (determines which install scripts can run)
yarn allow-scripts auto

# 4. Update LavaMoat policies
yarn lavamoat:auto         # Updates both build system and webapp policies

# 5. Update attributions
yarn attributions:generate

# Or use MetaMask bot (for team members with repo branch):
# Comment on PR: @metamaskbot update-policies
# Comment on PR: @metamaskbot update-attributions
```

**Important:** Always update LavaMoat policies and attributions when dependencies change!

---

## Common Agent Workflows

### Workflow: Adding a New Feature

```bash
# 1. Start development build
yarn start

# 2. Create new files (MUST be TypeScript)
# - Component: ui/components/feature-name/feature-name.tsx
# - Test: ui/components/feature-name/feature-name.test.tsx
# - Types: ui/components/feature-name/feature-name.types.ts

# 3. Make changes

# 4. Run lint and tests on changed files
yarn lint:changed:fix
yarn test:unit path/to/feature-name.test.tsx

# 5. If test needs E2E, build test build
yarn build:test
yarn test:e2e:single test/e2e/tests/new-test.spec.js --browser=chrome
```

### Workflow: Modifying Existing Code

```bash
# 1. Identify file type and read relevant guidelines
# - Controller? Read .cursor/rules/controller-guidelines/RULE.md
# - React component? Read .cursor/rules/coding-guidelines/RULE.md
# - Test? Read .cursor/rules/unit-testing-guidelines/RULE.md

# 2. Make changes following guidelines

# 3. Run linter on changed files
yarn lint:changed:fix

# 4. Run existing tests
yarn test:unit path/to/modified-file.test.ts

# 5. Update tests if behavior changed

# 6. Check for circular dependencies
yarn circular-deps:check
```

### Workflow: Adding/Updating Dependencies

```bash
# 1. Add or update package
yarn add package-name
# OR
yarn upgrade package-name

# 2. REQUIRED: Deduplicate lockfile
yarn lint:lockfile:dedupe:fix

# 3. REQUIRED: Update allow-scripts
yarn allow-scripts auto

# 4. REQUIRED: Update LavaMoat policies (this may take several minutes)
yarn lavamoat:auto

# 5. REQUIRED: Update attributions
yarn attributions:generate

# 6. Test the build
yarn build:test

# 7. Commit all changes including:
#    - package.json
#    - yarn.lock
#    - lavamoat/browserify/*/policy.json
#    - lavamoat/build-system/policy.json
#    - attribution.txt
```

### Workflow: Fixing a Bug

```bash
# 1. Create a failing test that reproduces the bug
# Add test to existing .test.ts file or create new one

# 2. Run the test to confirm it fails
yarn test:unit path/to/test-file.test.ts

# 3. Fix the bug in source code

# 4. Run test again to confirm fix
yarn test:unit path/to/test-file.test.ts

# 5. Run all related tests
yarn test:unit

# 6. Lint changes
yarn lint:changed:fix

# 7. If bug is in E2E scenario
yarn build:test
yarn test:e2e:single path/to/test.spec.js --browser=chrome
```

### Workflow: Creating a Controller

```bash
# 1. MUST read controller guidelines first
# Read .cursor/rules/controller-guidelines/RULE.md

# 2. Create controller file (TypeScript only)
# Location: app/scripts/controllers/your-controller/your-controller.ts

# 3. Controller MUST:
#    - Extend BaseController from @metamask/base-controller
#    - Define state type
#    - Define metadata for all state properties
#    - Export getDefaultYourControllerState() function
#    - Use messenger for inter-controller communication
#    - Use selectors for derived state (not getter methods)

# 4. Create test file
# Location: app/scripts/controllers/your-controller/your-controller.test.ts

# 5. Create types file
# Location: app/scripts/controllers/your-controller/types.ts

# 6. Run tests
yarn test:unit app/scripts/controllers/your-controller/your-controller.test.ts

# 7. Lint
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

---

## Working with Feature Flags

### What are Feature Flags?

Feature flags allow you to enable/disable features during development. They're defined in `.metamaskrc` and control which features are built into the extension.

### Available Feature Flags

Check `.metamaskrc.dist` for the current list of feature flags. Common ones:

- `MULTICHAIN` - Multi-chain support
- `BLOCKAID_PUBLIC_KEY` - Security features
- Various experimental features

### Using Feature Flags

**Method 1: Configure in `.metamaskrc`**

```bash
# Edit .metamaskrc
MULTICHAIN=1
OTHER_FEATURE=1

# Build with flags
yarn build:test
```

**Method 2: Pass as environment variable**

```bash
# Enable for single build
MULTICHAIN=1 yarn build:test
MULTICHAIN=1 yarn start:test

# Run E2E tests with feature enabled
MULTICHAIN=1 yarn build:test
yarn test:e2e:single test/e2e/tests/some-test.spec.js
```

### Remote Feature Flags

Override remote feature flags using `.manifest-overrides.json`:

```json
{
  "_flags": {
    "remoteFeatureFlags": {
      "testBooleanFlag": false
    }
  }
}
```

Set in `.metamaskrc`:

```
MANIFEST_OVERRIDES=.manifest-overrides.json
```

---

## LavaMoat Security System

### What is LavaMoat?

LavaMoat is a supply chain security tool that restricts what dependencies can do (file access, network access, etc.). It's enabled in production builds to protect users.

### When to Update LavaMoat Policies

Update policies whenever you:

- ✅ Add a new dependency
- ✅ Update an existing dependency
- ✅ Remove a dependency
- ✅ Change how code accesses Node.js APIs
- ✅ See "LavaMoat policy violation" errors

### How to Update Policies

**Automated (Recommended):**

```bash
# Update all policies (build system + webapp)
yarn lavamoat:auto

# Or use MetaMask bot (team members only):
# Comment on PR: @metamaskbot update-policies
```

**Manual:**

```bash
# Update webapp policies (app/scripts)
yarn lavamoat:webapp:auto

# Update build system policies
yarn lavamoat:build:auto

# If policies still fail after regeneration:
rm -rf node_modules/ && yarn && yarn lavamoat:auto
```

### Debugging Policy Issues

```bash
# Generate debug output
yarn lavamoat:debug:build         # Build system debug
yarn lavamoat:debug:webapp        # Webapp debug
```

**Common Issues:**

- **Policy fails on macOS/Windows:** Platform-specific optional dependencies. Regenerate on the target platform.
- **Dynamic imports fail:** LavaMoat's static analysis may miss dynamic code. May need manual policy updates.
- **Can't build at all:** Try `--apply-lavamoat=false` for development, but fix before merging.

### Development Without LavaMoat

For faster iteration during development:

```bash
yarn start --apply-lavamoat=false       # Development build
yarn start:test --apply-lavamoat=false  # Test build
```

**⚠️ Warning:** Always test with LavaMoat enabled before merging!

---

## Browser Compatibility

### Manifest V2 vs Manifest V3

| Feature           | MV2 (Firefox)         | MV3 (Chrome/Chromium) |
| ----------------- | --------------------- | --------------------- |
| **Build Flag**    | `ENABLE_MV3=false`    | Default               |
| **Start Command** | `yarn start:mv2`      | `yarn start`          |
| **Dist Command**  | `yarn dist:mv2`       | `yarn dist`           |
| **Background**    | Background page       | Service worker        |
| **Permissions**   | Broader access        | More restrictive      |
| **APIs**          | `browser.*` namespace | `chrome.*` namespace  |

### Building for Different Browsers

```bash
# Chrome / Edge / Brave (MV3)
yarn start                    # Development
yarn dist                     # Production

# Firefox (MV2)
yarn start:mv2                # Development
yarn dist:mv2                 # Production

# Test builds
yarn build:test               # Chrome MV3
yarn build:test:mv2           # Firefox MV2
```

### Browser-Specific Considerations

**Firefox:**

- Must use MV2 (Manifest V2)
- Use `webextension-polyfill` for cross-browser compatibility
- Test with `yarn test:e2e:firefox`

**Chrome/Chromium:**

- Uses MV3 (Manifest V3) by default
- Service worker limitations (no DOM access in background)
- Test with `yarn test:e2e:chrome`

**Both:**

- Code should use `browser.*` namespace (polyfilled for Chrome)
- Conditional logic for browser differences in `app/scripts/lib/util.js`

---

## Testing Strategy

### Unit Tests

**Location:** Colocated with source files (`.test.ts` or `.test.tsx`)

**Running:**

```bash
yarn test:unit              # All unit tests
yarn test:unit:watch        # Watch mode
yarn test:unit:coverage     # With coverage
```

**Key Principles:**

- Use Jest (not Mocha or Tape)
- Test through public interfaces (not private methods)
- Keep critical test data inline
- Use `describe` blocks to organize by method/function
- Never use "should" in test names (use present tense)

**Example:**

```typescript
describe('TokensController', () => {
  describe('addToken', () => {
    it('adds the token to state', () => {
      // Arrange, Act, Assert
    });

    it('throws error when token address is missing', () => {
      // Test error case
    });
  });
});
```

**Detailed Guidelines:** See `.cursor/rules/unit-testing-guidelines/RULE.md`

### E2E Tests

**Location:** `test/e2e/tests/`

**Running:**

```bash
# Must build test build first!
yarn build:test              # or yarn start:test

# Run E2E tests
yarn test:e2e:chrome         # All Chrome tests
yarn test:e2e:firefox        # All Firefox tests

# Single test with debug
yarn test:e2e:single test/e2e/tests/TEST_NAME.spec.js \
  --browser=chrome \
  --debug \
  --leave-running
```

**Options:**

- `--browser` - chrome, firefox, or all
- `--debug` - Verbose logging
- `--leave-running` - Keep browser open on failure
- `--retries` - Number of retries on failure
- `--update-snapshot` - Update snapshots

**E2E Best Practices:**

- Always use test builds (not dev builds)
- Tests should be independent and isolated
- Use page objects for reusable UI interactions
- Clean up state between tests
- Use fixtures to set up state programmatically
- Use `data-testid` for element locators

**Detailed Guidelines:** See `.cursor/rules/e2e-testing-guidelines/RULE.md`

**Deprecated Patterns:** See `.cursor/BUGBOT.md` for a list of deprecated E2E testing patterns to avoid.

### Integration Tests

**Location:** `test/integration/`

**Running:**

```bash
yarn test:integration
yarn test:integration:coverage
```

**Coverage Goals:**

- Unit tests: > 80% coverage
- Critical paths: > 90% coverage
- E2E tests: Cover main user workflows

---

## State Migrations

### What are Migrations?

When MetaMask updates, the stored state format might change. Migrations transform old state to new format automatically.

### Creating a Migration

```bash
# Generate migration template
yarn generate:migration

# Creates: app/scripts/migrations/XXX.ts (next number)
```

### Migration Guidelines

1. **Always create migrations for state changes**
2. **Test migrations thoroughly** (old state → new state)
3. **Handle missing data gracefully** (some users may have old/corrupted state)
4. **Never mutate input state** (return new state object)
5. **Include version number** in migration metadata

**Example Migration:**

```typescript
import { cloneDeep } from 'lodash';

const version = 123;

export default {
  version,
  async migrate(originalVersionedData: any) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    transformData(versionedData.data);
    return versionedData;
  },
};

function transformData(state: any): void {
  // Transform state.data
  if (state.PreferencesController) {
    state.PreferencesController.newProperty = 'defaultValue';
  }
}
```

---

## Pull Request Workflow

### Before Creating a PR

- [ ] All tests pass: `yarn test`
- [ ] Linting passes: `yarn lint`
- [ ] No console.logs or debug code
- [ ] Changes are covered by tests
- [ ] LavaMoat policies updated (if dependencies changed)
- [ ] Attributions updated (if dependencies changed)

### Creating a PR

**Reference:** Follow the [PR template](https://github.com/MetaMask/metamask-extension/blob/main/.github/pull-request-template.md) when creating pull requests.

**PR Title Format:**

- Clear and descriptive
- Will be used in squash commit message
- Example: "Add token validation for custom networks"

**Description Section:**

- **Context:** What's the background?
- **Problem:** What needs to be fixed/added?
- **Solution:** How do your changes address it?
- Answer: "What is the reason for the change?" and "What is the improvement/solution?"

**Changelog Entry:**

- If End-User-Facing: Write a short user-facing description in past tense
  - Example: `CHANGELOG entry: Added a new tab for users to see their NFTs`
  - Example: `CHANGELOG entry: Fixed a bug that was causing some NFTs to flicker`
- If not End-User-Facing: Write `CHANGELOG entry: null` or label with `no-changelog`

**Related Issues:**

- List all related issues using `Fixes: #issue-number` format
- Link to related PRs if applicable

**Manual Testing Steps:**

- Provide numbered steps to test the changes
- Include specific pages/features to test
- Example:
  1. Go to this page...
  2. Click this button...
  3. Verify this behavior...

**Screenshots/Recordings:**

- **Before:** Screenshots/videos showing the previous state (for UI changes)
- **After:** Screenshots/videos showing the new state (for UI changes)
- Required for all UI changes

**Pre-merge Author Checklist:**

- [ ] Followed [MetaMask Contributor Docs](https://github.com/MetaMask/contributor-docs) and [MetaMask Extension Coding Standards](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/CODING_GUIDELINES.md)
- [ ] Completed the PR template to the best of ability
- [ ] Included tests if applicable
- [ ] Documented code using [JSDoc](https://jsdoc.app/) format if applicable
- [ ] Applied the right labels on the PR (see [labeling guidelines](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/LABELING_GUIDELINES.md))

**Additional PR Comments:**

- Call out non-obvious changes
- Explain complex logic inline
- Link to related issues/PRs

### During Review

- Respond to all feedback
- Link to commits that address feedback (e.g., "Fixed in abc1234")
- **Avoid rebasing after receiving comments** (makes review harder)
- Push new commits instead of amending

### Before Merging

- [ ] All conversations resolved
- [ ] Required approvals received
- [ ] CI checks passing
- [ ] Review the squash commit message (auto-generated from PR)
- [ ] **Don't modify the commit title format** (must be: `Title (#number)`)

**Detailed Guidelines:** See `.cursor/rules/pull-request-guidelines/RULE.md`

---

## Code Style & Standards

### General Principles

1. **TypeScript for all new code** (no new JavaScript files)
2. **Functional components with hooks** (no class components)
3. **Destructure props** in function parameters
4. **Small, focused functions** (single responsibility)
5. **Early returns** to reduce nesting
6. **DRY principle** (extract repeated code)

### Naming Conventions

```typescript
// Components: PascalCase
export const TokenListItem = () => {};

// Functions: camelCase
const handleInputChange = () => {};

// Custom hooks: use prefix
const useTokenBalance = () => {};

// Higher-order components: with prefix
const withAuth = (Component) => {};

// Controllers: PascalCase with Controller suffix
class TokensController extends BaseController {}
```

### Component Structure

```
component-name/
├── component-name.tsx          # Main component
├── component-name.types.ts     # TypeScript types
├── component-name.test.tsx     # Unit tests
├── component-name.stories.tsx  # Storybook stories
├── component-name.scss         # Styles
├── __snapshots__/              # Jest snapshots
├── README.md                   # Component documentation
└── index.ts                    # Public exports
```

### React Best Practices

```typescript
// ✅ CORRECT: Functional component with destructured props and performance optimizations
interface TokenListProps {
  tokens: Token[];
  onSelect: (token: Token) => void;
}

export const TokenList = ({ tokens, onSelect }: TokenListProps) => {
  // Use hooks
  const [selected, setSelected] = useState<Token | null>(null);

  // Memoize expensive computations (sorting large arrays)
  const sortedTokens = useMemo(() =>
    [...tokens].sort((a, b) => a.symbol.localeCompare(b.symbol)),
    [tokens]  // Only re-sort when tokens array changes
  );

  // Memoize callbacks passed to children to prevent unnecessary re-renders
  const handleClick = useCallback((token: Token) => {
    setSelected(token);
    onSelect(token);
  }, [onSelect]);

  return (
    <div>
      {sortedTokens.map(token => (
        <TokenItem
          key={token.address}  // Use unique ID, not array index
          token={token}
          onClick={handleClick}  // Stable reference prevents child re-renders
        />
      ))}
    </div>
  );
};
```

**Performance Anti-Patterns to Avoid:**

```typescript
// ❌ WRONG: Using index as key for dynamic lists
{tokens.map((token, index) => (
  <TokenItem
    key={index}  // Don't use index as key for dynamic lists
    token={token}
  />
))}

// ❌ WRONG: No memoization for expensive operations
const sortedTokens = tokens.sort((a, b) => a.value - b.value);  // Runs on every render

// ❌ WRONG: Using useEffect for derived state
const [displayName, setDisplayName] = useState('');
useEffect(() => {
  setDisplayName(`${token.symbol} (${token.name})`);  // Should calculate during render
}, [token]);
```

**Detailed Guidelines:**

- General coding: `.cursor/rules/coding-guidelines/RULE.md`
- Performance optimization:
  - `.cursor/rules/front-end-performance-rendering/RULE.md` (rendering performance)
  - `.cursor/rules/front-end-performance-hooks-effects/RULE.md` (hooks & effects)
  - `.cursor/rules/front-end-performance-react-compiler/RULE.md` (React Compiler & anti-patterns)
  - `.cursor/rules/front-end-performance-state-management/RULE.md` (Redux & state management)

---

## React Performance Optimization

### Critical Performance Rules

When writing React components, follow these performance best practices:

#### 1. Always Use Unique IDs as Keys

```typescript
// ❌ WRONG: Using index as key for dynamic list
{tokens.map((token, index) => (
  <TokenItem key={index} token={token} />  // BAD!
))}

// ✅ CORRECT: Use unique identifier
{tokens.map((token) => (
  <TokenItem key={token.address} token={token} />
))}
```

#### 2. Memoize Expensive Calculations

```typescript
// ❌ WRONG: Sorts on every render
const TokenList = ({ tokens }) => {
  const sortedTokens = tokens.sort((a, b) => b.balance - a.balance);  // BAD!
  return <div>{sortedTokens.map(...)}</div>;
};

// ✅ CORRECT: Memoize with useMemo
const TokenList = ({ tokens }) => {
  const sortedTokens = useMemo(() =>
    [...tokens].sort((a, b) => b.balance - a.balance),
    [tokens]
  );
  return <div>{sortedTokens.map(...)}</div>;
};
```

#### 3. Don't Use useEffect for Derived State

```typescript
// ❌ WRONG: Using effect for derived state
const TokenDisplay = ({ token }) => {
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    setDisplayName(`${token.symbol} (${token.name})`);  // BAD!
  }, [token]);

  return <div>{displayName}</div>;
};

// ✅ CORRECT: Calculate during render
const TokenDisplay = ({ token }) => {
  const displayName = `${token.symbol} (${token.name})`;
  return <div>{displayName}</div>;
};
```

### Performance Checklist for Components

Before marking a component complete:

```
✓ List keys use unique IDs (token.address, tx.hash), not array index
✓ Expensive operations wrapped in useMemo (sorting, filtering)
✓ Callbacks passed to children wrapped in useCallback
✓ Static objects/styles defined as constants outside component
✓ No useEffect where render-time calculation would work
✓ Large lists (100+ items) consider virtualization (react-window)
```

### When to Optimize

- **DO optimize:** Frequently rendered components (list items, modals)
- **DO optimize:** Components with expensive calculations (sorting 100+ items)
- **DO optimize:** Deep component trees that re-render often
- **DON'T optimize:** Simple components that render quickly
- **DON'T optimize:** Components that rarely re-render

**Rule of thumb:** Profile first with React DevTools, then optimize what matters.

**See:**

- `.cursor/rules/front-end-performance-rendering/RULE.md` - Rendering performance (keys, memoization, virtualization)
- `.cursor/rules/front-end-performance-hooks-effects/RULE.md` - Hooks & effects optimization
- `.cursor/rules/front-end-performance-react-compiler/RULE.md` - React Compiler considerations & anti-patterns
- `.cursor/rules/front-end-performance-state-management/RULE.md` - Redux & state management optimization

---

## Error Handling for Agents

### When You Encounter a Build Error

```
1. Read the error message carefully
2. Check if it's a known issue in tables below
3. Apply the solution from the table
4. If not in table, check if it's a:
   - LavaMoat policy error → Run `yarn lavamoat:auto`
   - TypeScript error → Run `yarn lint:tsc`
   - Dependency error → Run `yarn install`
5. If still failing, try nuclear option:
   rm -rf node_modules/ dist/ build/
   yarn install
   yarn lavamoat:auto
```

### When Tests Fail

```
1. IF test was passing before your changes:
   → Your changes broke something
   → Revert changes and understand what the test expects
   → Fix code to match expected behavior

2. IF test expects old behavior but you're changing behavior:
   → Update the test to match new expected behavior
   → Document why behavior changed in test/PR description

3. IF E2E test fails:
   → Check if you built test build: `yarn build:test`
   → Check if test build is stale: delete dist/ and rebuild
   → Run with --debug flag for more info
   → Run with --leave-running to inspect browser state

4. IF snapshot test fails:
   → Review the snapshot diff carefully
   → IF change is intentional: `yarn test:unit -u`
   → IF change is not intentional: fix your code
```

### When LavaMoat Policies Fail

```
1. ALWAYS run after dependency changes: `yarn lavamoat:auto`
2. IF auto-generation fails:
   → Try: rm -rf node_modules/ && yarn && yarn lavamoat:auto
3. IF still fails:
   → Check if on correct platform (macOS vs Linux)
   → Platform-specific dependencies need regeneration on that platform
4. IF blocked during development:
   → Temporarily use: yarn start --apply-lavamoat=false
   → MUST fix before merging
```

### When You Get Circular Dependency Errors

```
1. Run: yarn circular-deps:check
2. Fix the circular dependency by:
   → Moving shared code to a common location
   → Using dependency injection
   → Breaking circular imports
3. After fixing: yarn circular-deps:update
4. Commit the updated development/circular-deps.jsonc
```

---

## Troubleshooting

### Build Issues

| Problem                      | Solution                                                     |
| ---------------------------- | ------------------------------------------------------------ |
| `Module not found` errors    | Run `yarn install` again                                     |
| `Out of memory` during build | Increase Node heap: `NODE_OPTIONS=--max-old-space-size=4096` |
| LavaMoat policy errors       | Run `yarn lavamoat:auto`                                     |
| Webpack cache issues         | Run `yarn webpack:clearcache`                                |
| Stale build artifacts        | Delete `dist/` and `build/` directories                      |

### Test Issues

| Problem                 | Solution                                          |
| ----------------------- | ------------------------------------------------- |
| E2E tests fail to start | Build test build first: `yarn build:test`         |
| Tests hang indefinitely | Check if port 8545 (Ganache) is available         |
| Snapshot tests fail     | Update snapshots: `yarn test:unit -u`             |
| Browser not launching   | Check if browser is installed and in PATH         |
| Random E2E failures     | Use `--retries` flag or check for race conditions |

### Development Issues

| Problem                | Solution                                               |
| ---------------------- | ------------------------------------------------------ |
| Extension won't load   | Check browser console for errors                       |
| Hot reload not working | Restart `yarn start`                                   |
| Changes not appearing  | Hard refresh extension (chrome://extensions)           |
| State corrupted        | Clear extension data in browser                        |
| Port already in use    | Kill process on port: `lsof -ti:PORT \| xargs kill -9` |

### Dependency Issues

| Problem                  | Solution                                        |
| ------------------------ | ----------------------------------------------- |
| Yarn version mismatch    | Run `corepack enable`                           |
| Package install fails    | Clear cache: `yarn cache clean && yarn install` |
| Peer dependency warnings | Check if packages are compatible                |
| Allow-scripts fails      | Run `yarn allow-scripts auto`                   |
| Attributions check fails | Run `yarn attributions:generate`                |

---

## Agent Pre-Completion Checklist

Before completing your task, verify you've done ALL of the following:

### Code Quality Checks

```bash
# 1. Run linter and auto-fix
yarn lint:changed:fix

# 2. Run TypeScript type checking
yarn lint:tsc

# 3. Check for circular dependencies
yarn circular-deps:check

# 4. Verify no console.log or debug code remains
# grep -r "console.log" in modified files
```

### Testing Checks

```bash
# 1. Run unit tests for modified files
yarn test:unit path/to/modified-file.test.ts

# 2. If you modified a controller, run controller tests
yarn test:unit app/scripts/controllers/

# 3. If you modified UI components, run component tests
yarn test:unit ui/components/

# 4. If behavior changed, ensure tests are updated
# Tests must reflect new expected behavior
```

### Build Checks

```bash
# 1. Verify dev build works
yarn start
# (Let it build, check for errors, then Ctrl+C)

# 2. If E2E-related, verify test build works
yarn build:test
# (Check for build errors)
```

### Dependency Checks (ONLY if you modified dependencies)

```bash
# 1. Deduplicate lockfile
yarn lint:lockfile:dedupe:fix

# 2. Update allow-scripts
yarn allow-scripts auto

# 3. Update LavaMoat policies
yarn lavamoat:auto

# 4. Update attributions
yarn attributions:generate

# 5. Verify all policy files are included in changes:
# - lavamoat/browserify/*/policy.json
# - lavamoat/build-system/policy.json
# - attribution.txt
```

### File Completeness Checks

```typescript
// For NEW TypeScript files, verify they have:
// 1. Proper imports
// 2. Type definitions
// 3. JSDoc comments for public functions
// 4. Colocated .test.ts file
// 5. Exported from index.ts (if in component folder)

// For MODIFIED files, verify:
// 1. No commented-out code
// 2. No unused imports
// 3. Consistent formatting
// 4. Updated tests if behavior changed
```

### Documentation Checks

```
IF you created a new component:
  → Add/update component README.md
  → Add/update Storybook story (.stories.tsx)

IF you changed public API (controller methods, props, etc.):
  → Update JSDoc comments
  → Update TypeScript types

IF you changed behavior significantly:
  → Add comment explaining why
  → Update relevant documentation files
```

### Final Verification

```
✓ All new code is TypeScript (not JavaScript)
✓ All tests pass: yarn test:unit
✓ All linting passes: yarn lint:changed
✓ No console.log or debug code
✓ Changes are colocated with tests
✓ Used functional components (not class components)
✓ Props are destructured
✓ Controllers extend BaseController
✓ Updated related files (see File Modification Patterns)
✓ LavaMoat policies updated (if dependencies changed)
✓ Circular dependencies checked
✓ Build completes without errors

Performance Checks (React Components):
✓ Unique IDs used as keys (not array index)
✓ Expensive calculations wrapped in useMemo
✓ Callbacks to children wrapped in useCallback
✓ No useEffect for derived state (calculate during render)
✓ Large lists (100+ items) use virtualization if applicable
```

---

## Additional Resources

### Documentation

- **Main README:** [README.md](./README.md) - Setup, building, contributing
- **Development Guide:** [development/README.md](./development/README.md) - Build system details
- **Testing Guide:** [docs/testing.md](./docs/testing.md) - Testing infrastructure
- **Architecture Docs:** [docs/](./docs/) - Architecture and design docs

### Coding Guidelines

- **Controller Patterns:** [.cursor/rules/controller-guidelines/RULE.md](./.cursor/rules/controller-guidelines/RULE.md)
- **Unit Testing:** [.cursor/rules/unit-testing-guidelines/RULE.md](./.cursor/rules/unit-testing-guidelines/RULE.md)
- **E2E Testing:** [.cursor/rules/e2e-testing-guidelines/RULE.md](./.cursor/rules/e2e-testing-guidelines/RULE.md)
- **E2E Deprecated Patterns:** [.cursor/BUGBOT.md](./.cursor/BUGBOT.md)
- **Front-End Performance:**
  - [Rendering Performance](.cursor/rules/front-end-performance-rendering/RULE.md) - Start here (keys, memoization, virtualization)
  - [Hooks & Effects](.cursor/rules/front-end-performance-hooks-effects/RULE.md) - useEffect best practices
  - [React Compiler & Anti-Patterns](.cursor/rules/front-end-performance-react-compiler/RULE.md) - React Compiler considerations
  - [State Management](.cursor/rules/front-end-performance-state-management/RULE.md) - Redux optimization
- **Pull Requests:** [.cursor/rules/pull-request-guidelines/RULE.md](./.cursor/rules/pull-request-guidelines/RULE.md)
- **General Coding:** [.cursor/rules/coding-guidelines/RULE.md](./.cursor/rules/coding-guidelines/RULE.md)
- **Official Guidelines:** [.github/guidelines/CODING_GUIDELINES.md](./.github/guidelines/CODING_GUIDELINES.md)

### External Resources

- **MetaMask Contributor Docs:** https://github.com/MetaMask/contributor-docs
- **MetaMask Developer Docs:** https://docs.metamask.io/
- **Community Forum:** https://community.metamask.io/
- **User Support:** https://support.metamask.io/
