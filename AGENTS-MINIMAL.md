# AGENTS-MINIMAL.md

Minimal coding guidelines for AI agents working on MetaMask Extension.

For comprehensive project setup, commands, and workflows, see [AGENTS.md](./AGENTS.md).

---

## Critical Coding Rules

### ALWAYS

1. ✅ **Write all new code in TypeScript** (never JavaScript)
2. ✅ **Use functional components with hooks** (never class components)
3. ✅ **Destructure props** in function parameters
4. ✅ **Colocate tests** with source files (`.test.ts` or `.test.tsx`)
5. ✅ **Run `yarn lint:changed:fix`** before finishing
6. ✅ **Update tests** when changing behavior
7. ✅ **Use `BaseController`** for all new controllers
8. ✅ **Use selectors** for derived state (not getter methods)
9. ✅ **Create migrations** when changing state shape

### NEVER

1. ❌ **Never use JavaScript** for new files
2. ❌ **Never use class components**
3. ❌ **Never test private methods** directly
4. ❌ **Never use "should" in test names** (use present tense)
5. ❌ **Never mutate state directly** (use `this.update()` in controllers)
6. ❌ **Never store derived values** in state
7. ❌ **Never commit without running tests**
8. ❌ **Never skip LavaMoat updates** after dependency changes

---

## Quick Reference

### When Creating New Code

```
IF creating a controller:
  1. Read: .cursor/rules/controller-guidelines.mdc
  2. Location: app/scripts/controllers/name/
  3. Extend BaseController
  4. Define state metadata
  5. Use messenger for inter-controller communication
  6. Export getDefaultNameControllerState() function
  7. Create colocated .test.ts file

IF creating a React component:
  1. Read: .cursor/rules/coding-guidelines.mdc
  2. Location: ui/components/name/ or ui/pages/name/
  3. Use functional component with hooks
  4. Destructure props in parameters
  5. Define TypeScript interface for props
  6. Create colocated .test.tsx file
  7. Use Redux for global state, local state for UI-only

IF creating a utility function:
  1. Location: shared/lib/ (if used by both)
             or app/scripts/lib/ (backend only)
             or ui/helpers/ (UI only)
  2. Write in TypeScript with explicit types
  3. Add JSDoc comments
  4. Create colocated .test.ts file

IF modifying existing code:
  1. Read relevant guideline file first
  2. Match existing patterns and style
  3. Update colocated tests
  4. Run: yarn lint:changed:fix
  5. Run: yarn test:unit path/to/file.test.ts
```

---

## TypeScript Standards

### Required Practices

```typescript
// ✅ CORRECT: Explicit types, exported interfaces
export interface TokenData {
  address: string;
  symbol: string;
  decimals: number;
}

export function formatToken(token: TokenData): string {
  return `${token.symbol} (${token.address})`;
}

// ❌ WRONG: No types, using any
export function formatToken(token: any) {
  return `${token.symbol} (${token.address})`;
}
```

### Type Definitions

- Define interfaces for all object shapes
- Use type aliases for complex types
- Export types that are used by other modules
- Avoid `any` - use `unknown` if type is truly unknown
- Use union types for multiple possible types

---

## React Component Standards

### Functional Components Only

```typescript
// ✅ CORRECT: Functional component with hooks
interface TokenListProps {
  tokens: Token[];
  onSelect: (token: Token) => void;
}

export const TokenList = ({ tokens, onSelect }: TokenListProps) => {
  const [selected, setSelected] = useState<Token | null>(null);

  const handleClick = useCallback((token: Token) => {
    setSelected(token);
    onSelect(token);
  }, [onSelect]);

  return (
    <div>
      {tokens.map(token => (
        <TokenItem key={token.address} token={token} onClick={handleClick} />
      ))}
    </div>
  );
};

// ❌ WRONG: Class component
class TokenList extends React.Component {
  // Never use class components
}
```

### Component Best Practices

- **Props:** Always destructure in function parameters
- **State:** Use `useState` for local state, Redux for global
- **Memoization:** Use `useMemo` for expensive computations
- **Callbacks:** Use `useCallback` for functions passed to children
- **Effects:** Use `useEffect` judiciously (see [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect))

**Detailed standards:** See `.cursor/rules/coding-guidelines.mdc`

---

## Controller Standards

### BaseController Pattern

