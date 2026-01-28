# Console Baseline Enforcement

Prevents new console warnings/errors from being introduced. Baseline is tracked **per test file**.

## Quick Reference

| Command                                              | Description                            |
| ---------------------------------------------------- | -------------------------------------- |
| `yarn test:unit`                                     | Run tests with baseline enforcement    |
| `yarn test:unit:update-baseline`                     | Update baseline (all files)            |
| `yarn test:unit:update-baseline path/to/file`        | Update baseline (single file)          |
| `yarn test:integration`                              | Run integration tests with enforcement |
| `yarn test:integration:update-baseline`              | Update integration baseline            |
| `yarn test:integration:update-baseline path/to/file` | Update baseline (single file)          |

## How It Works

1. **Run tests** → Reporter compares console output against baseline
2. **Violation detected** → Test fails, shows which file/category increased
3. **Improvement detected** → Shows reduced warnings (doesn't fail)
4. **Update baseline** → Run with `:update-baseline` to accept changes

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

# 2. Fix warnings in code, OR update baseline if justified
yarn test:unit:update-baseline path/to/my-component.test.tsx

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
