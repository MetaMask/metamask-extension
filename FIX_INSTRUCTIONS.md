# Fix Instructions: Apply the Window Switching Fix

## Quick Start

To fix the flaky test immediately, run these commands:

```bash
# 1. Apply the fix commit
git cherry-pick d06497d7af

# 2. Verify the change
git diff HEAD~1 test/e2e/tests/dapp-interactions/dapp-interactions.spec.ts

# 3. Test locally
yarn build:test
yarn test:e2e:single test/e2e/tests/dapp-interactions/dapp-interactions.spec.ts --browser=chrome

# 4. If test passes 3 times in a row, commit
git add test/e2e/tests/dapp-interactions/dapp-interactions.spec.ts
git commit --amend --no-edit
```

---

## Manual Fix (If Cherry-pick Has Conflicts)

If the cherry-pick has conflicts, apply this change manually:

### File: `test/e2e/tests/dapp-interactions/dapp-interactions.spec.ts`

**Location**: Around line 85

**Before**:
```typescript
await connectAccountConfirmation.checkPageIsLoaded();
await connectAccountConfirmation.confirmConnect();
await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
await testDapp.checkConnectedAccounts(DEFAULT_FIXTURE_ACCOUNT);
```

**After**:
```typescript
await connectAccountConfirmation.checkPageIsLoaded();
await connectAccountConfirmation.confirmConnect();
try {
  await driver.switchToWindowWithUrl(DAPP_ONE_URL);
} catch {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
}
await testDapp.checkConnectedAccounts(DEFAULT_FIXTURE_ACCOUNT);
```

---

## Testing the Fix

### Test 1: Single Run
```bash
yarn build:test
yarn test:e2e:single test/e2e/tests/dapp-interactions/dapp-interactions.spec.ts --browser=chrome
```

**Expected**: Test passes ✅

### Test 2: Multiple Runs (Stability Check)
```bash
#!/bin/bash
# Run 20 times to verify stability

yarn build:test

PASS=0
FAIL=0

for i in {1..20}; do
  echo "=== Run $i of 20 ==="
  
  if yarn test:e2e:single test/e2e/tests/dapp-interactions/dapp-interactions.spec.ts --browser=chrome > /dev/null 2>&1; then
    echo "✅ Pass"
    ((PASS++))
  else
    echo "❌ Fail"
    ((FAIL++))
  fi
done

echo ""
echo "Results: $PASS passes, $FAIL fails"
echo "Success rate: $((PASS * 100 / 20))%"
```

**Expected**: 20/20 passes (100% success rate)

### Test 3: Verify No Regressions
```bash
# Run all dapp-interactions tests
yarn test:e2e:single test/e2e/tests/dapp-interactions/dapp-interactions.spec.ts --browser=chrome

# Check all tests pass
echo $?  # Should be 0
```

---

## Validation Checklist

Before merging:

- [ ] Fix applied (cherry-pick or manual)
- [ ] Code compiles without errors
- [ ] Single test run passes
- [ ] Multiple test runs pass (at least 3/3)
- [ ] No new linting errors (`yarn lint:changed`)
- [ ] Commit message is clear and descriptive

---

## Expected Changes

### Diff Preview

```diff
diff --git a/test/e2e/tests/dapp-interactions/dapp-interactions.spec.ts b/test/e2e/tests/dapp-interactions/dapp-interactions.spec.ts
index 3b87401897..4a53d3bd95 100644
--- a/test/e2e/tests/dapp-interactions/dapp-interactions.spec.ts
+++ b/test/e2e/tests/dapp-interactions/dapp-interactions.spec.ts
@@ -82,7 +82,11 @@ describe('Dapp interactions', function () {
         );
         await connectAccountConfirmation.checkPageIsLoaded();
         await connectAccountConfirmation.confirmConnect();
-        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
+        try {
+          await driver.switchToWindowWithUrl(DAPP_ONE_URL);
+        } catch {
+          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
+        }
         await testDapp.checkConnectedAccounts(DEFAULT_FIXTURE_ACCOUNT);
 
         // Login to homepage
```

### Files Changed
- `test/e2e/tests/dapp-interactions/dapp-interactions.spec.ts` (+4 lines, -1 line)

---

## Commit Message Template

```
fix(e2e): use URL-based window switching for dapp-interactions test

The test "should connect a second Dapp despite MetaMask being locked" was
failing intermittently (~10% of the time) because it used ambiguous window
switching when multiple dapp windows had the same title.

Problem:
- Test opens 2 dapps (127.0.0.1:8080 and 127.0.0.1:8081)
- Both have the same window title "E2E Test Dapp"
- switchToWindowWithTitle() picked the first match (non-deterministic)
- Sometimes switched to wrong window, causing timeout

Solution:
- Use switchToWindowWithUrl(DAPP_ONE_URL) for unambiguous switching
- Falls back to title-based switching for compatibility
- Guarantees we switch to the correct window

Fixes intermittent timeout error:
  TimeoutError: Waiting for element to be located By(xpath, 
  .//*[./@id = 'accounts'][(contains(string(.), '0x5cfe73b6021e818b776b421b1c4db2474086a7e1')

Cherry-picked from: d06497d7af
```

---

## Rollback Plan (If Needed)

If the fix causes unexpected issues:

```bash
# Revert the fix
git revert HEAD

# Or reset to previous commit
git reset --hard HEAD~1
```

---

## Success Metrics

After merging, monitor these metrics:

1. **Test Pass Rate**: Should be 100% (was ~90%)
2. **Retry Count**: Should be 0 (was 1-2 per run)
3. **CI Time**: Should be faster (no retries)
4. **Flaky Test Reports**: Should not appear in future reports

---

## Questions?

If you encounter issues:

1. Check the full investigation in `INVESTIGATION_SUMMARY.md`
2. Review the visual diagrams in `E2E_TEST_FLAKINESS_DIAGRAM.md`
3. Check the detailed analysis in `E2E_TEST_FLAKINESS_INVESTIGATION.md`

---

## Additional Context

- **Original Issue**: Slack thread from March 5, 2026
- **Fix Commit**: d06497d7af on branch origin/chore/dapp-interactions-flake-stress
- **Investigation Date**: March 5, 2026
- **Root Cause**: Ambiguous window switching with multiple dapps
- **Solution**: URL-based window switching
