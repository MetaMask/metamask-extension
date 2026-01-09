# MetaMask Extension LLM Workflow

Tooling for LLM agents to build, launch, and interact with the MetaMask Chrome extension using Playwright. Provides a complete feedback loop for implementing and validating code changes.

## Purpose

This workflow enables LLM agents to:

1. **Build** the MetaMask extension from source
2. **Launch** the extension in a real Chrome browser with Playwright
3. **Interact** with the wallet UI (unlock, send, swap, etc.)
4. **Capture screenshots** to visually validate behavior
5. **Analyze state** to understand what screen is displayed
6. **Iterate** based on visual/state feedback until acceptance criteria are met

---

## Complete Development Workflow

When implementing a task, follow this cycle:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. GET TASK          │  Read GitHub issue/PR requirements                  │
├───────────────────────┼─────────────────────────────────────────────────────┤
│  2. GATHER CONTEXT    │  Search codebase, understand existing patterns      │
├───────────────────────┼─────────────────────────────────────────────────────┤
│  3. PLAN              │  Break down into atomic implementation steps        │
├───────────────────────┼─────────────────────────────────────────────────────┤
│  4. IMPLEMENT         │  Write code changes                                 │
├───────────────────────┼─────────────────────────────────────────────────────┤
│  5. RUN TESTS         │  yarn test:unit, yarn test:integration              │
├───────────────────────┼─────────────────────────────────────────────────────┤
│  6. BUILD & LAUNCH    │  Use this workflow to launch extension              │
├───────────────────────┼─────────────────────────────────────────────────────┤
│  7. VISUAL VALIDATION │  Take screenshots, analyze UI state                 │
├───────────────────────┼─────────────────────────────────────────────────────┤
│  8. ITERATE           │  If acceptance criteria NOT met → go to step 4      │
└───────────────────────┴─────────────────────────────────────────────────────┘
```

### Step-by-Step Implementation Guide

#### Step 5: Run Tests

```bash
# Unit tests
yarn test:unit

# Integration tests
yarn test:integration

# Lint
yarn lint:changed
```

#### Step 6: Build & Launch Extension

```typescript
import {
  launchMetaMask,
  DEFAULT_PASSWORD,
  HomePage,
} from './test/e2e/playwright/llm-workflow';

const launcher = await launchMetaMask();
try {
  await launcher.unlock(DEFAULT_PASSWORD);
  // Your validation logic here
} finally {
  await launcher.cleanup();
}
```

#### Step 7: Visual Validation

```typescript
// Take screenshot for visual analysis
const screenshot = await launcher.screenshot({ name: 'after-my-change' });
console.log('Screenshot saved to:', screenshot.path);
console.log(
  'Base64 for analysis:',
  screenshot.base64.substring(0, 100) + '...',
);

// Check current screen programmatically
const state = await launcher.getState();
console.log('Current screen:', state.currentScreen);
// Possible values: 'unlock' | 'home' | 'onboarding-*' | 'settings' | 'unknown'

// Get specific UI data
const homePage = new HomePage(launcher.getPage());
console.log('Balance:', await homePage.getBalance());
console.log('Network:', await homePage.getNetworkName());
```

---

## Quick Start

### Minimal Example

```typescript
import {
  launchMetaMask,
  DEFAULT_PASSWORD,
  HomePage,
} from './test/e2e/playwright/llm-workflow';

const launcher = await launchMetaMask();
await launcher.unlock(DEFAULT_PASSWORD);

const homePage = new HomePage(launcher.getPage());
console.log('Balance:', await homePage.getBalance());

await launcher.screenshot({ name: 'current-state' });
await launcher.cleanup();
```

### Run Validation Script

```bash
# Quick validation that everything works
npx tsx test/e2e/playwright/llm-workflow/test-run.ts
```

---

## Launch Modes

### Default: Pre-Onboarded Wallet

Wallet is already set up with 25 ETH. Just unlock and use.

```typescript
const launcher = await launchMetaMask();
await launcher.unlock(DEFAULT_PASSWORD); // 'correct horse battery staple'
```

### Fresh Wallet: Onboarding Flow

Start with a brand new wallet that requires onboarding.

```typescript
const launcher = await launchMetaMask({ stateMode: 'onboarding' });
await launcher.completeOnboarding({ password: 'MySecurePassword123!' });
```

### Custom Fixture: Specific Wallet State

Pre-configure wallet with tokens, networks, contacts, etc.

```typescript
import {
  launchMetaMask,
  createFixtureBuilder,
  FixturePresets,
} from './test/e2e/playwright/llm-workflow';

