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
- **ALWAYS** apply POM anti-pattern detectors in sections **3.3–3.9** for changes under `test/e2e/` (flows, page objects, and specs). These catch issues Bugbot historically missed (selectors in flows, single-page flows, helpers/direct driver use in specs, hardcoded delays, page-object coupling, try/catch in POMs).

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

#### 3.3 POM Anti-Pattern: Locators / Selectors in Flow Files

- Analyze only changed lines in the PR diff.
- Scope: `test/e2e/page-objects/flows/**/*.{ts,js}` files.
- Goal: keep all locators in page objects. Flows orchestrate page objects; they must not define or use raw selectors.

##### Trigger Signals (changed lines only)

- Locator-style string or object used with driver APIs in a flow file:
  - `driver.clickElement(`, `driver.findElement(`, `driver.waitForSelector(`, `driver.clickElementAndWaitForWindowToClose(`, `driver.fill(`, `driver.isElementPresent(`, `driver.isElementPresentAndVisible(`
  - Arguments that look like locators: `'[data-testid=...'`, `'.css-class'`, `{ css: ... }`, `{ text: ..., tag: ... }`, `` `[data-testid="${...}"]` ``
- Locator constants / fields defined in a flow file:
  - `const ...Button =`, `readonly ...Button =`, `private ...Selector =`, or similar names ending in `Button`, `Input`, `Link`, `Selector`, `Locator`, `TestId`
  - Regex (examples): `data-testid`, `By\.(css|xpath)`, `css:\s*['\"]`

##### Compatibility Check Before Reporting

- If the flow only calls page-object methods (no raw locator args to `driver.*`), do not report.
- If the flow imports another flow and only calls flow/page-object APIs, do not report.
- Calling `driver.navigate()`, `driver.switchToWindow*`, or similar non-locator driver helpers is allowed and should not be reported under this rule.

##### Severity and Message

- Severity: **HIGH** (POM anti-pattern), non-blocking.
- Suggested comment:
  - `❌ ANTI-PATTERN: Locators/selectors must live in page object classes, not in flow files.`
  - `✅ Move the locator into the relevant page object under \`test/e2e/page-objects/pages/\`, expose a method on that page object, and call the method from the flow.`

#### 3.4 POM Anti-Pattern: Flow Used When Only One Page Object Is Needed

- Analyze only changed lines in the PR diff (inspect the full new/changed flow function when a trigger is found).
- Scope: `test/e2e/page-objects/flows/**/*.{ts,js}` files.
- Goal: flows exist to coordinate **two or more** page objects (or page object + another flow). Single-page-object actions belong on that page object.

##### Trigger Signals (changed lines only)

- New or modified exported flow function / method in a `*.flow.ts` file.
- Inside that function body, exactly one page-object construction of the form `new SomePage(` / `new SomePageObject(` (count distinct page-object types instantiated).

##### Compatibility Check Before Reporting

- If the function instantiates **two or more** distinct page objects, do not report.
- If the function calls another flow (import from `*.flow`) **and** uses a page object, do not report (cross-page orchestration).
- If the function only wraps driver window/navigation helpers with no page object, do not report under this rule (may still violate other rules).
- If the single page object is used together with another flow call that itself covers other pages, do not report.

##### Severity and Message

- Severity: **HIGH** (POM anti-pattern), non-blocking.
- Suggested comment:
  - `❌ ANTI-PATTERN: Flows should be used when more than one page object is needed. This flow only uses a single page object.`
  - `✅ Move this method onto that page object class. Reserve flows for multi-page workflows (see contributor-docs POM best practices).`

#### 3.5 POM Anti-Pattern: Helper Functions With UI Actions in Spec Files

- Analyze only changed lines in the PR diff.
- Scope: `test/e2e/**/*.spec.{ts,js}` files.
- Goal: specs must only call page-object methods or flows; do not define local helpers that perform UI steps.

##### Trigger Signals (changed lines only)

- Local helper declared in a spec file:
  - `async function ...(` / `const ... = async (` / `async (...) =>` at module or describe scope (not inside an `it`/`test` body as a one-liner callback).
- Helper body performs UI actions, for example:
  - `driver.clickElement`, `driver.findElement`, `driver.waitForSelector`, `driver.fill`, `driver.delay`
  - `new SomePage(`, `new SomePageObject(`, or calls into page-object methods
  - Imports and calls of raw selectors / locators

##### Compatibility Check Before Reporting

- Pure data helpers (builders, expected values, mock JSON, constants) with **no** driver/page-object UI interaction: do not report.
- Shared helpers that already live under `test/e2e/page-objects/` or dedicated `*.flow.ts` files: out of scope for this rule.
- Mocha hooks (`before`/`beforeEach`/`after`/`afterEach`) that only call existing flows/page objects: do not report solely for being a helper; still report if they embed raw locators (see 3.6).

##### Severity and Message

- Severity: **HIGH** (POM anti-pattern), non-blocking.
- Suggested comment:
  - `❌ ANTI-PATTERN: Do not put helper functions that perform test/UI actions in spec files.`
  - `✅ Move the steps into a page object method, or into a flow if more than one page object is required. Specs should only call page object methods or flows.`

#### 3.6 POM Anti-Pattern: Specs Interact With Elements Directly

