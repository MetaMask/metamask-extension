# Console Baseline Enforcement

Prevents new console warnings/errors from being introduced. Baseline is tracked **per test file**.

## Quick Reference

| Command                                                     | Description                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------- |
| `yarn test:unit`                                            | Run tests with baseline enforcement                           |
| `yarn test:unit:update-baseline`                            | Update baseline (ratchet mode - only increases)               |
| `yarn test:unit:update-baseline path/to/file`               | Update baseline (ratchet mode - only increases, single file)  |
| `yarn test:unit:update-baseline:strict`                     | Update baseline (strict mode - allows decreases)              |
| `yarn test:unit:update-baseline:strict path/to/file`        | Update baseline (strict mode - allows decreases, single file) |
| `yarn test:integration`                                     | Run integration tests with enforcement                        |
| `yarn test:integration:update-baseline`                     | Update integration baseline (ratchet mode - only increases)   |
| `yarn test:integration:update-baseline path/to/file`        | Update baseline (ratchet mode - only increases, single file)  |
| `yarn test:integration:update-baseline:strict`              | Update baseline (strict mode - allows decreases)              |
| `yarn test:integration:update-baseline:strict path/to/file` | Update baseline (strict mode - allows decreases, single file) |

## How It Works

1. **Run tests** → Reporter compares console output against baseline
2. **Violation detected** → Test fails, shows which file/category increased
3. **Improvement detected** → Shows reduced warnings (doesn't fail)
4. **Update baseline** → Run with `:update-baseline` to accept changes

### Baseline Update Modes

- **Ratchet mode** (default): `yarn test:*:update-baseline` only **increases** baseline counts. This prevents flaky test runs from accidentally lowering baselines that were intentionally set higher to account for variability.
- **Strict mode**: `yarn test:*:update-baseline:strict` syncs baseline to strictly match current test run (allows decreases). Use this when you've intentionally fixed warnings and want to lock in the improvement.

**Important**: Baseline decreases should be intentional. If you see improvements, either:

- Edit the baseline file manually, OR
- Use `:strict` mode (with caution) to sync the exact current state

## Example Output

```
❌ BASELINE VIOLATIONS DETECTED

  📁 ui/pages/send/send.test.tsx
     ⬆️  React: Act warnings
        Baseline: 5, Current: 12 (+7)

  💡 Next steps:
     1. Fix the warnings in your code, OR
     2. Update baseline: yarn test:unit:update-baseline (requires justification)
```

## Workflow

```bash
# 1. Run tests (fails if warnings increased)
yarn test:unit path/to/my-component.test.tsx

# 2a. If warnings increased: Fix warnings in code, OR update baseline (ratchet mode)
yarn test:unit:update-baseline path/to/my-component.test.tsx

# 2b. If you fixed warnings and want to decrease baseline: Use strict mode
yarn test:unit:update-baseline:strict path/to/my-component.test.tsx

# 3. Commit baseline changes
git add test/jest/console-baseline-*.json
git commit -m "fix: reduce warnings in my-component"
```

## Configuration

In `jest.config.js`:

```javascript
reporters: [
  [
    '<rootDir>/test/jest/console-baseline-reporter.js',
    {
      testType: 'unit', // 'unit' or 'integration'
      failOnViolation: true, // Fail on increased warnings
      showImprovements: true, // Show reduced warnings
    },
  ],
];
```

## Baseline Files

- `test/jest/console-baseline-unit.json` - Unit test baseline
- `test/jest/console-baseline-integration.json` - Integration test baseline

Structure:

```json
{
  "files": {
    "path/to/test.tsx": {
      "React: Act warnings": 5,
      "MetaMask: Background connection not initialized": 2
    }
  }
}
```

## Related Documentation

- [Manual Testing Guide](./CONSOLE-BASELINE-TEST.md) - Step-by-step verification instructions