// Option 1: Use FixtureBuilder for full control
const fixture = createFixtureBuilder()
  .withPreferencesController({ showTestNetworks: true })
  .withPopularNetworks()
  .build();

const launcher = await launchMetaMask({ stateMode: 'custom', fixture });

// Option 2: Use Presets for common scenarios
const launcher2 = await launchMetaMask({
  stateMode: 'custom',
  fixture: FixturePresets.withMultipleAccounts(),
});
```

---

## API Reference

> **Note**: This workflow always runs Chrome in headed mode. Headless mode is not supported due to Chrome extension limitations.

### LaunchOptions

| Option       | Type                                  | Default        | Description                               |
| ------------ | ------------------------------------- | -------------- | ----------------------------------------- |
| `autoBuild`  | boolean                               | true           | Build extension if not present            |
| `stateMode`  | 'default' \| 'onboarding' \| 'custom' | 'default'      | Wallet state mode                         |
| `fixture`    | FixtureData                           | -              | Custom fixture (when stateMode: 'custom') |
| `network`    | NetworkConfig                         | localhost:8545 | Anvil network configuration               |
| `ports`      | PortsConfig                           | -              | Custom ports (for parallel runs)          |
| `slowMo`     | number                                | 0              | Slow down actions (ms) for debugging      |
| `mockServer` | MockServerConfig                      | -              | HTTP mocking (EXPERIMENTAL)               |

#### Advanced Options

| Option           | Type   | Default                      | Description                       |
| ---------------- | ------ | ---------------------------- | --------------------------------- |
| `extensionPath`  | string | `dist/chrome`                | Path to built extension directory |
| `userDataDir`    | string | auto-generated temp dir      | Chrome user data directory        |
| `viewportWidth`  | number | 1280                         | Browser viewport width            |
| `viewportHeight` | number | 800                          | Browser viewport height           |
| `screenshotDir`  | string | `test-artifacts/screenshots` | Directory for saved screenshots   |

### MetaMaskExtensionLauncher Methods

```typescript
// Wallet Operations
launcher.unlock(password); // Unlock pre-onboarded wallet
launcher.completeOnboarding(options); // Complete fresh wallet setup

// State & Screenshots (KEY FOR FEEDBACK LOOP)
launcher.getState(); // Returns { currentScreen, isUnlocked, extensionId, ... }
launcher.screenshot({ name: 'x' }); // Returns { path, base64, width, height }
launcher.debugDump('failure'); // Saves screenshot + state JSON + console errors

// Navigation
launcher.navigateToHome(); // Go to main wallet screen
launcher.navigateToSettings(); // Go to settings

// Low-Level Interaction
launcher.getPage(); // Raw Playwright Page object
launcher.getContext(); // Browser context
launcher.click(selector); // Click element
launcher.fill(selector, value); // Fill input
launcher.waitFor(selector, timeout); // Wait for element
launcher.getText(selector); // Get element text

// Dapp Testing
launcher.openNewDappPage(url); // Open dapp in new tab

// Infrastructure
launcher.getAnvil(); // Anvil blockchain instance
launcher.getMockServer(); // MockServer instance (if enabled)
launcher.cleanup(); // ALWAYS call this when done
```

### Page Objects

Pre-built interactions for common screens:

```typescript
import {
  HomePage,
  LoginPage,
  OnboardingFlow,
} from './test/e2e/playwright/llm-workflow';

// HomePage - Main wallet UI
const home = new HomePage(launcher.getPage());
await home.getBalance(); // "25 ETH"
await home.getNetworkName(); // "Localhost 8545"
await home.clickSend(); // Open send flow
await home.clickSwap(); // Open swap
await home.clickBridge(); // Open bridge
await home.openSettings(); // Navigate to settings
await home.switchToActivityTab(); // View transaction history
await home.clickNetworkSelector(); // Change network

// LoginPage - Unlock screen
const login = new LoginPage(launcher.getPage());
await login.unlock('password');

// OnboardingFlow - Fresh wallet setup
const onboarding = new OnboardingFlow(launcher.getPage());
await onboarding.importWallet({ password: 'MyPassword!' });
```

### Screenshot Options

```typescript
await launcher.screenshot({
  name: 'descriptive-name',  // Required: filename prefix
  fullPage: true,            // Capture entire page (default: true)
  selector: '.specific-el',  // Capture specific element only
  timestamp: true,           // Add timestamp to filename (default: true)
});

