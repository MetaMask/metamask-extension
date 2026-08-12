# E2E Page Object Model rules

These rules apply to changed files under `test/e2e/`. Page Object Model violations are defects in this repository: they produce flaky tests and force expensive rewrites. Report every match, even when the surrounding code is otherwise correct.

## Locators in flow files

For files matching `test/e2e/page-objects/flows/**/*.{ts,js}`:
If a changed line contains `/data-testid|\{\s*css\s*:|\{\s*text\s*:.*tag\s*:|(const|let)\s+\w*(Button|Input|Link|Selector|Locator|TestId)\s*(:|=)/`, then:

- Add a blocking Bug titled "Locator defined in a flow file"
- Body: "Locators must live in page object classes, not in flows. Move this locator into a page object under `test/e2e/page-objects/pages/` and call that page object method from the flow."
- Do not report when the line only calls a page object method, another flow, `driver.navigate()`, or a window-switching helper.

## Flows built on a single page object

For files matching `test/e2e/page-objects/flows/**/*.{ts,js}`:
If a changed exported function instantiates exactly one page object type (`/new\s+\w+Page\s*\(/` matched once for a single type) and calls no other flow, then:

- Add a blocking Bug titled "Flow uses a single page object"
- Body: "Flows exist for workflows that span more than one page object. Move this method onto the page object class it already uses."
- Do not report when the function instantiates two or more distinct page objects, or combines a page object with a call to another flow.

## UI helper functions in spec files

For files matching `test/e2e/**/*.spec.{ts,js}`:
If a changed function declared at module or `describe` scope has a body containing `/driver\.(clickElement|findElement|waitForSelector|fill|delay)|new\s+\w+Page\s*\(/`, then:

- Add a blocking Bug titled "UI helper function defined in a spec"
- Body: "Specs must not define helpers that perform UI actions. Move the steps into a page object method, or into a flow when more than one page object is involved."
- Do not report pure data helpers such as fixtures, mock JSON, expected values, and constants.

## Direct element interaction in specs

For files matching `test/e2e/**/*.spec.{ts,js}`:
If a changed line contains `/driver\.(clickElement|clickElementSafe|clickElementAndWaitToDisappear|clickElementAndWaitForWindowToClose|findElement|findElements|waitForSelector|waitForElementNotPresent|fill|press|isElementPresent|isElementPresentAndVisible)\s*\(/`, then:

- Add a blocking Bug titled "Spec interacts with elements directly"
- Body: "Specs must not interact with page elements directly. Call a page object method or a flow, and keep locators inside page objects."
- Do not report `driver.navigate()`, window and tab helpers, fixture setup, or request mocking.

## Hardcoded delays

For files matching `test/e2e/**/*.{ts,js}`:
If a changed line contains `/driver\.delay\s*\(|setTimeout\s*\(\s*resolve/`, then:

- Add a non-blocking Bug titled "Hardcoded delay in an E2E test"
- Body: "Wait for a condition instead of a fixed delay: use `waitForSelector`, `waitForElementNotPresent`, or `driver.wait`. If a fixed delay is unavoidable, add a comment explaining why."
- Do not report when a comment within the three preceding lines explains why a condition wait is impossible, and do not report files under `test/e2e/webdriver/`.

## Page objects invoking other page objects

For files matching `test/e2e/page-objects/pages/**/*.{ts,js}`:
If a changed line imports another page class or contains `/new\s+\w+(Page|Navbar|Modal)\s*\(\s*this\.driver\s*\)/`, then:

- Add a blocking Bug titled "Page object invokes another page object"
- Body: "Page objects must stay independent to avoid circular references and hidden workflows. Move multi-page steps into a flow under `test/e2e/page-objects/flows/`."
- Do not report imports of types, enums, constants, or non-page helpers, and do not report `extends` of a shared base page.

## try/catch in page objects and flows

For files matching `test/e2e/page-objects/**/*.{ts,js}`:
If a changed line contains `/\btry\s*\{/` or `/\}\s*catch\s*\(/`, then:

- Add a non-blocking Bug titled "try/catch in a page object or flow"
- Body: "Do not swallow failures in page objects or flows. Let the error surface, and use driver wait helpers and `check*` methods with clear error messages."
- Do not report `try`/`catch` inside a `driver.wait` polling callback that returns `false`, or framework helpers under `test/e2e/webdriver/`.
