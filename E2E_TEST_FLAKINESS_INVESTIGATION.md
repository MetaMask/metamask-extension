# E2E Test Flakiness Investigation: "Dapp interactions should connect a second Dapp despite MetaMask being locked"

**Test File**: `test/e2e/tests/dapp-interactions/dapp-interactions.spec.ts`  
**Investigation Date**: March 5, 2026  
**Status**: Root cause identified, fix exists but not yet merged

---

## Executive Summary

The test fails intermittently because it uses an ambiguous window-switching method (`switchToWindowWithTitle`) when multiple dapp windows have identical titles. This causes the test to sometimes switch to the wrong dapp window, resulting in a timeout waiting for elements that will never appear.

**Failure Rate**: 1 failure with 10 retries in the last 24 hours

---

## Root Cause Analysis

### The Problem

The test creates **2 test dapp instances** (line 60):
```typescript
dappOptions: { numberOfTestDapps: 2 }
```

These two dapps run on different origins:
- **DAPP 1** (default): `http://127.0.0.1:8080` (DAPP_HOST_ADDRESS)
- **DAPP 2** (DAPP_ONE): `http://127.0.0.1:8081` (DAPP_ONE_ADDRESS)

Both dapps have the **same window title**: `"E2E Test Dapp"` (stored in `WINDOW_TITLES.TestDApp`)

### The Failure Scenario

**Test Flow**:
1. ✅ Start with MetaMask locked
2. ✅ Fixture pre-connects DAPP 1 (127.0.0.1:8080) via `withPermissionControllerConnectedToTestDapp()`
3. ✅ Open DAPP_ONE (127.0.0.1:8081) in a new window
4. ✅ Click connect button on DAPP_ONE
5. ✅ Switch to Dialog window and login
6. ✅ Confirm connection
7. ⚠️ **PROBLEMATIC LINE 85**: `await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp)`
8. ❌ **FAILS HERE** (line 86): `await testDapp.checkConnectedAccounts(DEFAULT_FIXTURE_ACCOUNT)`

**Why it fails**:

At step 7, the test tries to switch back to the DAPP_ONE window to verify the connection. However, it uses `switchToWindowWithTitle()` which searches for any window with title `"E2E Test Dapp"`. Since there are TWO windows with this title, the driver picks one non-deterministically (or picks the first one it finds).

**Two outcomes**:
- ✅ **Test passes (lucky case)**: Driver switches to DAPP_ONE (127.0.0.1:8081), finds the connected account
- ❌ **Test fails (unlucky case)**: Driver switches to DAPP 1 (127.0.0.1:8080), which is NOT connected to this session, so the `#accounts` element never shows the expected address, causing a timeout

### The Error Message

```
TimeoutError: Waiting for element to be located By(xpath, .//*[./@id = 'accounts']
[(contains(string(.), '0x5cfe73b6021e818b776b421b1c4db2474086a7e1') ...
```

This error occurs because the test is checking the wrong dapp window for the connected account.

---

## Technical Details

### Code Analysis

**Line 85 (Problematic)**:
```typescript:85:85:test/e2e/tests/dapp-interactions/dapp-interactions.spec.ts
await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
```

**switchToWindowWithTitle Implementation** (`test/e2e/webdriver/driver.js:1337-1367`):
```javascript
async switchToWindowWithTitle(title) {
  // ...
  for (const handle of windowHandles) {
    const handleTitle = await retry(
      { retries: 25, delay: 200 },
      async () => {
        await this.driver.switchTo().window(handle);
        return await this.driver.getTitle();
      }
    );
    
    if (handleTitle === title) {
      return; // Returns on FIRST match
    }
  }
  // ...
}
```

The method returns on the **first** matching window, which is non-deterministic when multiple windows have the same title.

### checkConnectedAccounts Implementation

**test-dapp.ts:342-359**:
```typescript
async checkConnectedAccounts(connectedAccounts: string, shouldBeConnected: boolean = true) {
  if (shouldBeConnected) {
    console.log('Verify connected accounts:', connectedAccounts);
    await this.driver.waitForSelector({
      css: this.connectedAccount,  // '#accounts'
      text: connectedAccounts.toLowerCase(),
    });
  }
}
```

This waits for element `#accounts` to contain the lowercase account address. Default timeout is 10 seconds, which explains the timeout error.

---

## Fix History

Multiple attempts have been made to fix this issue:

### Commit Timeline

1. **d8a504c709** (Feb 28, 2026) - "Harden dapp interactions account connection assertion"
   - Added fallback: if `checkConnectedAccounts` fails, try `checkGetAccountsResult`
   - Status: Partially effective

2. **a49dff119c** (Feb 28, 2026) - "Retry second dapp connect when account request fails"
   - Added full retry logic: if connect fails, retry the entire connect flow
   - Status: Reduces failures but doesn't address root cause

3. **d06497d7af** (Mar 1, 2026) - "test(e2e): switch to second dapp tab by URL after connect"
   - Changed from `switchToWindowWithTitle` to `switchToWindowWithUrl`
   - Status: **Proper fix** (exists on branch `origin/chore/dapp-interactions-flake-stress`)