// Returns:
{
  path: '/path/to/screenshot.png',
  base64: 'iVBORw0KGgo...',  // For programmatic analysis
  width: 1280,
  height: 800
}
```

### ExtensionState

```typescript
const state = await launcher.getState();
// Returns:
{
  isLoaded: true,
  currentUrl: 'chrome-extension://abc123/home.html',
  extensionId: 'abc123',
  isUnlocked: true,
  currentScreen: 'home'  // See ScreenName type below
}
```

**ScreenName values:**

- `'unlock'` - Password entry screen
- `'home'` - Main wallet dashboard
- `'onboarding-welcome'` - Get started screen
- `'onboarding-import'` - Import wallet option
- `'onboarding-create'` - Create wallet option
- `'onboarding-srp'` - Seed phrase entry
- `'onboarding-password'` - Password creation
- `'onboarding-complete'` - Onboarding finished
- `'onboarding-metametrics'` - MetaMetrics opt-in screen
- `'settings'` - Settings page
- `'unknown'` - Unrecognized screen

---

## Network Configuration

### Localhost (Default)

Uses Anvil with a fresh blockchain state:

```typescript
const launcher = await launchMetaMask();
// Anvil runs on port 8545 with chainId 1337
```

### Mainnet Fork

Fork mainnet for testing with real contract state:

```typescript
const launcher = await launchMetaMask({
  network: {
    mode: 'fork',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    forkBlockNumber: 18500000, // Optional: pin to specific block
  },
});
```

### Custom Port (Parallel Runs)

Run multiple instances without port conflicts:

```typescript
const launcher = await launchMetaMask({
  ports: { anvil: 8546 },
});
```

---

## Debugging & Analysis

### Console Logs

The launcher outputs helpful logs:

```
Starting Anvil...
Anvil started on port 8545 with chainId 1337
Starting FixtureServer...
FixtureServer running on port 12345 (mode: default)
Extension UI is ready
```

### Raw Playwright Access

For advanced debugging or custom interactions:

```typescript
const page = launcher.getPage();
const context = launcher.getContext();

// Listen to console logs
page.on('console', (msg) => console.log('Browser:', msg.text()));

// Listen to network requests
page.on('request', (req) => console.log('Request:', req.url()));
page.on('response', (res) => console.log('Response:', res.status(), res.url()));

// Execute JavaScript in page context
const result = await page.evaluate(() => {
  return window.localStorage.getItem('some-key');
});

// Take DOM snapshot
const html = await page.content();
```

### Network Request Analysis

```typescript
const page = launcher.getPage();

// Capture all requests during an action
const requests: string[] = [];
page.on('request', (req) => requests.push(req.url()));

await homePage.clickSend();

console.log('Requests made:', requests);
```

### Debugging When Stuck

When automation gets stuck or fails unexpectedly, use `debugDump()` to capture full diagnostic state:

```typescript
try {
  await launcher.ensureUnlockedAndReady(DEFAULT_PASSWORD);
  // ... your automation code
} catch (error) {
  // Capture everything needed for debugging
  const dump = await launcher.debugDump('failure');
  console.error('Screenshot:', dump.screenshot.path);
  console.error('State:', JSON.stringify(dump.state, null, 2));
  console.error('Console errors:', dump.consoleErrors);
  throw error;
}
```

`debugDump()` returns:

- `screenshot` - Full page screenshot with path and base64
- `state` - Complete ExtensionState (screen, URL, balance, network, address)
- `consoleErrors` - Array of browser console error messages

Files are saved to `test-artifacts/screenshots/`:

- `{name}.png` - Screenshot
- `{name}-state.json` - State JSON

---

## Infrastructure

| Service       | Port  | Purpose                               |
| ------------- | ----- | ------------------------------------- |
| Anvil         | 8545  | Local Ethereum node (configurable)    |
| FixtureServer | 12345 | Wallet state injection                |
| MockServer    | 8000  | HTTP mocking (EXPERIMENTAL, optional) |

---

## Default Credentials

| Property | Value                          |
| -------- | ------------------------------ |
| Password | `correct horse battery staple` |
| Chain ID | `1337`                         |
| Balance  | 25 ETH                         |
| Account  | Pre-generated test account     |

---

## Commands

```bash
# Build extension (required before first run, and after any code changes)
yarn build:test

# Launch extension with example usage
yarn llm:launch

# Run validation test
npx tsx test/e2e/playwright/llm-workflow/test-run.ts

