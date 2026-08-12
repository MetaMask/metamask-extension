# BUGBOT Rules

## Core Mission

Automated test quality enforcement and bug detection for MetaMask Extension codebase

## Execution Protocol

### 1. General Coding Guidelines

- **ALWAYS** load and reference [coding-guidelines](rules/coding-guidelines/RULE.md)
- Applies to all files (alwaysApply: true)
- Check for TypeScript usage in new code
- Verify functional components and hooks are used in React
- Check for proper component optimization (memoization, useEffect usage)
- Verify object destructuring for props
- Check file organization patterns
- Verify naming conventions (PascalCase for components, camelCase for functions, `use` prefix for hooks, `with` prefix for HOCs)
- Check code reusability (DRY principle)
- Verify documentation requirements (TSDoc for utilities, README for components)
- Ensure tests are written for all components and utilities
- Verify external packages are well-maintained and necessary

Use the rules in the [coding-guidelines](rules/coding-guidelines/RULE.md) to enforce the test quality and bug detection.

### 2. Unit Tests

- **ALWAYS** load and reference [unit testing guidelines](rules/unit-testing-guidelines/RULE.md)
- Verify test file naming pattern: `*.test.{ts,tsx,js,jsx}`
- Check for proper Jest and testing library imports
- Ensure tests are colocated with implementation files

Use the rules in the [unit testing guidelines](rules/unit-testing-guidelines/RULE.md) to enforce the test quality and bug detection.

### 3. E2E Tests

- **ALWAYS** load and reference [e2e-testing-guidelines](rules/e2e-testing-guidelines/RULE.md)
- Verify test file naming pattern: `test/e2e/**/*.spec.{ts,js}`
- Check for proper imports from the E2E framework
- Verify Page Object Model pattern is used
- Ensure tests are written in TypeScript (.spec.ts)
- **ALWAYS** apply the Page Object Model rules in sections **3.3–3.9** to every changed file under `test/e2e/`. Report each match as a review comment, even when the code is otherwise correct: these are maintainability defects that block merge in this repo.

Use the rules in the [e2e-testing-guidelines](rules/e2e-testing-guidelines/RULE.md) to enforce the test quality and bug detection.

#### 3.1 Deprecated Pattern Detection (Non-Blocking): Prefer `FixtureBuilderV2`

- Analyze only changed lines in the PR diff.
- Scope: `test/e2e/**/*.spec.{ts,js}` files.
- Goal: discourage new usage of legacy `FixtureBuilder` when `FixtureBuilderV2` can be used.

##### Trigger Signals (changed lines only)

- Legacy import introduced:
  - `import FixtureBuilder from '.../fixtures/fixture-builder'`
  - Regex: `import\s+FixtureBuilder\s+from\s+['"].*/fixtures/fixture-builder['"]`
- Legacy instantiation introduced:
  - `new FixtureBuilder(...)`
  - Regex: `new\s+FixtureBuilder\s*\(`

##### Compatibility Check Before Reporting

When a trigger is found, inspect methods chained from `new FixtureBuilder()` in the changed file.

- If there are no custom methods (only `.build()`), report it.
- If all used methods are supported in `FixtureBuilderV2`, report it.
- If any required method is not available in `FixtureBuilderV2`, do not report this rule.

Supported methods in `FixtureBuilderV2`:

- `withAddressBookController`
- `withCurrencyController`
- `withPermissionController`
- `withPreferencesController`
- `withConversionRateDisabled`
- `withEnabledNetworks`
- `withPermissionControllerConnectedToTestDapp`

##### Severity and Message

- Severity: **HIGH** (deprecated pattern), non-blocking.
- Suggested comment:
  - `⚠️ DEPRECATED: This spec introduces legacy FixtureBuilder usage. Please use FixtureBuilderV2 when supported by the methods used in this test.`
  - `✅ Use instead: import FixtureBuilderV2 from '.../fixtures/fixture-builder-v2' and instantiate new FixtureBuilderV2(...).`

#### 3.2 Snap E2E Tests: Require `withSnapsPrivacyWarningAlreadyShown`

- Analyze only changed lines in the PR diff.
- Scope: `test/e2e/snaps/**/*.spec.{ts,js}` files.
- Goal: ensure snap specs that use `FixtureBuilderV2` chain `.withSnapsPrivacyWarningAlreadyShown()` so the snap privacy warning modal is not shown during test runs (reduces flakiness and keeps tests focused on snap behavior).