### Commit d06497d7af (The Fix)

```diff
- await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
+ try {
+   await driver.switchToWindowWithUrl(DAPP_ONE_URL);
+ } catch {
+   await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
+ }
```

**Why this works**:
- Uses URL-based switching (`switchToWindowWithUrl`) which is unambiguous
- Falls back to title-based switching for compatibility
- Ensures we always switch to the correct window (127.0.0.1:8081)

---

## Proposed Solution

### Option 1: Merge Existing Fix (Recommended)

The fix already exists in commit `d06497d7af` on branch `origin/chore/dapp-interactions-flake-stress`.

**Action**: Cherry-pick or merge the fix commit into main

**Implementation**:
```bash
git cherry-pick d06497d7af
```

**Pros**:
- Fix already exists and has been tested
- Minimal risk
- Addresses the exact root cause

**Cons**:
- None significant

### Option 2: Improved Fix with Additional Safeguards

Enhance the existing fix with explicit wait for dapp to update after connection:

```typescript
await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
await loginPage.checkPageIsLoaded();
await loginPage.loginToHomepage();
const connectAccountConfirmation = new ConnectAccountConfirmation(driver);
await connectAccountConfirmation.checkPageIsLoaded();
await connectAccountConfirmation.confirmConnect();

// Wait for dialog to close
await driver.waitUntilXWindowHandles(3); // Extension + DAPP 1 + DAPP_ONE

// Switch to the correct dapp by URL (unambiguous)
await driver.switchToWindowWithUrl(DAPP_ONE_URL);

// Wait for dapp to be fully loaded and updated
await testDapp.checkPageIsLoaded();

// Add small delay for dapp to process connection state update
await driver.delay(500);

// Verify connection
await testDapp.checkConnectedAccounts(DEFAULT_FIXTURE_ACCOUNT);
```

**Pros**:
- More robust with explicit waits
- Clearer intent in code
- Handles edge cases better

**Cons**:
- More invasive change
- Adds test execution time (~500ms)

### Option 3: Alternative Approach - Use Distinct Window Titles

Modify test dapp initialization to use unique titles per instance:

**Cons**: Would require changes to test dapp infrastructure (out of scope)

---

## Additional Observations

### Other Related Flaky Tests

Looking at the git history, this pattern may affect other tests:

```bash
git log --oneline --all --grep="dapp.*flak"
git log --oneline --all --grep="switch.*window"
```

**Recommendation**: Audit other tests that use `switchToWindowWithTitle` with multiple dapps.

### Best Practices for E2E Tests

**When working with multiple dapp windows**:

✅ **DO**:
- Use `switchToWindowWithUrl()` for unambiguous switching
- Use unique window titles when possible
- Add explicit waits after window switches
- Log which window you're switching to

❌ **DON'T**:
- Use `switchToWindowWithTitle()` when multiple windows have the same title
- Assume window order is deterministic
- Switch windows without verifying the switch succeeded

---

## Testing the Fix

### Verification Steps

1. **Apply the fix** (cherry-pick d06497d7af)

2. **Run the test locally multiple times**:
```bash
yarn build:test
for i in {1..20}; do 
  echo "Run $i"
  yarn test:e2e:single test/e2e/tests/dapp-interactions/dapp-interactions.spec.ts --browser=chrome
done
```

3. **Check CI runs**: Monitor for at least 20 CI runs after merge

4. **Expected result**: Test should pass consistently (0 failures in 20+ runs)

### Success Criteria

- ✅ Test passes 100% of the time in local runs (20/20)
- ✅ Test passes 100% of the time in CI (20/20 runs)
- ✅ No increase in execution time (< 500ms difference)
- ✅ No new related flaky tests introduced

---

## Conclusion

**Root Cause**: Ambiguous window switching using `switchToWindowWithTitle` when multiple windows share the same title

**Impact**: ~5-10% failure rate (1 failure in 10 retries)

**Fix Available**: Yes, commit `d06497d7af` on `origin/chore/dapp-interactions-flake-stress`

**Recommendation**: Cherry-pick commit `d06497d7af` to resolve the flakiness

**Priority**: Medium (test has retry logic that usually passes, but wastes CI resources)

**Estimated Fix Time**: 15 minutes (cherry-pick + verify)

---

## References

- Test file: `test/e2e/tests/dapp-interactions/dapp-interactions.spec.ts`
- Fix commit: `d06497d7af` on branch `origin/chore/dapp-interactions-flake-stress`
- Driver implementation: `test/e2e/webdriver/driver.js`
- TestDapp page object: `test/e2e/page-objects/pages/test-dapp.ts`
- Constants: `test/e2e/constants.ts`

## Related Commits

```
d06497d7af - test(e2e): switch to second dapp tab by URL after connect
a49dff119c - Retry second dapp connect when account request fails
d8a504c709 - Harden dapp interactions account connection assertion
48008fc136 - Increase wait for connected sites in dapp interactions
4a099fb8f0 - Remove flaky dapp-side account assertion
```
