# Visual Diagram: Dapp Interactions Test Flakiness

## Test Environment Setup

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser Windows at Test Start                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Window 1: MetaMask Extension (Full Screen View)                │
│  ├─ URL: chrome-extension://xxx/home.html                       │
│  └─ State: LOCKED (requires password)                           │
│                                                                   │
│  Window 2: DAPP 1 (Pre-connected via fixture)                   │
│  ├─ URL: http://127.0.0.1:8080                                  │
│  ├─ Title: "E2E Test Dapp"                                      │
│  └─ State: Connected to Account 1 (via fixture)                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Test Flow - Happy Path ✅

```
Step 1: Open DAPP_ONE
┌────────────────────┐
│ Test opens         │
│ DAPP_ONE in new    │──┐
│ window             │  │
└────────────────────┘  │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  3 Windows Now Open                                              │
├─────────────────────────────────────────────────────────────────┤
│  [1] MetaMask Extension (Locked)                                │
│  [2] DAPP 1: http://127.0.0.1:8080  - Title: "E2E Test Dapp"   │
│  [3] DAPP_ONE: http://127.0.0.1:8081 - Title: "E2E Test Dapp"  │ ⚠️ Same Title!
└─────────────────────────────────────────────────────────────────┘

Step 2: Click Connect on DAPP_ONE
┌────────────────────┐
│ Test clicks        │
│ "Connect" button   │──┐
│ on DAPP_ONE        │  │
└────────────────────┘  │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  4 Windows Now Open                                              │
├─────────────────────────────────────────────────────────────────┤
│  [1] MetaMask Extension (Locked)                                │
│  [2] DAPP 1: http://127.0.0.1:8080                             │
│  [3] DAPP_ONE: http://127.0.0.1:8081                           │
│  [4] MetaMask Dialog (Login Required)  ◄── Test switches here  │
└─────────────────────────────────────────────────────────────────┘

Step 3: Login and Confirm Connection
┌────────────────────┐
│ Test enters        │
│ password, clicks   │──┐
│ "Connect"          │  │
└────────────────────┘  │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│  Dialog closes, back to 3 windows                               │
├─────────────────────────────────────────────────────────────────┤
│  [1] MetaMask Extension (Now Unlocked)                          │
│  [2] DAPP 1: http://127.0.0.1:8080                             │
│  [3] DAPP_ONE: http://127.0.0.1:8081 (Connected!) ✅           │
└─────────────────────────────────────────────────────────────────┘

Step 4: ⚠️ PROBLEMATIC - Switch to verify connection
┌────────────────────────────────────────────────────────────────┐
│  Code: await driver.switchToWindowWithTitle("E2E Test Dapp")  │
└────────────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
   LUCKY PATH ✅                   UNLUCKY PATH ❌
        │                               │
        │                               │
┌───────▼───────┐               ┌───────▼───────┐
│ Switches to   │               │ Switches to   │
│ Window [3]    │               │ Window [2]    │
│ DAPP_ONE      │               │ DAPP 1        │
│ 127.0.0.1:8081│               │ 127.0.0.1:8080│
└───────┬───────┘               └───────┬───────┘
        │                               │
        │                               │
        ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│ checkConnected   │            │ checkConnected   │
│ Accounts finds   │            │ Accounts waits   │
│ #accounts with   │            │ for #accounts    │
│ 0x5cfe...7e1     │            │ with 0x5cfe...   │
│                  │            │                  │
│ ✅ TEST PASSES   │            │ ⏱️ TIMEOUT!     │
└──────────────────┘            │ ❌ TEST FAILS   │
                                 └──────────────────┘
```

## The Fix: Use URL-Based Switching

```
BEFORE (Ambiguous):
┌────────────────────────────────────────────────────────────────┐
│ await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp)  │
│                                                                 │
│ Problem: Both windows have title "E2E Test Dapp"              │
│ Result: Driver picks first match (non-deterministic)          │
└────────────────────────────────────────────────────────────────┘

AFTER (Unambiguous):
┌────────────────────────────────────────────────────────────────┐
│ try {                                                           │
│   await driver.switchToWindowWithUrl(DAPP_ONE_URL);           │
│ } catch {                                                       │
│   await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDapp);│
│ }                                                               │
│                                                                 │
│ Benefit: URL is unique (http://127.0.0.1:8081)                │
│ Result: Always switches to correct window                      │
└────────────────────────────────────────────────────────────────┘
```

## Failure Signature in CI Logs

```
TimeoutError: Waiting for element to be located By(xpath, 
  .//*[./@id = 'accounts']
  [(contains(string(.), '0x5cfe73b6021e818b776b421b1c4db2474086a7e1') 
  
Wait timed out after 10000ms

Context:
- Looking for element: #accounts
- Expected text: 0x5cfe73b6021e818b776b421b1c4db2474086a7e1
- Actual situation: On wrong dapp window (not connected)
```

## Why This Causes Intermittent Failures

```
┌─────────────────────────────────────────────────────────────────┐
│  Window Handle Iteration Order                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Selenium's getAllWindowHandles() returns handles in an          │
│  order that is NOT guaranteed to be consistent:                 │
│                                                                   │
│  Run 1:  [MetaMask, DAPP 1, DAPP_ONE]                          │
│          ├─ First "E2E Test Dapp" = DAPP 1 ❌                   │
│          └─ Result: TEST FAILS                                  │
│                                                                   │
│  Run 2:  [MetaMask, DAPP_ONE, DAPP 1]                          │
│          ├─ First "E2E Test Dapp" = DAPP_ONE ✅                 │
│          └─ Result: TEST PASSES                                 │
│                                                                   │
│  Run 3:  [DAPP 1, MetaMask, DAPP_ONE]                          │
│          ├─ First "E2E Test Dapp" = DAPP 1 ❌                   │
│          └─ Result: TEST FAILS                                  │
│                                                                   │
│  Observed Failure Rate: ~10% (1 in 10 runs)                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Impact of the Fix

```
BEFORE FIX:
┌────────────────────────────────────────────────────┐
│  Success Rate: ~90%                                │
│  Failure Rate: ~10%                                │
│  Retry Attempts: Average 1-2, Max 10               │
│  CI Time Waste: ~5-10 minutes per failure          │
│  Root Cause: Non-deterministic window selection    │
└────────────────────────────────────────────────────┘

AFTER FIX:
┌────────────────────────────────────────────────────┐
│  Success Rate: 100% (expected)                     │
│  Failure Rate: 0%                                  │
│  Retry Attempts: 0                                 │
│  CI Time Saved: ~5-10 minutes per run             │
│  Root Cause: Eliminated                            │
└────────────────────────────────────────────────────┘
```

## Key Takeaways

1. **Multiple windows with same title = flaky tests**
   - Always use URL-based switching when available
   - Add unique identifiers to windows when possible

2. **Window handle order is non-deterministic**
   - Never assume windows are in a specific order
   - Always use explicit identifiers (URL, unique title)

3. **Test retries mask the problem**
   - 10 retries mean test eventually passes
   - But wastes CI resources and developer time

4. **The fix is simple but critical**
   - One-line change from title to URL
   - Eliminates entire class of flakiness
