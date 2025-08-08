# MetaMask System Tests - Usage Guide

## Overview

The system tests provide comprehensive end-to-end testing of MetaMask's core functionality using Playwright. These tests simulate real user interactions with the browser extension.

## Test Structure

```
test/e2e/playwright/system/
├── fixtures/
│   └── onboarding.fixture.ts     # Onboarding test fixtures and helpers
├── page-objects/
│   ├── home-page.ts             # Home page interactions
│   └── transaction-page.ts      # Transaction-related interactions
├── specs/
│   ├── onboarding.spec.ts       # Onboarding flow tests
│   ├── transactions.spec.ts     # Basic transaction tests
│   └── advanced-transactions.spec.ts # Advanced transaction scenarios
├── utils/
│   └── test-helpers.ts          # Common test utilities
└── README.md                    # Documentation
```

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   yarn install
   yarn playwright install chromium
   ```

2. Build the extension:
   ```bash
   yarn dist
   ```

### Basic Commands

```bash
# Run all system tests
yarn test:e2e:system

# Run with visible browser (non-headless)
HEADLESS=false yarn test:e2e:system

# Run specific test file
yarn playwright test test/e2e/playwright/system/specs/onboarding.spec.ts --project=system

# Run tests matching a pattern
yarn playwright test --project=system --grep="transaction"

# Run with debug mode
yarn playwright test --project=system --debug

# Show test results
yarn test:e2e:pw:report
```

### Advanced Options

```bash
# Run tests with specific browser
yarn playwright test --project=system --browser=chromium

# Run tests with custom timeout
yarn playwright test --project=system --timeout=180000

# Run tests with retries
yarn playwright test --project=system --retries=2

# Generate and view trace files
yarn playwright test --project=system --trace=on
yarn playwright show-trace trace.zip
```

## Test Categories

### 1. Onboarding Tests (`onboarding.spec.ts`)

Tests the complete user onboarding experience:

- **New Wallet Creation**: Full flow from welcome screen to home page
- **Wallet Import**: Import existing wallet using seed phrase
- **Security Setup**: Seed phrase backup and confirmation
- **Validation**: Password requirements, invalid seed phrases
- **Edge Cases**: Skip security setup, incomplete flows

### 2. Basic Transaction Tests (`transactions.spec.ts`)

Core transaction functionality:

- **Send ETH**: Basic send transaction flow
- **Transaction Confirmation**: Confirm and reject flows
- **Gas Fee Editing**: Custom gas price and limit settings
- **Validation**: Insufficient funds, invalid addresses
- **Transaction History**: Activity tab and transaction list
- **Multiple Transactions**: Queue handling and navigation

### 3. Advanced Transaction Tests (`advanced-transactions.spec.ts`)

Complex transaction scenarios:

- **Custom Gas Settings**: Detailed gas fee configuration
- **Sequential Transactions**: Multiple transactions in sequence
- **Transaction Management**: Speed up, cancel, replace
- **Edge Cases**: Zero amounts, maximum precision
- **Network Context**: Network switching during transactions
- **State Persistence**: Page refresh handling

## Writing New Tests

### 1. Using Fixtures

```typescript
import { test, expect } from '../fixtures/onboarding.fixture';

test('my test', async ({ extensionPage, onboardingHelper }) => {
  // extensionPage: Playwright Page object for the extension
  // onboardingHelper: Helper methods for onboarding flows
});
```

### 2. Using Page Objects

```typescript
import { HomePage } from '../page-objects/home-page';
import { TransactionPage } from '../page-objects/transaction-page';

test('transaction test', async ({ extensionPage }) => {
  const homePage = new HomePage(extensionPage);
  const transactionPage = new TransactionPage(extensionPage);

  await homePage.waitForLoad();
  await transactionPage.initiateTransaction('0x123...', '0.001');
});
```

### 3. Using Test Helpers

```typescript
import { TestHelpers } from '../utils/test-helpers';

test('helper example', async ({ extensionPage }) => {
  // Wait for elements
  await TestHelpers.waitForTestId(extensionPage, 'my-element');

  // Generate test data
  const address = TestHelpers.generateRandomAddress();
  const amount = TestHelpers.generateRandomAmount();

  // Retry operations
  await TestHelpers.retryAction(async () => {
    await extensionPage.click('button');
  });
});
```

## Best Practices

### 1. Test Organization

- Group related tests in `describe` blocks
- Use descriptive test names that explain the scenario
- Keep tests focused on a single feature or flow
- Use `beforeEach` for common setup

### 2. Waiting and Timing

```typescript
// ✅ Good: Use specific waits
await extensionPage.waitForSelector('[data-testid="element"]');
await TestHelpers.waitForTestId(extensionPage, 'element');

// ❌ Avoid: Generic timeouts
await extensionPage.waitForTimeout(5000);
```

### 3. Assertions

```typescript
// ✅ Good: Specific assertions
await expect(element).toBeVisible();
await expect(element).toContainText('Expected text');

// ✅ Good: Custom assertions
await homePage.assertBalanceEquals('1.5 ETH');
await transactionPage.assertTransactionDetails(address, amount);
```

### 4. Error Handling

```typescript
// Handle expected errors gracefully
try {
  await transactionPage.waitForTransactionConfirmation();
} catch (error) {
  // Fallback behavior
  await homePage.waitForLoad();
}
```

### 5. Data Management

```typescript
// Use constants for test data
const TEST_SEED_PHRASE = 'test test test test test test test test test test test junk';
const TEST_RECIPIENT = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

// Generate dynamic data when needed
const randomAddress = TestHelpers.generateRandomAddress();
```

## Debugging

### 1. Visual Debugging

```bash
# Run with visible browser
HEADLESS=false yarn test:e2e:system

# Use debug mode (opens browser dev tools)
yarn playwright test --project=system --debug
```

### 2. Screenshots and Videos

```typescript
// Take screenshot for debugging
await TestHelpers.takeScreenshot(extensionPage, 'debug-screenshot');

// Videos are automatically recorded on failure
```

### 3. Console Logs

```typescript
// Add debug logging
console.log('Current URL:', extensionPage.url());
console.log('Page title:', await extensionPage.title());
```

### 4. Trace Viewer

```bash
# Run with trace collection
yarn playwright test --project=system --trace=on

# View traces
yarn playwright show-trace trace.zip
```

## Troubleshooting

### Common Issues

1. **Extension not loading**: Ensure `yarn dist` was run successfully
2. **Timeouts**: Increase timeout or add specific waits
3. **Element not found**: Check selectors and wait for page load
4. **Flaky tests**: Add retries and improve wait conditions

### Environment Variables

- `HEADLESS=false`: Run tests with visible browser
- `CI=true`: Enable CI mode with retries
- `PLAYWRIGHT_HTML_REPORT`: Custom report location

### Performance

- Use `fullyParallel: false` for system tests to avoid conflicts
- Set appropriate timeouts for complex operations
- Use single worker (`workers: 1`) for stability

## Contributing

When adding new tests:

1. Follow existing patterns and naming conventions
2. Add appropriate documentation and comments
3. Test both success and failure scenarios
4. Ensure tests are deterministic and not flaky
5. Update this documentation if adding new patterns
