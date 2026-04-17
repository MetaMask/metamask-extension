---
description: Project Guidelines for Writing Controllers
globs: *Controller.ts,*Controller.js,*-controller.ts,*-controller.js
alwaysApply: false
---

Reference: [MetaMask Controller Guidelines](https://github.com/MetaMask/core/blob/main/docs/controller-guidelines.md)

# MetaMask Extension - Controller Development Guidelines

## Controller Architecture

### Purpose of Controllers

Controllers are foundational pieces within MetaMask's architecture that:

- Keep and manage wallet-centric data (accounts, transactions, preferences, etc.)
- Contain business logic that powers functionality in the product
- Act as a communication layer between service layers (blockchains, APIs, etc.)
- Divide the application into logical modules maintained by different teams

### When to Use BaseController

- **ALWAYS inherit from `BaseController`** for classes that manage state
- BaseController is from `@metamask/base-controller` package
- Provides standard interface, messenger, state management, and consolidated constructor

### When NOT to Use BaseController

- **NEVER use `BaseController` for non-controllers**
- If a class does not capture any data in state, it doesn't need BaseController
- State management is the uniquely identifying feature of a controller

## Controller Naming and API

### Naming Convention

- Controller name should reflect its responsibility
- If difficult to name, define the responsibility first
- Follow pattern: `${Responsibility}Controller` (e.g., `TokensController`, `AccountsController`)

### API Clarity

- Each public method should have a clear purpose
- Each state property should have a clear purpose
- Method and property names should be readable and reflect purpose clearly
- **If something doesn't need to be public, make it private**
- **If something is unnecessary, remove it**

Example:

```typescript
✅ CORRECT:
class TokensController extends BaseController<...> {
  // Clear public API
  addToken(token: Token): void { }
  removeToken(address: string): void { }

  // Private implementation details
  #validateToken(token: Token): boolean { }
}

❌ WRONG:
class TokensController extends BaseController<...> {
  // Unclear or unnecessary public methods
  setTokenData(data: any): void { }
  doStuff(): void { }
  internalValidation(token: Token): boolean { } // Should be private
}
```

## State Management

### Accept Partial State

- **ALWAYS accept an optional, partial representation of state**
- Controllers should merge partial state with defaults
- The `state` argument should be optional in constructor

Example:

```typescript
type FooControllerState = {
  items: Item[];
  lastUpdated: number;
};

function getDefaultFooControllerState(): FooControllerState {
  return {
    items: [],
    lastUpdated: 0,
  };
}

class FooController extends BaseController</* ... */> {
  constructor({
    messenger,
    state = {},
  }: {
    messenger: FooControllerMessenger;
    state?: Partial<FooControllerState>;
  }) {
    super({
      messenger,
      state: { ...getDefaultFooControllerState(), ...state },
    });
  }
}
```

### Provide Default State Function

- **ALWAYS export a `getDefault${ControllerName}State` function**
- Return a new object reference each time (prevents accidental mutations)
- Do NOT export the default state object directly

Example:

```typescript
✅ CORRECT:
// FooController.ts
export function getDefaultFooControllerState(): FooControllerState {
  return {
    items: [],
    lastUpdated: 0,
  };
}

// index.ts
export { FooController, getDefaultFooControllerState } from './FooController';

❌ WRONG:
// Don't export object directly
export const defaultFooControllerState = {
  items: [],
  lastUpdated: 0,
};
```

### Define State Metadata

- **ALWAYS define metadata for each state property**
- Create a `${controllerName}Metadata` variable
- Pass metadata to `BaseController` constructor

#### Metadata Properties (Current):

- `includeInDebugSnapshot`: Include in Sentry debug logs? (true/false) - Must exclude PII
- `includeInStateLogs`: Include in user-downloaded state logs? (true/false) - Must exclude sensitive data
- `persist`: Should property be in persistent storage? (true/false)
- `usedInUi`: Is property used in the UI? (true/false)

**Alternative metadata (can be used instead of `includeInDebugSnapshot`):**

- `anonymous`: Has no PII, safe for Sentry? (true/false) - Can be used as an alternative to `includeInDebugSnapshot`

Example:

```typescript
const keyringControllerMetadata = {
  vault: {
    // This property can be used to identify a user, so we want to make sure we
    // do not include it in Sentry.
    includeInDebugSnapshot: false,
    // We don't want to include this in state logs because it contains sensitive key material.
    includeInStateLogs: false,
    // We want to persist this property so it's restored automatically, as we
    // cannot reconstruct it otherwise.
    persist: true,
    // This property is only used in the controller, not in the UI.
    usedInUi: false,
  },
  isUnlocked: {
    // This value is not sensitive, and is useful for diagnosing errors reported through support.
    includeInStateLogs: true,
    // We do not need to persist this property in state, as we want to
    // initialize state with the wallet locked.
    persist: false,
    // This property has no PII, so it is safe to send to Sentry.
    // (Can use 'anonymous: true' as alternative to 'includeInDebugSnapshot: true')
    anonymous: true,
    // This is used in the UI
    usedInUi: true,
  },
};

class KeyringController extends BaseController</*...*/> {
  constructor({ messenger, state = {} }: KeyringControllerOptions) {
    super({
      name: 'KeyringController',
      metadata: keyringControllerMetadata,
      messenger,
      state: { ...getDefaultKeyringControllerState(), ...state },
    });
  }
}
```

### Update State Correctly

- **ALWAYS use `this.update()` to modify state**
- NEVER directly mutate `this.state`
- Update method receives a draft state that can be mutated (uses Immer)

Example:

```typescript
✅ CORRECT:
addToken(token: Token) {
  this.update((state) => {
    state.tokens.push(token);
  });
}

❌ WRONG:
addToken(token: Token) {
  this.state.tokens.push(token); // Direct mutation!
}
```

## Constructor Patterns

### Single Options Bag

- **ALWAYS use a single "options bag" for constructor arguments**
- Include all BaseController requirements: `messenger`, `metadata`, `name`, `state`
- Include any controller-specific options in the same bag
- NO additional positional arguments

Example:

```typescript
✅ CORRECT:
class FooController extends BaseController</* ... */> {
  constructor({
    messenger,
    state = {},
    isEnabled,
    apiKey,
  }: {
    messenger: FooControllerMessenger;
    state?: Partial<FooControllerState>;
    isEnabled: boolean;
    apiKey: string;
  }) {
    super({
      name: 'FooController',
      metadata: fooControllerMetadata,
      messenger,
      state: { ...getDefaultFooControllerState(), ...state },
    });

    this.#isEnabled = isEnabled;
    this.#apiKey = apiKey;
  }
}

❌ WRONG:
class FooController extends BaseController</* ... */> {
  constructor(
    {
      messenger,
      state = {},
    }: {
      messenger: FooControllerMessenger;
      state?: Partial<FooControllerState>;
    },
    isEnabled: boolean, // Separate positional argument!
  ) {
    // ...
  }
}
```

## Messenger Usage

### Use Messenger Instead of Callbacks

- **ALWAYS use messenger for inter-controller communication**
- NEVER pass callback functions in constructor options
- Messenger reduces coupling and number of options

Example:

```typescript
❌ WRONG: Using callbacks
class FooController extends BaseController</* ... */> {
  constructor({
    onBarStateChange,
  }: {
    onBarStateChange: (state: BarControllerState) => void;
  }) {
    onBarStateChange((state) => {
      // do something
    });
  }
}

✅ CORRECT: Using messenger
class FooController extends BaseController</* ... */> {
  constructor({ messenger }: { messenger: FooControllerMessenger }) {
    super({ name: 'FooController', metadata, messenger, state });

    this.messagingSystem.subscribe(
      'BarController:stateChange',
      (barState) => {
        // do something
      },
    );
  }
}
```

### Messenger Type Definitions

- Define allowed actions and events for type safety
- Use discriminated unions for action types
- Follow naming convention: `${ControllerName}:${actionOrEventName}`

Example:

```typescript
export type TokensControllerGetStateAction = ControllerGetStateAction<
  'TokensController',
  TokensControllerState
>;

export type TokensControllerAddTokenAction = {
  type: 'TokensController:addToken';
  handler: TokensController['addToken'];
};

export type TokensControllerActions =
  | TokensControllerGetStateAction
  | TokensControllerAddTokenAction;

export type TokensControllerStateChangeEvent = ControllerStateChangeEvent<
  'TokensController',
  TokensControllerState
>;

export type TokensControllerEvents = TokensControllerStateChangeEvent;

export type TokensControllerMessenger = RestrictedControllerMessenger<
  'TokensController',
  TokensControllerActions | AllowedActions,
  TokensControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;
```

### Subscribe to Other Controllers

- Use `messenger.call()` to invoke actions on other controllers
- Use `messenger.subscribe()` to listen to events from other controllers
- Define `AllowedActions` and `AllowedEvents` types

Example:

```typescript
type AllowedActions = NetworkControllerGetStateAction;

type AllowedEvents = NetworkControllerStateChangeEvent;

class TokensController extends BaseController</* ... */> {
  constructor({ messenger }: { messenger: TokensControllerMessenger }) {
    super({ name: 'TokensController', metadata, messenger, state });

    // Subscribe to network changes
    this.messagingSystem.subscribe(
      'NetworkController:stateChange',
      this.#handleNetworkChange.bind(this),
    );
  }

  async fetchTokens() {
    // Call other controller
    const { chainId } = this.messagingSystem.call('NetworkController:getState');

    // Use chainId for fetching
  }
}
```

## Selectors

### Use Selectors Instead of Getters

- **NEVER add getter methods to controllers for derived state**
- **ALWAYS export selectors as pure functions**
- Place selectors under `${controllerName}Selectors` object
- Use `reselect` library for memoization

Example:

```typescript
❌ WRONG: Using getter methods
class AccountsController extends BaseController</* ... */> {
  getActiveAccounts() {
    return this.state.accounts.filter((account) => account.isActive);
  }
}

✅ CORRECT: Using selectors
import { createSelector } from 'reselect';

type AccountsControllerState = {
  accounts: Account[];
};

const selectAccounts = (state: AccountsControllerState) => state.accounts;

const selectActiveAccounts = createSelector(
  [selectAccounts],
  (accounts) => accounts.filter((account) => account.isActive),
);

const selectInactiveAccounts = createSelector(
  [selectAccounts],
  (accounts) => accounts.filter((account) => !account.isActive),
);

export const accountsControllerSelectors = {
  selectAccounts,
  selectActiveAccounts,
  selectInactiveAccounts,
};
```

### Benefits of Selectors

- Can be used without controller instance
- Can be used without messenger
- Work in Redux selectors and React components
- Memoization improves performance
- Easier to test as pure functions

### Using Selectors in Other Controllers

```typescript
import { accountsControllerSelectors } from '@metamask/accounts-controller';

class TokensController extends BaseController</* ... */> {
  fetchTokens() {
    const accountsState = this.messagingSystem.call(
      'AccountsController:getState',
    );

    const activeAccounts =
      accountsControllerSelectors.selectActiveAccounts(accountsState);

    // Use active accounts
  }
}
```

## Action Methods

### Model Actions as Events

- **Methods should represent high-level user actions, not low-level setters**
- Name methods after what the user is doing
- Avoid generic setters like `setState()`, `setProperty()`

Example:

```typescript
❌ WRONG: Low-level setters
class AlertsController extends BaseController</* ... */> {
  setAlertShown(alertId: string, isShown: boolean) {
    this.update((state) => {
      state.alerts[alertId].isShown = isShown;
    });
  }
}

✅ CORRECT: High-level actions
class AlertsController extends BaseController</* ... */> {
  showAlert(alertId: string) {
    this.update((state) => {
      state.alerts[alertId].isShown = true;
      state.alerts[alertId].shownAt = Date.now();
    });
  }

  dismissAlert(alertId: string) {
    this.update((state) => {
      state.alerts[alertId].isShown = false;
      state.alerts[alertId].dismissedAt = Date.now();
    });
  }
}
```

### Action Method Guidelines

- Validate inputs before updating state
- Throw descriptive errors for invalid operations
- Update related state properties together
- Emit appropriate events (handled automatically by BaseController)
- Include side effects (API calls, other controller interactions)

Example:

```typescript
class TokensController extends BaseController</* ... */> {
  addToken(token: Token) {
    // Validate
    if (!token.address) {
      throw new Error('Token address is required');
    }

    if (this.#tokenExists(token.address)) {
      throw new Error(`Token already exists: ${token.address}`);
    }

    // Update state
    this.update((state) => {
      state.tokens.push(token);
      state.tokenCount = state.tokens.length;
      state.lastUpdated = Date.now();
    });

    // Side effects
    this.#notifyUI(token);
    this.#syncWithRemote(token);
  }
}
```

## State Derivation

### Keep State Minimal

- **NEVER store derived values in state**
- Use selectors to compute derived values
- Store only the minimal necessary data

Reference: [Redux Style Guide - Keep State Minimal](https://redux.js.org/style-guide/#keep-state-minimal-and-derive-additional-values)

Example:

```typescript
❌ WRONG: Storing derived values
type TokensControllerState = {
  tokens: Token[];
  tokenCount: number; // Derived from tokens.length
  hasTokens: boolean; // Derived from tokens.length > 0
};

✅ CORRECT: Derive values with selectors
type TokensControllerState = {
  tokens: Token[];
};

// Use selectors for derived values
const selectTokenCount = (state: TokensControllerState) => state.tokens.length;

const selectHasTokens = (state: TokensControllerState) => state.tokens.length > 0;

export const tokensControllerSelectors = {
  selectTokens: (state: TokensControllerState) => state.tokens,
  selectTokenCount,
  selectHasTokens,
};
```

### Subscribe to State Changes with Selectors

- Use messenger selector parameter to listen to specific state changes
- Avoid unnecessary re-renders or callbacks

Example:

```typescript
class PreferencesController extends BaseController</* ... */> {
  constructor({ messenger }: { messenger: PreferencesControllerMessenger }) {
    super({ name: 'PreferencesController', metadata, messenger, state });

    // Only triggered when selectedAccount changes, not all state changes
    this.messagingSystem.subscribe(
      'AccountsController:stateChange',
      (selectedAccount) => {
        this.#updateSelectedAddress(selectedAccount.address);
      },
      (accountsState) => accountsState.selectedAccount, // Selector function
    );
  }
}
```

## Controller Lifecycle

### Initialization

- Initialize with default state merged with partial state
- Set up messenger subscriptions in constructor
- Start background tasks if needed (polling, etc.)
- Validate dependencies are provided

### Cleanup

- Implement `destroy()` method if controller has cleanup needs
- Stop polling intervals
- Unsubscribe from events
- Clean up any external resources

Example:

```typescript
class TokensController extends BaseController</* ... */> {
  #pollInterval: NodeJS.Timeout | null = null;

  constructor(options: TokensControllerOptions) {
    super({
      name: 'TokensController',
      metadata: tokensControllerMetadata,
      messenger: options.messenger,
      state: { ...getDefaultTokensControllerState(), ...options.state },
    });

    // Set up subscriptions
    this.messagingSystem.subscribe(
      'NetworkController:stateChange',
      this.#handleNetworkChange.bind(this),
    );

    // Start polling if enabled
    if (options.enablePolling) {
      this.#startPolling();
    }
  }

  destroy() {
    // Stop polling
    if (this.#pollInterval) {
      clearInterval(this.#pollInterval);
      this.#pollInterval = null;
    }

    // BaseController will handle unsubscribing messenger events
    super.destroy();
  }

  #startPolling() {
    this.#pollInterval = setInterval(() => {
      this.fetchTokens();
    }, 30000);
  }
}
```

## Best Practices Checklist

Before submitting a controller, ensure:

### Architecture

- [ ] Controller inherits from `BaseController` (if it manages state)
- [ ] Controller name clearly reflects its responsibility
- [ ] Controller has a single, well-defined purpose

### State Management

- [ ] State type is clearly defined
- [ ] `getDefault${ControllerName}State` function is exported
- [ ] Constructor accepts optional `Partial<State>`
- [ ] State metadata is defined for all properties
- [ ] Metadata includes required properties (`includeInDebugSnapshot` or `anonymous`, `includeInStateLogs`, `persist`, `usedInUi`)
- [ ] State is updated only via `this.update()`
- [ ] State is minimal (no derived values stored)

### Constructor

- [ ] Uses single options bag pattern
- [ ] All options are named parameters
- [ ] Required BaseController arguments included
- [ ] No additional positional arguments

### Messenger

- [ ] Messenger types properly defined
- [ ] Action and event types follow naming convention
- [ ] `AllowedActions` and `AllowedEvents` types defined
- [ ] Callbacks replaced with messenger subscriptions
- [ ] Messenger used for inter-controller communication

### API Design

- [ ] Public methods have clear, descriptive names
- [ ] Methods model high-level actions, not setters
- [ ] Private implementation details are marked private
- [ ] No unnecessary public methods
- [ ] Methods validate inputs and throw descriptive errors

### Selectors

- [ ] Derived state accessed via selectors, not getters
- [ ] Selectors exported under `${controllerName}Selectors` object
- [ ] Selectors are pure functions
- [ ] `reselect` used for memoization where appropriate

### Lifecycle

- [ ] Controller initializes properly with partial state
- [ ] `destroy()` method implemented if cleanup needed
- [ ] Subscriptions set up in constructor
- [ ] Resources cleaned up in `destroy()`

### Documentation

- [ ] JSDoc comments on public methods
- [ ] Complex logic explained with inline comments
- [ ] State properties documented
- [ ] Type definitions are clear and complete

## References

- [MetaMask Controller Guidelines](https://github.com/MetaMask/core/blob/main/docs/controller-guidelines.md)
- [Redux Style Guide](https://redux.js.org/style-guide/)
- [Reselect Documentation](https://github.com/reduxjs/reselect)
