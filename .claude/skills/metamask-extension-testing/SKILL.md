---
name: metamask-extension-testing
description: Launch and test MetaMask Chrome extension with Playwright. Use for visual validation of UI changes, testing onboarding/unlock flows, and capturing screenshots.
compatibility: opencode
metadata:
  location: test/e2e/playwright/llm-workflow
  type: browser-testing
---

## When to Use This Skill

Use this skill when you need to:

- Visually validate MetaMask UI changes
- Test extension behavior in a real browser
- Verify onboarding, unlock, or transaction flows
- Capture screenshots for validation
- Debug UI state issues

## Prerequisites

Run from repository root (macOS/Linux):

```bash
yarn install      # Install dependencies
yarn build:test   # Build the extension
```

If ports are in use from previous runs:

```bash
lsof -ti:8545,12345,8000 | xargs kill -9
```

## Quick Start

```typescript
import {
  launchMetaMask,
  DEFAULT_PASSWORD,
  HomePage,
} from './test/e2e/playwright/llm-workflow';

const launcher = await launchMetaMask();
try {
  await launcher.unlock(DEFAULT_PASSWORD);

  const homePage = new HomePage(launcher.getPage());
  console.log('Balance:', await homePage.getBalance());

  await launcher.screenshot({ name: 'validation' });
} finally {
  await launcher.cleanup();
}
```

## Validation Scripts

Run these first to verify the workflow is working:

```bash
npx tsx test/e2e/playwright/llm-workflow/test-run.ts        # Test pre-onboarded wallet
npx tsx test/e2e/playwright/llm-workflow/test-onboarding.ts # Test onboarding flow
```

## Core Procedure

### 1. Launch Extension

```typescript
import { launchMetaMask } from './test/e2e/playwright/llm-workflow';

// Pre-onboarded wallet with 25 ETH (default)
const launcher = await launchMetaMask();

// Fresh wallet requiring onboarding
const launcher = await launchMetaMask({ stateMode: 'onboarding' });

// Custom fixture with specific state
const launcher = await launchMetaMask({ stateMode: 'custom', fixture });
```

### 2. Unlock or Onboard

```typescript
import { DEFAULT_PASSWORD } from './test/e2e/playwright/llm-workflow';

// For pre-onboarded wallet
await launcher.unlock(DEFAULT_PASSWORD);

// For fresh wallet
await launcher.completeOnboarding({ password: DEFAULT_PASSWORD });

// Robust unlock that handles modals/popovers automatically
await launcher.ensureUnlockedAndReady(DEFAULT_PASSWORD);
```

### 3. Verify Screen State (LLM-Safe Helpers)

```typescript
// Wait for a specific screen (throws with diagnostics on timeout)
await launcher.waitForScreen('home', 10000);

// Assert current screen (throws with debugDump on mismatch)
await launcher.assertScreen('home');

// Close any interfering modals/popovers
await launcher.closeInterferingModals();

// Get current screen without throwing
const state = await launcher.getState();
console.log('Current screen:', state.currentScreen);
// Values: 'home' | 'unlock' | 'onboarding-*' | 'settings' | 'unknown'
```

### 4. Interact with UI

```typescript
import { HomePage } from './test/e2e/playwright/llm-workflow';

const homePage = new HomePage(launcher.getPage());
const balance = await homePage.getBalance();
const network = await homePage.getNetworkName();
const address = await homePage.getAccountAddress();

await homePage.clickSend();
await homePage.clickSwap();
await homePage.openSettings();
```

### 5. Capture Screenshots

```typescript
const screenshot = await launcher.screenshot({ name: 'after-change' });
console.log('Screenshot path:', screenshot.path);
console.log('Base64 (first 100 chars):', screenshot.base64.substring(0, 100));
```

### 6. Cleanup (Always Required)

```typescript
await launcher.cleanup();
```

## Error Recovery (Critical for Automation)

**Always wrap your code in try/catch and call `debugDump()` on failure:**

```typescript
const launcher = await launchMetaMask();
try {
  await launcher.ensureUnlockedAndReady(DEFAULT_PASSWORD);
  // ... your automation code
} catch (error) {
  const dump = await launcher.debugDump('failure');
  console.error('Screenshot:', dump.screenshot.path);
  console.error('State:', JSON.stringify(dump.state, null, 2));
  console.error('Console errors:', dump.consoleErrors);
  throw error;
} finally {
  await launcher.cleanup();
}
```

