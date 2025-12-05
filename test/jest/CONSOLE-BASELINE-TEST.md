# Console Baseline Reporter - Manual Testing Steps

## Prerequisites

- Node.js v24+
- Run `yarn install`

---

## Test 1: Unit Test Warning Detection

### 1. Add a test warning to a unit test

Add this code to `app/scripts/controllers/permissions/background-api.test.js` at the top of the first `describe` block:

```javascript
describe('permission background API methods', () => {
  beforeEach(() => {
    // Test warning to verify baseline system
    console.warn(
      'REVIEWER_TEST: This warning should be detected by the baseline system',
    );
  });

  // ... rest of the tests
});
```

### 2. Run the unit test - should FAIL with the new warning

```bash
yarn test:unit app/scripts/controllers/permissions/background-api.test.js
```

**Expected output:**

```
PASS app/scripts/controllers/permissions/background-api.test.js

Test Suites: 1 passed, 1 total
Tests:       45 passed, 45 total
...

❌ BASELINE VIOLATIONS DETECTED

  📁 app/scripts/controllers/permissions/background-api.test.js
     🆕 NEW: warn: REVIEWER_TEST: This warning should
        Current: 45 occurrences

  💡 Next steps:
     1. Fix the warnings in your code, OR
     2. Update baseline: yarn test:unit:update-baseline (requires justification)
```

**Note:** Jest shows "Test Suites: 1 passed" but the command **fails** (exit code 1) due to the baseline violation.

### 3. Add the warning to the baseline

```bash
yarn test:unit:update-baseline app/scripts/controllers/permissions/background-api.test.js
```

**Expected output:**

```
PASS app/scripts/controllers/permissions/background-api.test.js

✅ Baseline updated: 1 file(s) updated, 495 total in baseline
   Written to: /path/to/test/jest/console-baseline-unit.json
```

### 4. Re-run the test - should PASS

```bash
yarn test:unit app/scripts/controllers/permissions/background-api.test.js
```

**Expected output:**

```
PASS app/scripts/controllers/permissions/background-api.test.js

✅ Console baseline matches exactly!
```

✅ **System verified!** The warning is now in the baseline and the test passes.

### 5. Clean up

Remove the test warning from `app/scripts/controllers/permissions/background-api.test.js`:

```javascript
describe('permission background API methods', () => {
  // DELETE the beforeEach block with the REVIEWER_TEST warning
  // ... rest of the tests
});
```

Then update the baseline to remove it:

```bash
yarn test:unit:update-baseline app/scripts/controllers/permissions/background-api.test.js
```

Verify tests still pass:

```bash
yarn test:unit app/scripts/controllers/permissions/background-api.test.js
```

---

## Test 2: Integration Test Warning Detection

### 1. Add a test warning to an integration test

Add this code to `test/integration/confirmations/signatures/permit.test.tsx` at the top of the first `describe` block:

```typescript
describe('Permit Confirmation', () => {
  beforeEach(() => {
    // Test warning to verify baseline system
    console.warn(
      'REVIEWER_TEST: This warning should be detected by the baseline system',
    );
  });

  // ... rest of the tests
});
```

### 2. Run the integration test - should FAIL with the new warning

```bash
yarn test:integration test/integration/confirmations/signatures/permit.test.tsx
```

**Expected output:**

```
PASS test/integration/confirmations/signatures/permit.test.tsx
...

❌ BASELINE VIOLATIONS DETECTED

  📁 test/integration/confirmations/signatures/permit.test.tsx
     🆕 NEW: warn: REVIEWER_TEST: This warning should
        Current: X occurrences

  💡 Next steps:
     1. Fix the warnings in your code, OR
     2. Update baseline: yarn test:integration:update-baseline (requires justification)
```

### 3. Add the warning to the baseline

```bash
yarn test:integration:update-baseline test/integration/confirmations/signatures/permit.test.tsx
```

### 4. Re-run the test - should PASS

```bash
yarn test:integration test/integration/confirmations/signatures/permit.test.tsx
```

**Expected output:**

```
✅ Console baseline matches exactly!
```

✅ **System verified!**

### 5. Clean up

Remove the test warning from `test/integration/confirmations/signatures/permit.test.tsx` and update baseline:

```bash
yarn test:integration:update-baseline test/integration/confirmations/signatures/permit.test.tsx
```

---

## Summary

All test types follow the same pattern:

| Step | Action          | Result                |
| ---- | --------------- | --------------------- |
| 1    | Add warning     | ❌ Test fails         |
| 2    | Update baseline | Warning added to JSON |
| 3    | Re-run test     | ✅ Test passes        |
| 4    | Clean up        | Remove test code      |

This demonstrates the baseline system correctly detects, stores, and validates console warnings!
