---
description: i18n Usage Guidelines for Unit and E2E Test Files
globs: '{*.test.*,*.spec.*}'
alwaysApply: false
---

Reference: [PR #39859 - Replace hardcoded strings with i18n message references](https://github.com/MetaMask/metamask-extension/pull/39859)

# Test i18n Usage Guidelines

## Import i18n Messages from Test Helpers

### ALWAYS Use enLocale from Test Helpers

- **Import locale messages from `test/lib/i18n-helpers`**, not directly from `app/_locales/en/messages.json`
- Use the alias `enLocale as messages` for consistency
- This prevents tests from breaking when translations change
- Eliminates need for `eslint-disable-next-line import/no-restricted-paths`

```typescript
✅ CORRECT:
import { enLocale as messages } from '../../../test/lib/i18n-helpers';

❌ WRONG:
// eslint-disable-next-line import/no-restricted-paths
import enMessages from '../../../app/_locales/en/messages.json';
```

## Use i18n Keys in Test Assertions

### Reference Locale Messages in Queries

- **ALWAYS use `messages.<key>.message`** instead of hardcoded strings
- Makes tests resilient to translation changes
- Self-documenting - shows which i18n key is being used
- Caught by fitness function test that prevents locale query mismatches

```typescript
✅ CORRECT:
import { enLocale as messages } from '../../../test/lib/i18n-helpers';

it('displays cancel button', () => {
  render(<MyComponent />);
  expect(screen.getByText(messages.cancel.message)).toBeInTheDocument();
});

it('finds button by role and name', () => {
  render(<MyComponent />);
  const button = screen.getByRole('button', { name: messages.confirm.message });
  expect(button).toBeInTheDocument();
});

❌ WRONG:
it('displays cancel button', () => {
  render(<MyComponent />);
  expect(screen.getByText('Cancel')).toBeInTheDocument(); // Hardcoded string
});

it('finds button by role and name', () => {
  render(<MyComponent />);
  const button = screen.getByRole('button', { name: 'Confirm' }); // Hardcoded string
  expect(button).toBeInTheDocument();
});
```

## Handle Parameterized i18n Strings

### Use String Replace for Placeholders

- **ALWAYS use `.replace()` for parameterized locale strings**
- i18n strings with placeholders like `$1`, `$2` need runtime replacement
- Chain multiple `.replace()` calls for multiple parameters

```typescript
✅ CORRECT:
import { enLocale as messages } from '../../../test/lib/i18n-helpers';

it('displays token with symbol', () => {
  render(<TokenDisplay symbol="DAI" />);
  const expectedText = messages.tokenBalance.message.replace('$1', 'DAI');
  expect(screen.getByText(expectedText)).toBeInTheDocument();
});

it('displays message with multiple parameters', () => {
  render(<TransferMessage from="Alice" to="Bob" />);
  const expectedText = messages.transferFrom.message
    .replace('$1', 'Alice')
    .replace('$2', 'Bob');
  expect(screen.getByText(expectedText)).toBeInTheDocument();
});

❌ WRONG:
it('displays token with symbol', () => {
  render(<TokenDisplay symbol="DAI" />);
  expect(screen.getByText('Balance: DAI')).toBeInTheDocument(); // Hardcoded
});

it('displays message with placeholders', () => {
  render(<TransferMessage from="Alice" to="Bob" />);
  // This will fail - placeholders not replaced
  expect(screen.getByText(messages.transferFrom.message)).toBeInTheDocument();
});
```

## Import Testing Library Utilities Directly

### Import fireEvent from @testing-library/react

- **Import `fireEvent` directly from `@testing-library/react`**
- Don't import from `test/jest` re-exports
- Apply to all @testing-library utilities (screen, render, waitFor, etc.)

```typescript
✅ CORRECT:
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

it('handles click event', () => {
  render(<MyButton onClick={mockFn} />);
  fireEvent.click(screen.getByRole('button'));
  expect(mockFn).toHaveBeenCalled();
});

❌ WRONG:
import { fireEvent } from '../../../test/jest';
import { render, screen } from '@testing-library/react';

it('handles click event', () => {
  render(<MyButton onClick={mockFn} />);
  fireEvent.click(screen.getByRole('button'));
  expect(mockFn).toHaveBeenCalled();
});
```

## Fitness Function Protection

### Quality Gate for Locale Query Mismatches

A fitness function test (`test/unit-global/locale-query-mismatch.test.ts`) prevents:

1. **Querying via locale keys when component renders hardcoded text**
   - If component has hardcoded JSX text, test shouldn't query via i18n key

2. **Introducing new hardcoded query strings that match existing locale values**
   - New tests must use `messages.<key>.message` pattern
   - Baseline allowlist exists for legacy exceptions

If the fitness function fails, either:

- Fix the test to use i18n references
- Fix the component to use i18n (preferred)
- Add to baseline only if legacy code

## Complete Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { TokenApproval } from './token-approval';

describe('TokenApproval', () => {
  const mockProps = {
    tokenSymbol: 'USDC',
    spenderName: 'Uniswap',
    onApprove: jest.fn(),
    onReject: jest.fn(),
  };

  it('displays approval message with token and spender', () => {
    render(<TokenApproval {...mockProps} />);

    const expectedMessage = messages.approveTokenSpender.message
      .replace('$1', 'USDC')
      .replace('$2', 'Uniswap');

    expect(screen.getByText(expectedMessage)).toBeInTheDocument();
  });

  it('calls onApprove when confirm button is clicked', () => {
    render(<TokenApproval {...mockProps} />);

    const confirmButton = screen.getByRole('button', {
      name: messages.confirm.message,
    });

    fireEvent.click(confirmButton);

    expect(mockProps.onApprove).toHaveBeenCalledTimes(1);
  });

  it('calls onReject when cancel button is clicked', () => {
    render(<TokenApproval {...mockProps} />);

    const cancelButton = screen.getByRole('button', {
      name: messages.cancel.message,
    });

    fireEvent.click(cancelButton);

    expect(mockProps.onReject).toHaveBeenCalledTimes(1);
  });

  it('disables confirm button when loading', () => {
    render(<TokenApproval {...mockProps} isLoading />);

    const confirmButton = screen.getByRole('button', {
      name: messages.confirm.message,
    });

    expect(confirmButton).toBeDisabled();
  });
});
```

## Benefits of This Approach

1. **Resilient to translation changes** - Tests won't break when copy changes
2. **Self-documenting** - Clear which i18n keys are being tested
3. **Enforced by automation** - Fitness function prevents regressions
4. **Consistent patterns** - All tests follow same i18n approach
5. **Better refactoring** - Can safely update translations without test failures

## Checklist

Before submitting tests:

- [ ] Import `enLocale as messages` from `test/lib/i18n-helpers`
- [ ] No direct imports from `app/_locales/en/messages.json`
- [ ] All string queries use `messages.<key>.message` pattern
- [ ] Parameterized strings use `.replace()` for placeholders
- [ ] Import testing utilities directly from `@testing-library/react`
- [ ] No hardcoded English strings in assertions
- [ ] Fitness function test passes