### Recovery Decision Tree

```
Error occurred
    │
    ├─► Call debugDump('failure')
    │
    ├─► Check state.currentScreen:
    │       'unlock'     → Call launcher.unlock(DEFAULT_PASSWORD)
    │       'home'       → Already ready, check for modals
    │       'onboarding-*' → Call launcher.completeOnboarding()
    │       'unknown'    → Check screenshot, may need manual intervention
    │
    ├─► If modals blocking:
    │       → Call launcher.closeInterferingModals()
    │
    └─► If still failing after 3 attempts:
            → Review screenshot and state JSON
            → May indicate UI change or test environment issue
```

## Fixture Configuration

### Using Presets

```typescript
import {
  launchMetaMask,
  FixturePresets,
} from './test/e2e/playwright/llm-workflow';

// Multiple accounts
const launcher = await launchMetaMask({
  stateMode: 'custom',
  fixture: FixturePresets.withMultipleAccounts(),
});
```

### Using FixtureBuilder

```typescript
import {
  launchMetaMask,
  createFixtureBuilder,
} from './test/e2e/playwright/llm-workflow';

const fixture = createFixtureBuilder()
  .withPreferencesController({ showTestNetworks: true })
  .withPopularNetworks()
  .build();

const launcher = await launchMetaMask({ stateMode: 'custom', fixture });
```

## Network Configuration

### Localhost (Default)

```typescript
const launcher = await launchMetaMask();
// Anvil runs on port 8545 with chainId 1337
```

### Mainnet Fork

```typescript
const launcher = await launchMetaMask({
  network: {
    mode: 'fork',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    forkBlockNumber: 18500000,
  },
});
```

### Custom Ports (Parallel Runs)

```typescript
const launcher = await launchMetaMask({
  ports: { anvil: 8546, fixtureServer: 12346 },
});
```

## Default Credentials

| Property | Value                          |
| -------- | ------------------------------ |
| Password | `correct horse battery staple` |
| Chain ID | `1337`                         |
| Balance  | 25 ETH                         |

## Known Limitations

1. **Headed mode only**: Chrome extensions cannot run headless. Requires display (use XVFB on Linux CI).
2. **MockServer limitation**: Does NOT intercept extension HTTP traffic. Only useful for dapp pages.
3. **Single window**: Multi-window flows (tx confirmations, dapp connections) require manual page switching.
4. **macOS/Linux**: Port cleanup commands (`lsof`) are Unix-specific.

## Common Failures & Solutions

| Symptom                     | Likely Cause                  | Solution                                    |
| --------------------------- | ----------------------------- | ------------------------------------------- |
| `Cannot find module`        | Dependencies not installed    | `yarn install`                              |
| Extension not loading       | Extension not built           | `yarn build:test`                           |
| `EADDRINUSE` port error     | Orphan processes              | `lsof -ti:8545,12345,8000 \| xargs kill -9` |
| Stuck on unlock screen      | Wrong password                | Use `correct horse battery staple`          |
| `unknown` screen state      | Modal/popover blocking        | Call `closeInterferingModals()`             |
| Timeout waiting for element | Slow environment or UI change | Increase timeout, check screenshot          |
| `Extension not initialized` | Launch failed                 | Check `yarn build:test` output              |

## Key Files

| File                                                     | Purpose                      |
| -------------------------------------------------------- | ---------------------------- |
| `test/e2e/playwright/llm-workflow/README.md`             | Full documentation           |
| `test/e2e/playwright/llm-workflow/extension-launcher.ts` | Main launcher class          |
| `test/e2e/playwright/llm-workflow/page-objects/`         | Page interaction classes     |
| `test/e2e/playwright/llm-workflow/fixture-helper.ts`     | Fixture builders and presets |

## Visual Testing Decision Rules

When performing visual validation:

1. **Before action**: Capture screenshot with descriptive name
2. **Perform action**: Use page objects (preferred) or launcher methods
3. **After action**: Capture screenshot, check state
4. **On success**: Compare screenshots if baseline exists
5. **On failure**: Call `debugDump()`, analyze state.currentScreen, retry or report

```typescript
await launcher.screenshot({ name: 'before-send' });
await homePage.clickSend();
await launcher.waitForScreen('home', 5000); // or expected screen
await launcher.screenshot({ name: 'after-send' });
```