```typescript
// ✅ CORRECT: Extends BaseController
import { BaseController } from '@metamask/base-controller';

type TokensControllerState = {
  tokens: Token[];
};

const tokensControllerMetadata = {
  tokens: {
    persist: true,
    anonymous: false,
    usedInUi: true,
  },
};

export function getDefaultTokensControllerState(): TokensControllerState {
  return { tokens: [] };
}

export class TokensController extends BaseController<
  typeof tokensControllerMetadata,
  TokensControllerState
> {
  constructor({
    messenger,
    state = {},
  }: {
    messenger: TokensControllerMessenger;
    state?: Partial<TokensControllerState>;
  }) {
    super({
      name: 'TokensController',
      metadata: tokensControllerMetadata,
      messenger,
      state: { ...getDefaultTokensControllerState(), ...state },
    });
  }

  addToken(token: Token): void {
    // Use this.update() to modify state
    this.update((state) => {
      state.tokens.push(token);
    });
  }
}

// ❌ WRONG: Does not extend BaseController
export class TokensController {
  // Must extend BaseController for state management
}
```

### Controller Requirements

- **MUST** extend `BaseController`
- **MUST** define state type and metadata
- **MUST** export `getDefault${Name}ControllerState()` function
- **MUST** use messenger for inter-controller communication
- **MUST** use `this.update()` to modify state (never direct mutation)
- **MUST** use selectors for derived state (not getter methods)

**Detailed patterns:** See `.cursor/rules/controller-guidelines.mdc`

---

## Testing Standards

### Test Structure

```typescript
// ✅ CORRECT: Organized with describe blocks, present tense
describe('TokensController', () => {
  describe('addToken', () => {
    it('adds the token to state', () => {
      const controller = new TokensController({ messenger });

      controller.addToken({ address: '0x123', symbol: 'DAI', decimals: 18 });

      expect(controller.state.tokens).toContainEqual({
        address: '0x123',
        symbol: 'DAI',
        decimals: 18,
      });
    });

    it('throws error when address is missing', () => {
      const controller = new TokensController({ messenger });

      expect(() => {
        controller.addToken({ address: '', symbol: 'DAI', decimals: 18 });
      }).toThrow('Token address is required');
    });
  });
});

// ❌ WRONG: Uses "should", tests multiple things
it('should add token and update count', () => {
  // Tests two things, uses "should"
});
```

### Testing Requirements

- **Location:** Colocate tests with source (`.test.ts` or `.test.tsx`)
- **Framework:** Use Jest (not Mocha or Tape)
- **Organization:** Use `describe` blocks by method/function name
- **Naming:** Present tense, no "should" (e.g., "adds token" not "should add token")
- **Scope:** Test through public interfaces (not private methods)
- **Data:** Keep critical test data inline
- **Phases:** Clear Arrange, Act, Assert separation

**Detailed guidelines:** See `.cursor/rules/unit-testing-guidelines.mdc`

---

## Naming Conventions

```typescript
// Components: PascalCase
export const TokenListItem = () => {};

// Functions: camelCase
const handleInputChange = () => {};

// Custom hooks: use prefix
const useTokenBalance = () => {};

// Higher-order components: with prefix
const withAuth = (Component) => {};

// Controllers: PascalCase + Controller suffix
class TokensController extends BaseController {}

// Types/Interfaces: PascalCase
interface TokenData {}
type TokenState = {};

// Constants: UPPER_SNAKE_CASE
const MAX_TOKEN_COUNT = 100;

// Files: kebab-case
// token-list-item.tsx
// use-token-balance.ts
```

---

## Common Patterns

### State Management

```typescript
// ✅ CORRECT: Minimal state, derive values
type State = {
  tokens: Token[];
};

// Derive count with selector
const selectTokenCount = (state: State) => state.tokens.length;

// ❌ WRONG: Storing derived values
type State = {
  tokens: Token[];
  tokenCount: number; // Derived from tokens.length
};
```

### Error Handling

```typescript
// ✅ CORRECT: Validate and throw descriptive errors
addToken(token: Token): void {
  if (!token.address) {
    throw new Error('Token address is required');
  }

  if (this.#tokenExists(token.address)) {
    throw new Error(`Token already exists: ${token.address}`);
  }

  this.update((state) => {
    state.tokens.push(token);
  });
}

// ❌ WRONG: Silent failure or generic error
addToken(token: Token): void {
  if (!token.address) {
    return; // Silent failure
  }
  // or
  throw new Error('Invalid token'); // Too generic
}
```

### Async Operations

```typescript
// ✅ CORRECT: async/await, proper error handling
async fetchTokens(): Promise<void> {
  try {
    const chainId = this.messagingSystem.call('NetworkController:getState').chainId;
    const tokens = await this.#fetchTokensFromAPI(chainId);

    this.update((state) => {
      state.tokens = tokens;
    });
  } catch (error) {
    console.error('Failed to fetch tokens:', error);
    throw new Error(`Token fetch failed: ${error.message}`);
  }
}

// ❌ WRONG: Callback-based, poor error handling
fetchTokens(callback: Function): void {
  this.#fetchTokensFromAPI(chainId)
    .then((tokens) => {
      this.state.tokens = tokens; // Direct mutation
      callback();
    })
    .catch(() => {}); // Swallowed error
}
```

