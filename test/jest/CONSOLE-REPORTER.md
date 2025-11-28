# Console Reporter for Jest Tests

We use [`jest-clean-console-reporter`](https://github.com/jevakallio/jest-clean-console-reporter) to group and summarize console warnings/errors during test runs, making it easier to spot real issues.

## What It Does

Instead of seeing thousands of repeated warnings like:

```
Warning: Background connection is not set...
Warning: Background connection is not set...
Warning: Background connection is not set...
... (2,300 more times)
```

You'll see a clean summary:

```
● Suppressed console messages:

WARN 170   MetaMask: Background connection not initialized
WARN 85    Reselect: Identity function warnings
WARN 66    Reselect: Input stability warnings
```

**Result:** 99.97% reduction in test output noise.

## Usage

The reporter runs automatically with unit and integration test commands:

```bash
yarn test:unit
yarn test:integration
```

No additional configuration needed!

## How It Works

Rules are defined in separate files:

- **Unit tests:** `test/jest/console-reporter-rules-unit.js`
- **Integration tests:** `test/jest/console-reporter-rules-integration.js`

Each rule matches console messages and groups them by category. Rules are matched in order, so more specific patterns should come first.

## Adding or Modifying Rules

### Rule Structure

```javascript
{
  match: /regex pattern/u,        // RegExp, string, or function
  group: 'Group Label',           // String to group by, or null to ignore
  keep: true,                     // (Optional) Keep in output AND summary
}
```

### Examples

**Group similar warnings:**

```javascript
{
  match: /Warning: componentWillMount has been renamed/u,
  group: 'React: componentWill* lifecycle deprecations',
}
```

**Suppress a warning completely:**

```javascript
{
  match: /Some noisy warning we can't fix/u,
  group: null, // null = suppress completely
}
```

**Match by log level:**

```javascript
{
  match: (_message, level) => level === 'log',
  group: null, // Ignore all console.log
}
```

### Steps to Add a Rule

1. Identify the warning pattern (run tests and note the exact message)
2. Open the appropriate rules file:
   - Unit tests: `test/jest/console-reporter-rules-unit.js`
   - Integration tests: `test/jest/console-reporter-rules-integration.js`
3. Add your rule to the appropriate category section
4. Run tests to verify it works: `yarn test:unit` or `yarn test:integration`

**Important:** Always use the `u` flag with regex patterns for proper Unicode handling (required by ESLint).

## Common Warning Categories

The rules cover these main categories:

- **MetaMask-specific:** Background connection, theme validation, migrations
- **Reselect:** Redux selector performance warnings (identity functions, input stability)
- **React:** Act warnings, lifecycle deprecations, DOM nesting, PropTypes
- **Third-party:** Library compatibility warnings
- **Test errors:** Uncaught errors, fetch failures

## Troubleshooting

**Reporter not working?**

- Ensure `jest-clean-console-reporter` is installed: `yarn install`
- Check that rules files exist and are properly formatted
- Verify Jest config includes the reporter (already configured)

**Warnings not being grouped?**

- Check your regex patterns (use the `u` flag!)
- Test patterns in isolation
- Try using a predicate function for complex matching
- Rules are matched in order - put more specific patterns first

**Want to see raw output for debugging?**

- Add `keep: true` to specific rules
- Or temporarily comment out the reporter in `jest.config.js`

## Initial Coverage

- **Unit tests:** ~83% of warnings grouped (5,234 of 6,299 messages)
- **Integration tests:** ~100% of warnings grouped (435 of 435 messages)

Top warnings being grouped:

1. Background connection not initialized (2,300 occurrences)
2. Reselect identity function warnings (1,163 occurrences)
3. Invalid theme warnings (700+ occurrences)
4. Reselect input stability warnings (533 occurrences)
5. React act warnings (338+ occurrences)

## Limitations

**This reporter does NOT:**

- Create persistent snapshots
- Fail CI on new warnings
- Prevent regression

It only **improves the display** of console output during test runs. For regression prevention, a custom snapshot-based reporter would be needed.

## References

- [jest-clean-console-reporter GitHub](https://github.com/jevakallio/jest-clean-console-reporter)
- [Jest Reporters Documentation](https://jestjs.io/docs/configuration#reporters-arraymodulename--modulename-options)