# Run onboarding test
npx tsx test/e2e/playwright/llm-workflow/test-onboarding.ts
```

---

## Troubleshooting

### Port Already in Use

Kill orphan processes from previous runs:

```bash
lsof -ti:8545,12345,8000 | xargs kill -9
```

### Extension Not Loading

Build the extension:

```bash
yarn build:test
```

### Wallet Not Unlocking

Default password is: `correct horse battery staple`

### Configuration Errors

| Error                                       | Solution                                              |
| ------------------------------------------- | ----------------------------------------------------- |
| `stateMode 'custom' requires fixture`       | Provide a `fixture` when using `stateMode: 'custom'`  |
| `network.mode 'fork' requires rpcUrl`       | Provide valid `rpcUrl` for fork/custom modes          |
| `Extension UI did not reach expected state` | Fixture may be invalid, try `stateMode: 'onboarding'` |

---

## Best Practices

### 1. Always Use try/finally for Cleanup

```typescript
const launcher = await launchMetaMask();
try {
  await launcher.unlock(DEFAULT_PASSWORD);
  // Your test code
} finally {
  await launcher.cleanup(); // Ensures ports are freed
}
```

### 2. Check State Before Acting

```typescript
const state = await launcher.getState();
if (state.currentScreen === 'unlock') {
  await launcher.unlock(DEFAULT_PASSWORD);
} else if (state.currentScreen === 'home') {
  // Already unlocked
}
```

### 3. Use Screenshots for Debugging

```typescript
// Before action
await launcher.screenshot({ name: 'before-send' });

await homePage.clickSend();

// After action
await launcher.screenshot({ name: 'after-send' });
```

### 4. Prefer State-Based Waits

```typescript
// GOOD: Wait for specific element
await launcher.waitFor('[data-testid="transaction-complete"]', 10000);

// BAD: Arbitrary timeout
await new Promise((r) => setTimeout(r, 5000));
```

### 5. Use Page Objects for Readability

```typescript
// GOOD: Clear intent
const home = new HomePage(launcher.getPage());
await home.clickSend();

// LESS CLEAR: Raw selectors
await launcher.click('[data-testid="coin-overview-send"]');
```

---

## Mock Server (EXPERIMENTAL - LIMITED USE)

> **⚠️ CRITICAL LIMITATION**: MockServer does NOT intercept extension HTTP traffic automatically. The browser is not configured to proxy through it. Extension API calls (token prices, gas estimates, etc.) will go directly to real endpoints.

**When MockServer IS useful:**

- Testing your own dapp pages opened via `launcher.openNewDappPage(url)`
- Manual proxy configuration scenarios
- Standalone HTTP testing unrelated to extension traffic

**When MockServer is NOT useful:**

- Intercepting MetaMask's internal API calls
- Mocking token price APIs, gas APIs, or network requests from the extension

```typescript
const launcher = await launchMetaMask({
  mockServer: {
    enabled: true,
    testSpecificMock: async (server) => {
      await server.forGet(/token\.api/).thenJson(200, { tokens: [] });
    },
  },
});
```

---

## Example: Complete Validation Script

```typescript
import {
  launchMetaMask,
  DEFAULT_PASSWORD,
  HomePage,
} from './test/e2e/playwright/llm-workflow';

async function validateMyChange() {
  const launcher = await launchMetaMask();

  try {
    // 1. Unlock wallet
    await launcher.unlock(DEFAULT_PASSWORD);

    // 2. Verify we're on home screen
    const state = await launcher.getState();
    if (state.currentScreen !== 'home') {
      throw new Error(`Expected home screen, got: ${state.currentScreen}`);
    }

    // 3. Check expected UI elements
    const home = new HomePage(launcher.getPage());
    const balance = await home.getBalance();
    console.log('Current balance:', balance);

    // 4. Take screenshot for visual verification
    const screenshot = await launcher.screenshot({ name: 'validation-result' });
    console.log('Screenshot saved:', screenshot.path);

    // 5. Perform your specific validation
    // Example: Verify a new button exists
    await launcher.waitFor('[data-testid="my-new-feature-button"]', 5000);
    console.log('New feature button found!');

    console.log('VALIDATION PASSED');
  } catch (error) {
    console.error('VALIDATION FAILED:', error);
    await launcher.screenshot({ name: 'failure-state' });
    throw error;
  } finally {
    await launcher.cleanup();
  }
}

validateMyChange();
```

Run with: `npx tsx path/to/validation-script.ts`