- Analyze only changed lines in the PR diff.
- Scope: `test/e2e/**/*.spec.{ts,js}` files.
- Goal: tests should only call page-object methods or flows; they must not interact with page elements via the driver.

##### Trigger Signals (changed lines only)

- In a spec file, direct driver element interaction:
  - `driver.clickElement(`, `driver.clickElementSafe(`, `driver.clickElementAndWaitToDisappear(`, `driver.clickElementAndWaitForWindowToClose(`, `driver.findElement(`, `driver.findElements(`, `driver.waitForSelector(`, `driver.waitForElementNotPresent(`, `driver.fill(`, `driver.press(`, `driver.isElementPresent(`, `driver.isElementPresentAndVisible(`
- Inline locators in the spec: `'[data-testid=...'`, `{ css: ... }`, `{ text: ..., tag: ... }`

##### Compatibility Check Before Reporting

- Allowed without reporting:
  - `driver.navigate(`, window/tab helpers (`getAllWindowHandles`, `switchToWindow*`, `closeWindow`, etc.)
  - Fixture setup (`withFixtures`, mocking endpoints) that does not click/find UI via locators
  - Assertions that use page-object `check*` methods
- If the same change also introduces a proper page-object/flow API and the driver call is clearly temporary scaffolding, still report (prefer fixing before merge).

##### Severity and Message

- Severity: **HIGH** (POM anti-pattern), non-blocking.
- Suggested comment:
  - `❌ ANTI-PATTERN: Specs must not interact with page elements directly.`
  - `✅ Call a page object method or a flow instead. Keep locators inside page objects under \`test/e2e/page-objects/pages/\`.`

#### 3.7 POM Anti-Pattern: Hardcoded Delays

- Analyze only changed lines in the PR diff.
- Scope: `test/e2e/**/*.{ts,js}` (specs, page objects, and flows).
- Goal: prefer wait-for conditions over fixed sleeps to reduce flakiness and runtime.

##### Trigger Signals (changed lines only)

- `driver.delay(`
- `await new Promise(...setTimeout...`
- `setTimeout(` used as a wait in async test code
- Regex: `driver\.delay\s*\(` or `new\s+Promise\s*\(\s*(?:async\s*)?\(?\s*resolve\s*\)?\s*=>\s*setTimeout`

##### Compatibility Check Before Reporting

- If the **immediately preceding comment** (same line or 1–3 lines above) explains why a fixed delay is required and why a condition wait is not possible, do not report.
- Do not report delays inside framework code under `test/e2e/webdriver/` unless the change newly introduces an unnecessary sleep in a page object/spec/flow.

##### Severity and Message

- Severity: **MEDIUM** (stability), non-blocking.
- Suggested comment:
  - `⚠️ Avoid hardcoded delays. Wait for a condition instead (\`waitForSelector\`, \`waitForElementNotPresent\`, \`driver.wait\`, etc.).`
  - `✅ If a fixed delay is unavoidable, keep it and add a short comment explaining why a condition wait is not possible.`

#### 3.8 POM Anti-Pattern: Page Objects Invoking Other Page Objects

- Analyze only changed lines in the PR diff.
- Scope: `test/e2e/page-objects/pages/**/*.{ts,js}` files.
- Goal: page objects stay independent. Cross-page workflows belong in flows.

##### Trigger Signals (changed lines only)

- Import of another page object from `page-objects/pages` (or relative `../` page modules) inside a page object file:
  - `import X from '../...';` / `import { X } from '../...';` where `X` is a page class
- Instantiation of another page object: `new OtherPage(this.driver)` / `new OtherPage(driver)` inside a page object class

##### Compatibility Check Before Reporting

- Importing shared types, enums, constants, or non-page helpers: do not report.
- Base-class / inheritance patterns (`extends SomeBasePage`) in the same feature folder: do not report when it is clearly a shared base, not a second screen collaborator.
- A page object constructing **itself** recursively: do not report.
- If the change only moves existing coupling without adding new cross-page calls, still report new/changed coupling lines.

##### Severity and Message

- Severity: **HIGH** (POM anti-pattern), non-blocking.
- Suggested comment:
  - `❌ ANTI-PATTERN: Page objects must not invoke other page objects (avoids circular references and hidden workflows).`
  - `✅ Move the multi-page steps into a flow under \`test/e2e/page-objects/flows/\` that instantiates the needed page objects.`

#### 3.9 POM Anti-Pattern: `try` / `catch` in Page Objects and Flows

- Analyze only changed lines in the PR diff.
- Scope: `test/e2e/page-objects/**/*.{ts,js}` (pages and flows).
- Goal: page objects and flows should fail clearly; do not swallow or rebrand errors with `try`/`catch`.

##### Trigger Signals (changed lines only)

- `try {` / `catch (` introduced in a page object or flow file.

##### Compatibility Check Before Reporting

- Do not report `try`/`catch` in `test/e2e/webdriver/` framework helpers unless the PR is specifically changing page objects/flows.
- If catch only rethrows without changing control flow meaningfully, still report (prefer removing the try/catch).

##### Severity and Message

- Severity: **MEDIUM** (POM anti-pattern), non-blocking.
- Suggested comment:
  - `❌ ANTI-PATTERN: Do not use try/catch in E2E page objects or flows.`
  - `✅ Let failures surface. Use driver wait helpers and page-object \`check*\` methods with clear error messages instead of catching errors.`

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
