# AGENTS.md

AI agent instructions for MetaMask Browser Extension development.

---

## Project Overview

**MetaMask** is a cryptocurrency wallet and gateway to blockchain applications, available as a browser extension for Chrome, Firefox, and other Chromium-based browsers. This is a large-scale TypeScript/React project with complex build infrastructure and security requirements.

**Key Technologies:**
- TypeScript & React (functional components + hooks)
- Redux for state management
- BaseController architecture for business logic
- LavaMoat for supply chain security
- Jest & Playwright for testing
- Multiple build systems (Browserify for production, Webpack for development)

**For comprehensive coding standards, see:**
- Controller patterns: `.cursor/rules/controller-guidelines.mdc`
- Testing best practices: `.cursor/rules/unit-testing-guidelines.mdc`
- PR workflow: `.cursor/rules/pull-request-guidelines.mdc`
- General coding style: `.cursor/rules/coding-guidelines.mdc`
- General guidelines: `.github/guidelines/CODING_GUIDELINES.md`

---

## Quick Setup

### Prerequisites

- **Node.js 24+** (use `nvm use` to auto-select from `.nvmrc`)
- **Yarn 4.10.3+** (managed by Corepack, included with Node.js)
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

| Issue | Solution |
|-------|----------|
| `command not found: yarn` | Run `corepack enable` |
| Build fails with policy errors | Run `yarn lavamoat:auto` |
| Invalid Infura key error | Check `INFURA_PROJECT_ID` in `.metamaskrc` |
| Ganache won't start | Ensure port 8545 is available |
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
- See `.cursor/rules/unit-testing-guidelines.mdc` for testing standards

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

| What You Need | Where to Look |
|---------------|---------------|
| Controllers (business logic) | `app/scripts/controllers/` |
| React Components | `ui/components/` or `ui/pages/` |
| Redux State Management | `ui/ducks/` (slices) and `ui/selectors/` |
| Background Scripts | `app/scripts/` |
| Constants | `shared/constants/` |
| Utility Functions | `shared/lib/` or `ui/helpers/` |
| Type Definitions | `shared/types/` or `types/` |
| State Migrations | `app/scripts/migrations/` |
| Build Configuration | `development/build/` and `development/webpack/` |
| Extension Manifests | `app/manifest/v2/` or `app/manifest/v3/` |

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
- Organized in component folders with tests, styles, and types
- See `.cursor/rules/coding-guidelines.mdc` for component standards

**Testing**:
- Unit tests colocated with source files (`.test.ts`)
- Jest for unit tests, Playwright for E2E
- Test files organized with `describe` blocks by method/function
- See `.cursor/rules/unit-testing-guidelines.mdc` for testing patterns

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

| Feature | MV2 (Firefox) | MV3 (Chrome/Chromium) |
|---------|---------------|------------------------|
| **Build Flag** | `ENABLE_MV3=false` | Default |
| **Start Command** | `yarn start:mv2` | `yarn start` |
| **Dist Command** | `yarn dist:mv2` | `yarn dist` |
| **Background** | Background page | Service worker |
| **Permissions** | Broader access | More restrictive |
| **APIs** | `browser.*` namespace | `chrome.*` namespace |

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

**Detailed Guidelines:** See `.cursor/rules/unit-testing-guidelines.mdc`

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

**Write a Comprehensive Description:**
- **Context:** What's the background?
- **Problem:** What needs to be fixed/added?
- **Solution:** How do your changes address it?
- **Screenshots/Videos:** For UI changes

**PR Title Format:**
- Clear and descriptive
- Will be used in squash commit message
- Example: "Add token validation for custom networks"

**Add PR Comments:**
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

**Detailed Guidelines:** See `.cursor/rules/pull-request-guidelines.mdc`

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
// ✅ CORRECT: Functional component with destructured props
interface TokenListProps {
  tokens: Token[];
  onSelect: (token: Token) => void;
}