##### Trigger Signals (changed lines only)

- File path matches: `test/e2e/snaps/**/*.spec.{ts,js}`.
- FixtureBuilderV2 instantiation in the file: `new FixtureBuilderV2(`.

##### Compatibility Check Before Reporting

When both conditions hold, inspect the fixture builder chain in the same `withFixtures` / test block.

- If the chain includes `.withSnapsPrivacyWarningAlreadyShown()` (anywhere in the chain), do not report.
- If the chain does **not** include `.withSnapsPrivacyWarningAlreadyShown()`, report this rule.

##### Severity and Message

- Severity: **MEDIUM** (test quality), non-blocking.
- Suggested comment:
  - `📋 Snap E2E tests should use \`.withSnapsPrivacyWarningAlreadyShown()\` on the fixture builder so the snap privacy warning is already dismissed. This avoids extra UI steps and reduces flakiness.`
  - `✅ Add \`.withSnapsPrivacyWarningAlreadyShown()\` to the FixtureBuilderV2 chain, e.g. \`new FixtureBuilderV2().withSnapsPrivacyWarningAlreadyShown().build()\` or chain it with other methods.`

#### 3.3 Locators in flow files

**Flag** any locator in `test/e2e/page-objects/flows/**`: a `data-testid` or CSS string, a `{ css }` / `{ text, tag }` object, or a constant named `*Button`, `*Input`, `*Link`, `*Selector`, `*Locator`, `*TestId` — including locators passed to `driver.clickElement`, `driver.findElement`, `driver.waitForSelector`, or `driver.fill`.

**Do not flag** flows that only call page object methods or other flows, or that use `driver.navigate()` and window-switching helpers.

Severity: HIGH. Comment: "Locators must live in page object classes, not in flow files. Move this locator into a page object under `test/e2e/page-objects/pages/` and call that method from the flow."

#### 3.4 Flows that use a single page object

**Flag** any exported function in `test/e2e/page-objects/flows/**` whose body instantiates exactly one page object type (`new SomePage(`) and calls no other flow.

**Do not flag** functions that instantiate two or more distinct page objects, or that combine a page object with a call to another flow.

Severity: HIGH. Comment: "Flows are for workflows that span more than one page object. Move this method onto the page object class it uses."

#### 3.5 UI helper functions in spec files

**Flag** any function declared in `test/e2e/**/*.spec.{ts,js}` at module or `describe` scope whose body performs UI actions: calls `driver.clickElement`, `driver.findElement`, `driver.waitForSelector`, `driver.fill`, or `driver.delay`; instantiates a page object; or uses a locator.

**Do not flag** pure data helpers (fixtures, mock JSON, expected values, constants) with no UI interaction, or hooks that only call existing flows and page object methods.

Severity: HIGH. Comment: "Specs must not define helpers that perform UI actions. Move the steps into a page object method, or into a flow when more than one page object is needed."

#### 3.6 Specs interacting with elements directly

**Flag** any direct element interaction in `test/e2e/**/*.spec.{ts,js}`: `driver.clickElement`, `clickElementSafe`, `clickElementAndWaitToDisappear`, `clickElementAndWaitForWindowToClose`, `findElement`, `findElements`, `waitForSelector`, `waitForElementNotPresent`, `fill`, `press`, `isElementPresent`, `isElementPresentAndVisible`, or any inline locator.

**Do not flag** `driver.navigate()`, window and tab helpers (`getAllWindowHandles`, `switchToWindow*`, `closeWindow`), fixture setup, or request mocking.

Severity: HIGH. Comment: "Specs must not interact with page elements directly. Call a page object method or a flow, and keep locators inside page objects."

#### 3.7 Hardcoded delays

**Flag** `driver.delay(` and `new Promise((resolve) => setTimeout(resolve, ...))` in `test/e2e/**` specs, page objects, and flows.

**Do not flag** a delay whose preceding comment (within three lines) explains why a condition wait is not possible, or delays in `test/e2e/webdriver/` framework code.

Severity: MEDIUM. Comment: "Avoid hardcoded delays; wait for a condition instead (`waitForSelector`, `waitForElementNotPresent`, `driver.wait`). If a fixed delay is unavoidable, add a comment explaining why."