---

## Code Organization

### Component File Structure

```
component-name/
├── component-name.tsx          # Main component
├── component-name.types.ts     # TypeScript types
├── component-name.test.tsx     # Unit tests
├── component-name.stories.tsx  # Storybook stories (optional)
├── component-name.scss         # Styles
├── __snapshots__/              # Jest snapshots
└── index.ts                    # Public exports
```

### Controller File Structure

```
controller-name/
├── controller-name.ts          # Main controller
├── controller-name.test.ts     # Unit tests
├── types.ts                    # Type definitions
└── index.ts                    # Public exports
```

---

## Decision Matrix

### Should I Create a New File?

```
IF code is used in 2+ places:
  → Extract to shared location

IF controller logic:
  → app/scripts/controllers/name/

IF React component:
  → ui/components/name/ (reusable)
  → ui/pages/name/ (page-level)

IF utility function:
  → shared/lib/ (used by both background and UI)
  → app/scripts/lib/ (background only)
  → ui/helpers/ (UI only)

IF constants:
  → shared/constants/

IF types:
  → shared/types/ (shared)
  → types/ (project-wide)
  → [dir]/types.ts (local to component/controller)
```

### Should I Update Tests?

```
IF you changed function behavior:
  → YES, update expectations

IF you changed component props:
  → YES, update component tests

IF you fixed a bug:
  → YES, add test that reproduces bug

IF you refactored without changing behavior:
  → NO, but run tests to verify they still pass

IF you changed controller state shape:
  → YES, update controller tests
  → YES, create migration
```

### Should I Create a Migration?

```
IF you added a new state property:
  → YES, with default value

IF you removed a state property:
  → YES, to clean up old state

IF you renamed a state property:
  → YES, to transform old → new

IF you changed state property type:
  → YES, to transform data

IF you only changed logic (not state shape):
  → NO
```

---

## Before Completing Task

### Minimum Checklist

```bash
# 1. Lint changed files
yarn lint:changed:fix

# 2. Run tests for modified files
yarn test:unit path/to/modified-file.test.ts

# 3. Verify TypeScript types
yarn lint:tsc

# 4. Check no console.log remains
# grep -r "console.log" in your files
```

### If You Modified Dependencies

```bash
yarn lint:lockfile:dedupe:fix
yarn allow-scripts auto
yarn lavamoat:auto
yarn attributions:generate
```

### Verification

```
✓ All new code is TypeScript
✓ Functional components used (not classes)
✓ Props are destructured
✓ Tests are colocated and passing
✓ No "should" in test names
✓ Controllers extend BaseController
✓ Selectors used for derived state
✓ No console.log or debug code
✓ Linting passes
```

---

## Quick Links to Detailed Guidelines

### Comprehensive Guidelines

- **Controllers:** [.cursor/rules/controller-guidelines.mdc](./.cursor/rules/controller-guidelines.mdc) (669 lines)
- **Testing:** [.cursor/rules/unit-testing-guidelines.mdc](./.cursor/rules/unit-testing-guidelines.mdc) (706 lines)
- **Coding Style:** [.cursor/rules/coding-guidelines.mdc](./.cursor/rules/coding-guidelines.mdc) (749 lines)
- **Pull Requests:** [.cursor/rules/pull-request-guidelines.mdc](./.cursor/rules/pull-request-guidelines.mdc) (450 lines)

### Project Resources

- **Setup & Commands:** [AGENTS.md](./AGENTS.md) - Full agent instructions
- **Project README:** [README.md](./README.md) - Human-focused documentation
- **Official Guidelines:** [.github/guidelines/CODING_GUIDELINES.md](./.github/guidelines/CODING_GUIDELINES.md)

---

## Common Mistakes to Avoid

1. ❌ Writing new JavaScript files (use TypeScript)
2. ❌ Using class components (use functional + hooks)
3. ❌ Not destructuring props
4. ❌ Testing private methods directly
5. ❌ Using "should" in test names
6. ❌ Storing derived values in state
7. ❌ Creating getter methods instead of selectors
8. ❌ Not colocating tests with source
9. ❌ Forgetting to update LavaMoat policies
10. ❌ Not creating migrations for state changes

---

**For full setup, commands, workflows, and troubleshooting:** See [AGENTS.md](./AGENTS.md)

**Last Updated:** November 2025

