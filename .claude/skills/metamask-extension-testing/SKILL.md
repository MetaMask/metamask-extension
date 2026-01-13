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

```bash
yarn install      # Install dependencies
yarn build:test   # Build the extension
```

If ports are in use:

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

## Procedure

### 1. Launch Extension

```typescript
import { launchMetaMask } from './test/e2e/playwright/llm-workflow';

// Pre-onboarded wallet with 25 ETH
const launcher = await launchMetaMask();

// Or fresh wallet requiring onboarding
const launcher = await launchMetaMask({ stateMode: 'onboarding' });
```

### 2. Unlock or Onboard

```typescript
import { DEFAULT_PASSWORD } from './test/e2e/playwright/llm-workflow';

// Pre-onboarded wallet
await launcher.unlock(DEFAULT_PASSWORD);

// Fresh wallet
await launcher.completeOnboarding({ password: DEFAULT_PASSWORD });
```

### 3. Interact with UI

```typescript
import { HomePage } from './test/e2e/playwright/llm-workflow';

const homePage = new HomePage(launcher.getPage());
const balance = await homePage.getBalance();
const network = await homePage.getNetworkName();

await homePage.clickSend();
await homePage.clickSwap();
await homePage.openSettings();
```

### 4. Validate with Screenshots

```typescript
const screenshot = await launcher.screenshot({ name: 'after-change' });
console.log('Screenshot:', screenshot.path);

const state = await launcher.getState();
// state.currentScreen: 'home' | 'unlock' | 'onboarding-*' | 'settings' | 'unknown'
```

### 5. Cleanup

```typescript
await launcher.cleanup(); // Always call this
```

## Default Credentials

- Password: `correct horse battery staple`
- Chain ID: `1337`
- Balance: 25 ETH

## Debugging

```typescript
try {
  // your code
} catch (error) {
  const dump = await launcher.debugDump('failure');
  console.error('Screenshot:', dump.screenshot.path);
  console.error('State:', JSON.stringify(dump.state, null, 2));
  throw error;
}
```

## Validation Tests

```bash
npx tsx test/e2e/playwright/llm-workflow/test-run.ts
npx tsx test/e2e/playwright/llm-workflow/test-onboarding.ts
```

## Troubleshooting

- Module not found → `yarn install`
- Extension not loading → `yarn build:test`
- Port in use → `lsof -ti:8545,12345,8000 | xargs kill -9`
- Wrong password → Use `correct horse battery staple`

## Key Files

- `test/e2e/playwright/llm-workflow/README.md` - Full documentation
- `test/e2e/playwright/llm-workflow/extension-launcher.ts` - Main launcher
- `test/e2e/playwright/llm-workflow/page-objects/` - Page interactions