export const TokenList = ({ tokens, onSelect }: TokenListProps) => {
  // Use hooks
  const [selected, setSelected] = useState<Token | null>(null);

  // Memoize expensive computations
  const sortedTokens = useMemo(() =>
    [...tokens].sort((a, b) => a.symbol.localeCompare(b.symbol)),
    [tokens]
  );

  // Memoize callbacks passed to children
  const handleClick = useCallback((token: Token) => {
    setSelected(token);
    onSelect(token);
  }, [onSelect]);

  return (
    <div>
      {sortedTokens.map(token => (
        <TokenItem
          key={token.address}
          token={token}
          onClick={handleClick}
        />
      ))}
    </div>
  );
};
```

**Detailed Guidelines:** See `.cursor/rules/coding-guidelines.mdc`

---

## Troubleshooting

### Build Issues

| Problem | Solution |
|---------|----------|
| `Module not found` errors | Run `yarn install` again |
| `Out of memory` during build | Increase Node heap: `NODE_OPTIONS=--max-old-space-size=4096` |
| LavaMoat policy errors | Run `yarn lavamoat:auto` |
| Webpack cache issues | Run `yarn webpack:clearcache` |
| Stale build artifacts | Delete `dist/` and `build/` directories |

### Test Issues

| Problem | Solution |
|---------|----------|
| E2E tests fail to start | Build test build first: `yarn build:test` |
| Tests hang indefinitely | Check if port 8545 (Ganache) is available |
| Snapshot tests fail | Update snapshots: `yarn test:unit -u` |
| Browser not launching | Check if browser is installed and in PATH |
| Random E2E failures | Use `--retries` flag or check for race conditions |

### Development Issues

| Problem | Solution |
|---------|----------|
| Extension won't load | Check browser console for errors |
| Hot reload not working | Restart `yarn start` |
| Changes not appearing | Hard refresh extension (chrome://extensions) |
| State corrupted | Clear extension data in browser |
| Port already in use | Kill process on port: `lsof -ti:PORT \| xargs kill -9` |

### Dependency Issues

| Problem | Solution |
|---------|----------|
| Yarn version mismatch | Run `corepack enable` |
| Package install fails | Clear cache: `yarn cache clean && yarn install` |
| Peer dependency warnings | Check if packages are compatible |
| Allow-scripts fails | Run `yarn allow-scripts auto` |
| Attributions check fails | Run `yarn attributions:generate` |

---

## Additional Resources

### Documentation

- **Main README:** [README.md](./README.md) - Setup, building, contributing
- **Development Guide:** [development/README.md](./development/README.md) - Build system details
- **Testing Guide:** [docs/testing.md](./docs/testing.md) - Testing infrastructure
- **Architecture Docs:** [docs/](./docs/) - Architecture and design docs

### Coding Guidelines

- **Controller Patterns:** [.cursor/rules/controller-guidelines.mdc](./.cursor/rules/controller-guidelines.mdc)
- **Unit Testing:** [.cursor/rules/unit-testing-guidelines.mdc](./.cursor/rules/unit-testing-guidelines.mdc)
- **Pull Requests:** [.cursor/rules/pull-request-guidelines.mdc](./.cursor/rules/pull-request-guidelines.mdc)
- **General Coding:** [.cursor/rules/coding-guidelines.mdc](./.cursor/rules/coding-guidelines.mdc)
- **Official Guidelines:** [.github/guidelines/CODING_GUIDELINES.md](./.github/guidelines/CODING_GUIDELINES.md)

### External Resources

- **MetaMask Contributor Docs:** https://github.com/MetaMask/contributor-docs
- **MetaMask Developer Docs:** https://docs.metamask.io/
- **Community Forum:** https://community.metamask.io/
- **User Support:** https://support.metamask.io/

### Getting Help

- **Internal:** Ask in team Slack channels
- **External:** Post in [MetaMask Community Forum](https://community.metamask.io/)
- **Bugs:** File issue on GitHub
- **Security:** security@metamask.io (do not file public issues)

---

## Quick Reference Card

### Most Common Workflows

```bash
# Start fresh development session
nvm use
yarn install
cp .metamaskrc.dist .metamaskrc  # If first time
# Edit .metamaskrc with Infura key
yarn start

# Make changes and test
yarn lint:changed:fix            # Lint changed files
yarn test:unit path/to/file      # Test specific file
yarn build:test                  # Build for E2E
yarn test:e2e:single path/to/test.spec.js --browser=chrome

# Before committing
yarn lint
yarn test
yarn circular-deps:check

# After changing dependencies
yarn lint:lockfile:dedupe:fix
yarn allow-scripts auto
yarn lavamoat:auto
yarn attributions:generate

# Create PR
# Write good description (context, problem, solution)
# Add screenshots for UI changes
# Link related issues
```

### Emergency Commands

```bash
# Something's broken, start from scratch
rm -rf node_modules/ dist/ build/ .cache/
yarn install
yarn lavamoat:auto
yarn start

# Tests are failing mysteriously
yarn build:test                  # Rebuild test build
rm -rf dist/ && yarn build:test  # Nuclear option

# Can't build at all
yarn start --apply-lavamoat=false  # Disable LavaMoat temporarily
```

