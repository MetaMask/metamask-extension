# E2E Page Object Model rules

These rules apply to every changed file under `test/e2e/`. Report each match as a review comment. Page Object Model violations are treated as defects in this repo because they cause flaky tests and expensive rewrites, so do not skip them for being style or test-only code.

## Locators must not appear in flow files

Flag any locator in `test/e2e/page-objects/flows/**`: a `data-testid` or CSS string, a `{ css }` or `{ text, tag }` object, or a constant named `*Button`, `*Input`, `*Link`, `*Selector`, `*Locator`, `*TestId`.

Do not flag flows that only call page object methods or other flows, or that use `driver.navigate()` and window-switching helpers.

Comment: locators must live in page object classes. Move the locator into a page object under `test/e2e/page-objects/pages/` and call that method from the flow.

## Flows must use more than one page object

Flag any exported function in `test/e2e/page-objects/flows/**` whose body instantiates exactly one page object type and calls no other flow.

Do not flag functions that instantiate two or more distinct page objects, or that combine a page object with a call to another flow.

Comment: flows are for workflows spanning more than one page object. Move this method onto the page object class it uses.

## Specs must not define UI helper functions

Flag any function declared in `test/e2e/**/*.spec.{ts,js}` at module or `describe` scope whose body performs UI actions: calls `driver.clickElement`, `driver.findElement`, `driver.waitForSelector`, `driver.fill`, or `driver.delay`; instantiates a page object; or uses a locator.

Do not flag pure data helpers such as fixtures, mock JSON, expected values, and constants.

Comment: move the steps into a page object method, or into a flow when more than one page object is needed.

## Specs must not interact with elements directly

Flag any direct element interaction in `test/e2e/**/*.spec.{ts,js}`: `driver.clickElement`, `clickElementSafe`, `clickElementAndWaitToDisappear`, `clickElementAndWaitForWindowToClose`, `findElement`, `findElements`, `waitForSelector`, `waitForElementNotPresent`, `fill`, `press`, `isElementPresent`, `isElementPresentAndVisible`, or any inline locator.

Do not flag `driver.navigate()`, window and tab helpers, fixture setup, or request mocking.

Comment: call a page object method or a flow, and keep locators inside page objects.

## Hardcoded delays must be replaced by condition waits

Flag `driver.delay(` and `new Promise((resolve) => setTimeout(resolve, ...))` in specs, page objects, and flows.

Do not flag a delay whose preceding comment within three lines explains why a condition wait is not possible, and do not flag delays in `test/e2e/webdriver/` framework code.

Comment: wait for a condition instead (`waitForSelector`, `waitForElementNotPresent`, `driver.wait`). If a fixed delay is unavoidable, add a comment explaining why.

## Page objects must not invoke other page objects

Flag any file under `test/e2e/page-objects/pages/**` that imports another page class or instantiates one with `new OtherPage(this.driver)`.

Do not flag imports of types, enums, constants, or non-page helpers, and do not flag `extends` of a shared base page.

Comment: page objects must stay independent to avoid circular references. Move multi-page steps into a flow under `test/e2e/page-objects/flows/`.

## Page objects and flows must not use try/catch

Flag every `try`/`catch` in `test/e2e/page-objects/**`, including catch blocks that only log or rethrow.

Do not flag `try`/`catch` inside `driver.wait` polling callbacks that return `false`, or framework helpers in `test/e2e/webdriver/`.

Comment: let failures surface. Use driver wait helpers and `check*` methods with clear error messages.
