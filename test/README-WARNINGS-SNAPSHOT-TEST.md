# Console Warnings/Errors Snapshot System - Manual Testing Steps

## Manual Testing Steps

To verify the warnings snapshot system works correctly, follow these steps:

### Testing Unit Test Warnings Detection

**1. Add a test warning to a unit test**

Add this code to `app/scripts/controllers/permissions/background-api.test.js` at the top of the first `describe` block:

```javascript
describe('permission background API methods', () => {
  beforeEach(() => {
    // Test warning to verify snapshot system
    console.warn(
      'REVIEWER_TEST: This warning should be detected by the snapshot system',
    );
  });

  // ... rest of the tests
});
```

**2. Run the unit test - should FAIL with the new warning**

```bash
yarn test:unit app/scripts/controllers/permissions/background-api.test.js
```

**Expected output:**

```
Test Suites: 1 passed, 1 total
Tests:       45 passed, 45 total
...

❌ New console warnings detected:
================================================================================

1. Copy-paste the following warning into "warnings" array:
   "REVIEWER_TEST: This warning should be detected by the snapshot system"

📝 Or run this command to update the snapshot automatically:
   yarn test:warnings:update:unit app/scripts/controllers/permissions/background-api.test.js

Error in global teardown: Error: New console warnings or errors detected
```

**Note:** Jest shows "Test Suites: 1 passed" but the command **fails** (exit code 1) due to the global teardown error. Scroll to the bottom to see the warning detection.

**3. Add the warning to the snapshot**

```bash
yarn test:warnings:update:unit app/scripts/controllers/permissions/background-api.test.js
```

**Expected output:**

```
✅ All tests passed! Aggregating and saving snapshot...
📊 Found 1 new warning(s) and 0 new error(s).
   Total: 27 warnings, 34 errors
✅ Unit tests snapshot generation complete!
```

**4. Re-run the test - should PASS**

```bash
yarn test:unit app/scripts/controllers/permissions/background-api.test.js
```

**Expected output:**

```
PASS app/scripts/controllers/permissions/background-api.test.js
```

✅ **System verified!** The warning is now in the snapshot and the test passes.

**5. Clean up**

Remove the test warning from `app/scripts/controllers/permissions/background-api.test.js` and from `test/test-warnings-snapshot-unit.json`:

```bash
# Edit both files to remove the REVIEWER_TEST warning
# Then verify tests still pass:
yarn test:unit app/scripts/controllers/permissions/background-api.test.js
```

---

### Testing Integration Test Warnings Detection

**1. Add a test warning to an integration test**

Add this code to `test/integration/confirmations/signatures/permit.test.tsx` at the top of the first `describe` block:

```javascript
describe('Permit Confirmation', () => {
  beforeEach(() => {
    // Test warning to verify snapshot system
    console.warn(
      'REVIEWER_TEST: This warning should be detected by the snapshot system',
    );
  });

  // ... rest of the tests
});
```

**2. Run the integration test - should FAIL with the new warning**

```bash
yarn test:integration test/integration/confirmations/signatures/permit.test.tsx
```

**Expected output:**

```
Test Suites: 1 passed, 1 total
...

❌ New console warnings detected:
================================================================================

1. Copy-paste the following warning into "warnings" array:
   "REVIEWER_TEST: This warning should be detected by the snapshot system"

📝 Or run this command to update the snapshot automatically:
   yarn test:warnings:update:integration test/integration/confirmations/signatures/permit.test.tsx

Error in global teardown: Error: New console warnings or errors detected
```

**Note:** Jest shows "Test Suites: 1 passed" but the command **fails** (exit code 1) due to the global teardown error. Scroll to the bottom to see the warning detection.

**3. Add the warning to the snapshot**

```bash
yarn test:warnings:update:integration test/integration/confirmations/signatures/permit.test.tsx
```

**Expected output:**

```
✅ All tests passed! Aggregating and saving snapshot...
📊 Found 1 new warning(s) and 0 new error(s).
   Total: 5 warnings, 3 errors
✅ Integration tests snapshot generation complete!
```

**4. Re-run the test - should PASS**

```bash
yarn test:integration test/integration/confirmations/signatures/permit.test.tsx
```

**Expected output:**

```
PASS test/integration/confirmations/signatures/permit.test.tsx
```

✅ **System verified!** The warning is now in the snapshot and the test passes.

**5. Clean up**

Remove the test warning from `test/integration/confirmations/signatures/permit.test.tsx` and from `test/test-warnings-snapshot-integration.json`:

```bash
# Edit both files to remove the REVIEWER_TEST warning
# Then verify tests still pass:
yarn test:integration test/integration/confirmations/signatures/permit.test.tsx
```

---

### Testing E2E Warnings Detection

**1. Add a test warning to the codebase**

Add this code to `ui/pages/home/home.component.js` at the top of the `componentDidMount()` method:

```javascript
componentDidMount() {
  // Test warning to verify snapshot system
  console.warn(
    'REVIEWER_TEST: This warning should be detected by the snapshot system',
  );

  this.checkStatusAndNavigate();
  // ... rest of the method
}
```

**2. Rebuild the test extension**

```bash
yarn build:test
```

**3. Run an e2e test - should FAIL with the new warning**

```bash
SELENIUM_BROWSER=chrome yarn test:e2e:single test/e2e/tests/account/unlock-wallet.spec.ts
```

**Expected output:**

```
❌ New console warnings detected:

1. Copy-paste the following warning into "warnings" array:
   "REVIEWER_TEST: This warning should be detected by the snapshot system"

📝 Or run this command to update the snapshot automatically:
   yarn test:warnings:update:e2e ./test/e2e/tests/account/unlock-wallet.spec.ts
```

**4. Add the warning to the snapshot**

```bash
yarn test:warnings:update:e2e test/e2e/tests/account/unlock-wallet.spec.ts
```

**Expected output:**

```
✅ Test passed!
📊 Found 1 new warning(s) and 0 new error(s).
✅ Snapshot updated with new warnings from: test/e2e/tests/account/unlock-wallet.spec.ts
```

**5. Re-run the test - should PASS**

```bash
SELENIUM_BROWSER=chrome yarn test:e2e:single test/e2e/tests/account/unlock-wallet.spec.ts
```

**Expected output:**

```
Success on testcase: 'Unlock wallet -  should show connections removed modal when max key chain length is reached for social account'
```

✅ **System verified!** The warning is now in the snapshot and the test passes.

**6. Clean up**

Remove the test warning from `ui/pages/home/home.component.js` and from `test/test-warnings-snapshot-e2e.json`, then rebuild:

```bash
yarn build:test
```

---

### Summary

All three test types (unit, integration, e2e) follow the same pattern:

1. ❌ Add warning → Test fails
2. ✅ Update snapshot → Warning added
3. ✅ Re-run test → Test passes
4. 🧹 Clean up → Remove test code

This demonstrates the snapshot system correctly detects, stores, and validates console warnings across all test environments!