#### 3.8 Page objects invoking other page objects

**Flag** any file under `test/e2e/page-objects/pages/**` that imports another page class or instantiates one with `new OtherPage(this.driver)`.

**Do not flag** imports of types, enums, constants, or non-page helpers, and do not flag `extends` of a shared base page.

Severity: HIGH. Comment: "Page objects must stay independent to avoid circular references and hidden workflows. Move multi-page steps into a flow under `test/e2e/page-objects/flows/`."

#### 3.9 try/catch in page objects and flows

**Flag** every `try`/`catch` in `test/e2e/page-objects/**` (pages and flows), including catch blocks that only log or rethrow.

**Do not flag** `try`/`catch` inside `driver.wait` polling callbacks that return `false`, or framework helpers in `test/e2e/webdriver/`.

Severity: MEDIUM. Comment: "Do not use try/catch in E2E page objects or flows — let failures surface. Use driver wait helpers and `check*` methods with clear error messages."

### 4. Controller Guidelines

- **ALWAYS** load and reference [controller-guidelines](rules/controller-guidelines/RULE.md)
- Auto-detect controller files based on naming patterns: `*Controller.ts`, `*Controller.js`, `*-controller.ts`, `*-controller.js`
- Only apply when analyzing controller files
- Verify controller inherits from BaseController
- Verify that controller has state
- Check state management patterns (partial state acceptance, default state functions, state metadata)
- Verify constructor uses single options bag pattern
- Check for messenger usage instead of callbacks for inter-controller communication
- Verify selectors are used instead of getter methods for derived state
- Check that action methods model high-level user actions, not low-level setters
- Verify minimal state (no derived values stored)
- Check proper lifecycle management (initialization, cleanup in `destroy()`)

Use the rules in the [controller-guidelines](rules/controller-guidelines/RULE.md) to enforce the test quality and bug detection.

### 5. Front-End Performance Guidelines

#### 5.1 Hooks & Effects Optimization

- **ALWAYS** load and reference [front-end-performance-hooks-effects](rules/front-end-performance-hooks-effects/RULE.md)
- Auto-detect files: `use*.{ts,tsx,js,jsx}`, `*.{tsx,jsx}`
- Check useEffect usage patterns, dependency management (never use JSON.stringify)
- Verify cleanup functions for intervals, subscriptions, and async operations
- Ensure proper hook usage (unconditional calls, refs for persistent values)

Use the rules in the [front-end-performance-hooks-effects](rules/front-end-performance-hooks-effects/RULE.md) to enforce the test quality and bug detection.

#### 5.2 React Compiler & Anti-Patterns

- **ALWAYS** load and reference [front-end-performance-react-compiler](rules/front-end-performance-react-compiler/RULE.md)
- Auto-detect files: `*.{tsx,jsx,ts,js}`
- Verify manual memoization for cross-file dependencies, Redux selectors, and external state
- Keep existing useMemo/useCallback for effect dependencies
- Check proper list keys and avoid over-memoization

Use the rules in the [front-end-performance-react-compiler](rules/front-end-performance-react-compiler/RULE.md) to enforce the test quality and bug detection.

#### 5.3 Rendering Performance

- **ALWAYS** load and reference [front-end-performance-rendering](rules/front-end-performance-rendering/RULE.md)
- Auto-detect files: `*.{tsx,jsx,ts,js}`
- Verify unique keys, virtualization for long lists, and React.memo usage
- Check code splitting (React.lazy/Suspense) and pagination patterns
- Ensure expensive computations use useMemo or Redux selectors

Use the rules in the [front-end-performance-rendering](rules/front-end-performance-rendering/RULE.md) to enforce the test quality and bug detection.

#### 5.4 State Management & Redux

- **ALWAYS** load and reference [front-end-performance-state-management](rules/front-end-performance-state-management/RULE.md)
- Auto-detect files: `*selector*.{ts,js}`, `*reducer*.{ts,js}`, `*ducks*.{ts,js}`, `*slice*.{ts,js}`
- Verify immutable reducers, no side effects, and serializable state
- Check normalized state structure (byId/allIds) and proper selector memoization
- Ensure efficient selector patterns (avoid Object.values() without memoization, combine multiple useSelector calls)

Use the rules in the [front-end-performance-state-management](rules/front-end-performance-state-management/RULE.md) to enforce the test quality and bug detection.
