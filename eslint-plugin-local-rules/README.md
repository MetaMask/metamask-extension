# @metamask/eslint-plugin-local-rules

Local ESLint rules for MetaMask Extension project.

## Rules

### prefer-fixture-builder-v2

Enforces usage of `FixtureBuilderV2` instead of legacy `FixtureBuilder` in E2E tests.

**Why?** The legacy `FixtureBuilder` (from `test/e2e/fixtures/fixture-builder.js`) is being migrated to `FixtureBuilderV2` (from `test/e2e/fixtures/fixture-builder-v2.ts`) which provides:
- Better type safety with TypeScript
- More modern fixture building patterns
- Improved maintainability

**Rule Details**

This rule warns when E2E test files import from the legacy `fixture-builder` module instead of `fixture-builder-v2`.

Examples of **incorrect** code:

```typescript
import FixtureBuilder from '../../fixtures/fixture-builder';

const { FixtureBuilder } = require('../../fixtures/fixture-builder');
```

Examples of **correct** code:

```typescript
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
```

**When Not To Use It**

This rule only applies to E2E test files (`test/e2e/**/*.spec.{js,ts}`). If you have a legitimate reason to use the legacy `FixtureBuilder`, you can disable the rule for that line:

```typescript
// eslint-disable-next-line @metamask/local-rules/prefer-fixture-builder-v2
import FixtureBuilder from '../../fixtures/fixture-builder';
```

**Related**

- Jira ticket: [MMQA-1462](https://consensyssoftware.atlassian.net/browse/MMQA-1462)
- Slack discussion: [Thread](https://consensys.slack.com/archives/C08388MPZ9V/p1772028149275769)
