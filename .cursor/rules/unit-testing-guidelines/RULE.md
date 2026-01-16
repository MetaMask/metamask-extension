---
description: Project Guidelines for Unit Testing
globs: "*.test.*"
alwaysApply: false
---

Reference: [MetaMask Unit Testing Guidelines](https://github.com/MetaMask/contributor-docs/blob/main/docs/testing/unit-testing.md)

# MetaMask Extension - Cursor Rules

## Unit Testing Guidelines

### Testing Framework

- **ALWAYS use Jest** for unit tests (not Mocha or Tape)
- Leverage Jest's built-in features: module mocks, timer mocks, snapshots, and parallel test execution

### Test File Organization

#### File Placement

- **ALWAYS colocate test files with implementation files**
- Test files should use the `.test.ts` or `.test.tsx` extension
- Place test file in the same directory as the code it tests

Example:

```
✅ CORRECT:
src/
  permission-controller.ts
  permission-controller.test.ts

❌ WRONG:
src/
  permission-controller.ts
test/
  permission-controller.ts
```

#### Test Structure

- **ALWAYS wrap tests for the same function/method in a `describe` block**
- Use nested `describe` blocks to organize tests by method/function name
- Use `describe` blocks with "when..." or "if..." to group tests under scenarios

Example:

```typescript
describe('KeyringController', () => {
  describe('addAccount', () => {
    it('adds a new account to the given keyring', () => {
      // ...
    });
  });

  describe('removeAccount', () => {
    describe('when the account exists', () => {
      it('removes the account from its associated keyring', () => {
        // ...
      });
    });
  });
});
```

### Test Descriptions

#### Writing `it` Statements

- **NEVER use "should" at the beginning of test names**
- **NEVER repeat the function/method name in the test description**
- Describe the desired behavior in present tense
- Focus on a single aspect of behavior per test

Examples:

```typescript
❌ WRONG:
it('should not stop the block tracker', () => {});
it('addToken', () => {});

✅ CORRECT:
it('does not stop the block tracker', () => {});
it('adds the given token to "tokens" in state', () => {});
```

#### Test Focus

- **Keep tests focused on one aspect of behavior**
- If using "and" in a test description, consider splitting into multiple tests

Example:

```typescript
❌ WRONG:
it('starts the block tracker and returns the block number', () => {});

✅ CORRECT:
it('starts the block tracker', () => {});
it('returns the block number', () => {});
```

### Testing Approach

#### Private Code

- **NEVER directly test private code**
- Test private methods/functions through their public interface
- Private code includes:
  - Non-exported functions or classes
  - Methods starting with `#` (ECMAScript private fields)
  - Methods starting with `_` (informal private convention)
  - Methods with `private` keyword in TypeScript
  - Functions/methods tagged with `@private` JSDoc

#### Test Phase Organization

- **Clearly separate the three phases of a test:**
  1. **Arrange**: Set up test data and preconditions
  2. **Act**: Execute the code being tested
  3. **Assert**: Verify the expected behavior
- Use blank lines or comments to highlight the "exercise" (Act) phase
- Consider using comments like `// Arrange`, `// Act`, `// Assert` for complex tests

#### Test Data

- **Keep critical data inside the test**
- Don't spread essential test data across multiple variables at file level
- Make the test "story" self-contained and easy to follow
- Inline important data rather than referencing distant constants

Example:

```typescript
✅ CORRECT:
it('loads the token list for the selected chain', async () => {
  const chainIdInHex = '0x1';
  const tokensByAddress = {
    '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f': {
      address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
      symbol: 'SNX',
      decimals: 18,
      // ... other properties inline
    },
  };

  // ... test continues with this data
});
```

### Mocking and Test Utilities

#### Mock Functions

- **Use Jest's mock functions instead of Sinon**
- Use `jest.fn()` instead of `sinon.stub()`
- Use `jest.spyOn(object, method)` instead of `sinon.spy()` or `sinon.stub()`
- Use `jest.useFakeTimers()` instead of `sinon.useFakeTimers()`

#### Manual Mocks

- **AVOID general manual mocks in `__mocks__/` directories**
- Manual mocks in `__mocks__/` are automatically applied to ALL tests
- Only use manual mocks when absolutely necessary and document their impact
- Prefer inline mocks with `jest.mock()` for test-specific behavior

#### Test Helpers

- Create helper functions to reduce boilerplate
- Use TypeScript for type-safe test utilities
- Prefer async/await for test helpers that set up controllers or async resources
- Include cleanup/teardown in helper functions (use try/finally)

Example:

```typescript
async function withController(...args: WithControllerArgs) {
  const controller = new TokensController(options);

  try {
    await fn({ controller });
  } finally {
    controller.destroy();
  }
}
```

### Snapshot Testing

#### Snapshot Test Naming

- **NEVER name snapshot tests as "should render correctly" or "renders correctly"**
- **ALWAYS use "render matches snapshot" or similar variants**
- Add context when needed: "render matches snapshot when not enabled"
- Remember: Snapshots only check for changes, NOT correctness

Examples:

```typescript
❌ WRONG:
it('should renders correctly', () => {});
it('renders correctly', () => {});

✅ CORRECT:
it('render matches snapshot', () => {});
it('render matches snapshot when not enabled', () => {});
it('render matches snapshot with custom props', () => {});
```

### Async Testing Best Practices

#### Async/Await Usage

- **ALWAYS use async/await instead of callbacks or done()**
- Return promises from test functions when using async operations
- Never mix done() callbacks with async/await

Examples:

```typescript
❌ WRONG:
it('fetches data', (done) => {
  fetchData().then((data) => {
    expect(data).toBeDefined();
    done();
  });
});

✅ CORRECT:
it('fetches data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

#### Timer Mocking

- Use `jest.useFakeTimers()` with fake timers for time-dependent code
- Use `jest.advanceTimersByTime()` to control time progression
- Remember to call `jest.runAllTimers()` or `jest.advanceTimersByTime()` before assertions
- Clean up timers with `jest.useRealTimers()` in `afterEach`

Example:

```typescript
describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('delays execution by specified time', () => {
    const callback = jest.fn();
    const debounced = debounce(callback, 1000);

    debounced();
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
```

#### Error Path Testing

- **ALWAYS test both success and error paths for async operations**
- Use `expect().rejects.toThrow()` for async error assertions
- Test error recovery and cleanup behavior
- Verify specific error types and messages

Example:

```typescript
it('throws an error when the network request fails', async () => {
  nock('https://api.example.com')
    .get('/data')
    .reply(500, { error: 'Internal Server Error' });

  await expect(fetchData()).rejects.toThrow('Failed to fetch data');
});

it('cleans up resources after an error', async () => {
  const cleanup = jest.fn();

  try {
    await operationThatFails();
  } catch (error) {
    cleanup();
  }

  expect(cleanup).toHaveBeenCalled();
});
```

#### Async State Changes

- Use `waitFor()` or similar patterns for async state changes (React Testing Library)
- Set appropriate test timeouts for long-running operations
- Avoid arbitrary delays with `setTimeout()` in tests

Example:

```typescript
it('updates state after async operation', async () => {
  render(<MyComponent />);

  fireEvent.click(screen.getByRole('button', { name: 'Load Data' }));

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### Mock Data Management

#### Test Data Factories

- Create factory functions for complex test objects
- Use builders for objects with many optional properties
- Keep factories in test files or colocated test-utils (not in `__mocks__/`)
- Prefer minimal valid objects, adding only necessary properties per test

Example:

```typescript
// Good: Factory function for creating test data
function createMockTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    id: '1',
    status: 'pending',
    from: '0x123',
    to: '0x456',
    value: '0x0',
    gasLimit: '0x5208',
    ...overrides,
  };
}

describe('TransactionController', () => {
  it('updates transaction status', () => {
    const transaction = createMockTransaction({
      id: '42',
      status: 'submitted',
    });

    controller.updateTransaction(transaction);

    expect(controller.state.transactions[0].status).toBe('submitted');
  });
});
```

#### Builder Pattern for Complex Objects

- Use builder pattern for objects with many optional fields
- Chain methods for readability
- Provide sensible defaults

Example:

```typescript
class TransactionBuilder {
  private transaction: Partial<Transaction> = {
    status: 'pending',
    value: '0x0',
  };

  withId(id: string): this {
    this.transaction.id = id;
    return this;
  }

  withStatus(status: TransactionStatus): this {
    this.transaction.status = status;
    return this;
  }

  build(): Transaction {
    return this.transaction as Transaction;
  }
}

it('processes confirmed transactions', () => {
  const transaction = new TransactionBuilder()
    .withId('1')
    .withStatus('confirmed')
    .build();

  // test with transaction
});
```

#### Avoid Shared Mutable State

- Don't reuse mock objects across tests
- Each test should create its own fresh mock data
- Be careful with module-level constants that are mutated

Example:

```typescript
❌ WRONG:
const mockAccount = { address: '0x123', balance: '100' };

it('updates balance', () => {
  mockAccount.balance = '200'; // Mutates shared state!
  expect(getBalance(mockAccount)).toBe('200');
});

it('has initial balance', () => {
  expect(getBalance(mockAccount)).toBe('100'); // Will fail!
});

✅ CORRECT:
function createMockAccount() {
  return { address: '0x123', balance: '100' };
}

it('updates balance', () => {
  const account = createMockAccount();
  account.balance = '200';
  expect(getBalance(account)).toBe('200');
});

it('has initial balance', () => {
  const account = createMockAccount();
  expect(getBalance(account)).toBe('100');
});
```

### Controller-Specific Testing Patterns

Reference: [MetaMask Controller Guidelines](https://github.com/MetaMask/core/blob/main/docs/controller-guidelines.md)

#### Controller Lifecycle Testing

- **ALWAYS test controller initialization with default state**
- Test controller destruction/cleanup (if `destroy()` method exists)
- Verify state is properly initialized with partial state options
- Test that default state function (`getDefault${ControllerName}State`) returns correct values

Example:

```typescript
describe('TokensController', () => {
  describe('constructor', () => {
    it('initializes with default state when no state is provided', () => {
      const controller = new TokensController({
        messenger: getTokensMessenger(),
      });

      expect(controller.state).toStrictEqual(getDefaultTokensControllerState());
    });

    it('merges provided state with defaults', () => {
      const controller = new TokensController({
        messenger: getTokensMessenger(),
        state: { tokens: { '0x1': [{ address: '0xabc' }] } },
      });

      expect(controller.state.tokens).toStrictEqual({
        '0x1': [{ address: '0xabc' }],
      });
      // Other default state properties should still be present
    });
  });

  describe('destroy', () => {
    it('cleans up subscriptions and timers', () => {
      const controller = new TokensController({
        messenger: getTokensMessenger(),
      });

      controller.destroy();

      // Verify cleanup occurred (e.g., no memory leaks, timers cleared)
    });
  });
});
```

#### State Management Testing

- **Test state updates through controller methods, not direct state manipulation**
- Verify state changes trigger appropriate events via messenger
- Use `controller.state` to access state (NOT internal properties)
- Test that state metadata is correctly defined (persist, anonymous, usedInUi)

Example:

```typescript
describe('TokensController', () => {
  describe('addToken', () => {
    it('updates state with new token', () => {
      const controller = new TokensController({
        messenger: getTokensMessenger(),
      });

      controller.addToken({
        address: '0x123',
        symbol: 'DAI',
        decimals: 18,
      });

      expect(controller.state.tokens['0x1']).toContainEqual({
        address: '0x123',
        symbol: 'DAI',
        decimals: 18,
      });
    });

    it('publishes state change event', async () => {
      const messenger = getTokensMessenger();
      const stateChangeListener = jest.fn();

      messenger.subscribe('TokensController:stateChange', stateChangeListener);

      const controller = new TokensController({ messenger });
      controller.addToken({ address: '0x123', symbol: 'DAI', decimals: 18 });

      expect(stateChangeListener).toHaveBeenCalled();
    });
  });
});
```

#### Messenger Interaction Testing

- Mock other controllers using messenger allowedActions
- Test event subscriptions and publications
- Verify messenger calls to other controllers
- Test that controller responds correctly to events from other controllers

Example:

```typescript
describe('PreferencesController', () => {
  it('updates when AccountsController state changes', () => {
    const messenger = getPreferencesMessenger();
    const controller = new PreferencesController({ messenger });

    // Trigger AccountsController state change
    messenger.publish(
      'AccountsController:stateChange',
      {
        selectedAccount: { address: '0x456' },
      },
      [],
    );

    expect(controller.state.selectedAddress).toBe('0x456');
  });

  it('calls AccountsController to get accounts', () => {
    const messenger = getPreferencesMessenger();
    const getAccountsSpy = jest.spyOn(messenger, 'call');

    const controller = new PreferencesController({ messenger });
    controller.syncWithAccounts();

    expect(getAccountsSpy).toHaveBeenCalledWith(
      'AccountsController:getAccounts',
    );
  });
});
```

#### Selector Testing

- Test selectors as pure functions independently from controllers
- Use actual controller state shape in selector tests
- Test memoization behavior if using `reselect`
- Export selectors under `${controllerName}Selectors` object

Example:

```typescript
import { accountsControllerSelectors } from './AccountsController';

describe('accountsControllerSelectors', () => {
  describe('selectActiveAccounts', () => {
    it('returns only active accounts', () => {
      const state = {
        accounts: [
          { address: '0x1', isActive: true },
          { address: '0x2', isActive: false },
          { address: '0x3', isActive: true },
        ],
      };

      const result = accountsControllerSelectors.selectActiveAccounts(state);

      expect(result).toHaveLength(2);
      expect(result[0].address).toBe('0x1');
      expect(result[1].address).toBe('0x3');
    });
  });
});
```

#### External Dependency Mocking

- Mock network requests (use `nock` for HTTP)
- Mock blockchain interactions (eth_call, eth_sendTransaction, etc.)
- Mock storage operations
- Mock other controllers via messenger

Example:

```typescript
describe('TokensController', () => {
  describe('fetchTokens', () => {
    it('fetches tokens from API', async () => {
      nock('https://token-api.example.com')
        .get('/tokens/1')
        .reply(200, [{ address: '0x123', symbol: 'DAI', decimals: 18 }]);

      const controller = new TokensController({
        messenger: getTokensMessenger(),
      });

      await controller.fetchTokens();

      expect(controller.state.tokens['0x1']).toHaveLength(1);
    });

    it('handles API errors gracefully', async () => {
      nock('https://token-api.example.com')
        .get('/tokens/1')
        .reply(500, { error: 'Internal Server Error' });

      const controller = new TokensController({
        messenger: getTokensMessenger(),
      });

      await expect(controller.fetchTokens()).rejects.toThrow();
    });
  });
});
```

#### Action Method Testing

- Test methods as high-level actions, not just state setters
- Verify business logic within action methods
- Test side effects (API calls, event emissions, messenger calls)
- Test validation and error handling

Example:

```typescript
describe('AlertsController', () => {
  describe('dismissAlert', () => {
    it('marks alert as dismissed in state', () => {
      const controller = new AlertsController({
        messenger: getAlertsMessenger(),
        state: {
          alerts: {
            alert1: { message: 'Test', isDismissed: false },
          },
        },
      });

      controller.dismissAlert('alert1');

      expect(controller.state.alerts.alert1.isDismissed).toBe(true);
    });

    it('throws error if alert does not exist', () => {
      const controller = new AlertsController({
        messenger: getAlertsMessenger(),
      });

      expect(() => controller.dismissAlert('nonexistent')).toThrow(
        'Alert not found: nonexistent',
      );
    });
  });
});
```

## General Coding Standards

### TypeScript

- Prefer TypeScript over JavaScript for all new code
- Use proper type annotations (avoid `any`)
- Define interfaces for complex objects and function parameters

### Code Organization

- Export public interfaces only
- Keep implementation details private
- Use meaningful variable and function names

### Documentation

- Add JSDoc comments for public APIs
- Document complex logic inline
- Keep comments up-to-date with code changes

## Testing Checklist

Before submitting tests, ensure:

### Basic Structure

- [ ] Test file is colocated with implementation
- [ ] Tests are organized with `describe` blocks by method/function
- [ ] Test descriptions use present tense without "should"
- [ ] Tests are focused on single behaviors
- [ ] Private code is tested through public interface
- [ ] Test phases (Arrange, Act, Assert) are clear

### Mocking and Data

- [ ] Critical test data is kept inline
- [ ] Jest mocks are used (not Sinon)
- [ ] Manual mocks in `__mocks__/` are avoided
- [ ] Factory functions used for complex test objects
- [ ] No shared mutable state across tests
- [ ] Fresh mock data created per test

### Async Testing

- [ ] async/await used (not done() callbacks)
- [ ] Fake timers used for time-dependent code
- [ ] Both success and error paths tested for async operations
- [ ] Appropriate timeouts set for long operations

### Controller Testing (if applicable)

- [ ] Controller initialization tested with default state
- [ ] State updates tested through controller methods
- [ ] Messenger interactions verified
- [ ] Controller lifecycle (destroy/cleanup) tested
- [ ] Selectors tested as pure functions
- [ ] External dependencies properly mocked

### Final Checks

- [ ] Snapshot tests are named "render matches snapshot"
- [ ] All tests pass and are deterministic
- [ ] Tests run in isolation (can run individually)
- [ ] No console errors or warnings
