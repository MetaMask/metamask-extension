# Review Guidelines

> **Note:** This file provides automated pattern detection for Bugbot PR reviews.
> For detailed guidelines and explanations, see the referenced `.cursor/rules/` files.
> Bugbot uses these rules to automatically flag violations in PR diffs.

---

## Unit Test Files (*.test.ts, *.test.tsx)

### Test names using "should"
If any changed file matching `**/*.test.{ts,tsx}` contains `/(?:^|\s)it\s*\(\s*['"](?:should|Should|SHOULD)/`, then:
- Add a non-blocking Bug titled "Test name uses 'should'"
- Body: "Test names must use present tense, not 'should'. Replace 'should' with the action being tested. Example: `it('adds token', () => {})` instead of `it('should add token', () => {})`. See `.cursor/rules/unit-testing-guidelines/RULE.md` (lines 66-80) for details."
- Apply label "testing"

### Test names with "and" combining scenarios
If any changed file matching `**/*.test.{ts,tsx}` contains `/(?:^|\s)it\s*\(\s*['"].*\s+and\s+.*['"]/`, then:
- Add a non-blocking Bug titled "Test combines multiple scenarios with 'and'"
- Body: "Split this test into multiple focused tests. Each test should verify one aspect of behavior. See `.cursor/rules/unit-testing-guidelines/RULE.md` (lines 82-94) for examples."

### Using `any` type in tests
If any changed file matching `**/*.test.{ts,tsx}` contains `/(?:^|\s)(?:const|let|var|function|:\s*)\s*\w+\s*:\s*any\b/`, then:
- Add a non-blocking Bug titled "Using 'any' type in test"
- Body: "Use explicit types instead of 'any'. This improves type safety and makes tests more maintainable. See `.cursor/rules/unit-testing-guidelines/RULE.md` for TypeScript best practices in tests."

### Snapshot test named "renders correctly"
If any changed file matching `**/*.test.{ts,tsx}` contains `/(?:^|\s)it\s*\(\s*['"](?:renders correctly|should render correctly|render correctly)/i`, then:
- Add a non-blocking Bug titled "Snapshot test name is too generic"
- Body: "Snapshot tests should be named 'render matches snapshot' or similar variants, not 'renders correctly'. See `.cursor/rules/unit-testing-guidelines/RULE.md` (lines 176-177)."

### Using done() callback instead of async/await
If any changed file matching `**/*.test.{ts,tsx}` contains `/(?:^|\s)it\s*\([^,]+,\s*\(?\s*done\s*\)?\s*=>/`, then:
- Add a non-blocking Bug titled "Using done() callback in test"
- Body: "Use async/await instead of done() callbacks for async tests. Example: `it('handles async operation', async () => { await ... })`. See `.cursor/rules/unit-testing-guidelines/RULE.md` (lines 196-202)."

---

## E2E Test Files (*.spec.ts, test/e2e/**)

### Deprecated: Hard-coded delays (driver.delay)
If any changed file matching `test/e2e/**/*.spec.{ts,js}` contains `/\bdriver\.delay\s*\(/`, then:
- Add a non-blocking Bug titled "Deprecated driver.delay() usage"
- Body: "`driver.delay()` is deprecated and creates flaky tests. Use `driver.waitForSelector()` or page object wait methods instead. **Rule:** `.cursor/rules/e2e-testing-guidelines/RULE.md` → 'Deprecated Patterns' (lines 261, 425)."
- Apply label "deprecated"

### Deprecated: isElementPresent method
If any changed file matching `test/e2e/**/*.spec.{ts,js}` contains `/\bdriver\.isElementPresent\s*\(/`, then:
- Add a non-blocking Bug titled "Deprecated driver.isElementPresent() usage"
- Body: "`driver.isElementPresent()` is deprecated. Use `driver.assertElementNotPresent()` with guards instead. **Rule:** `.cursor/rules/e2e-testing-guidelines/RULE.md` → 'Deprecated Patterns'."
- Apply label "deprecated"

### Deprecated: Raw Selenium access (driver.driver)
If any changed file matching `test/e2e/**/*.spec.{ts,js}` contains `/\bdriver\.driver\./`, then:
- Add a non-blocking Bug titled "Raw Selenium access detected"
- Body: "Do not access `driver.driver` directly. Use driver wrapper methods instead. **Rule:** `.cursor/rules/e2e-testing-guidelines/RULE.md` → 'Deprecated Patterns'."
- Apply label "deprecated"

### JavaScript test files (.spec.js)
If any changed file matching `test/e2e/**/*.spec.js` is added or modified, then:
- Add a non-blocking Bug titled "JavaScript E2E test file detected"
- Body: "E2E tests must be written in TypeScript (.spec.ts), not JavaScript (.spec.js). Convert this file to TypeScript. **Rule:** `.cursor/rules/e2e-testing-guidelines/RULE.md` → 'Deprecated Patterns'."

### Deprecated: getText() assertion
If any changed file matching `test/e2e/**/*.spec.{ts,js}` contains `/\.getText\s*\(/`, then:
- Add a non-blocking Bug titled "Deprecated getText() usage"
- Body: "`getText()` is deprecated. Use `findElement` with text property instead. **Rule:** `.cursor/rules/e2e-testing-guidelines/RULE.md` → 'Deprecated Patterns'."
- Apply label "deprecated"

### Deprecated: unlockWallet usage
If any changed file matching `test/e2e/**/*.spec.{ts,js}` contains `/\bunlockWallet\s*\(/`, then:
- Add a non-blocking Bug titled "Deprecated unlockWallet() usage"
- Body: "`unlockWallet()` is deprecated. Use `loginWithBalanceValidation()` instead. **Rule:** `.cursor/rules/e2e-testing-guidelines/RULE.md` → 'Deprecated Patterns'."
- Apply label "deprecated"

### Deprecated: CSS/ID selectors in click/findElement
If any changed file matching `test/e2e/**/*.spec.{ts,js}` contains `/(?:click|find)Element\s*\(\s*['"][\.\#]/`, then:
- Add a non-blocking Bug titled "CSS/ID selector in E2E test"
- Body: "Do not use CSS class or ID selectors (starting with `.` or `#`). Use predefined selectors from the page object class instead. **Rule:** `.cursor/rules/e2e-testing-guidelines/RULE.md` → 'Deprecated Patterns'."
- Apply label "deprecated"

### Deprecated: Helper file imports from /shared
If any changed file matching `test/e2e/**/*.spec.{ts,js}` contains `/\bfrom\s+['"].*\/shared['"]/`, then:
- Add a non-blocking Bug titled "Deprecated shared helper import"
- Body: "Do not import from `/shared` helper files. Use page objects and flows instead. **Rule:** `.cursor/rules/e2e-testing-guidelines/RULE.md` → 'Deprecated Patterns'."
- Apply label "deprecated"

### Deprecated: Inline CSS selector in waitForSelector
If any changed file matching `test/e2e/**/*.spec.{ts,js}` contains `/\bwaitForSelector\s*\(\s*\{\s*css:/`, then:
- Add a non-blocking Bug titled "Inline CSS selector in waitForSelector"
- Body: "Do not use inline CSS selectors in `waitForSelector()`. Use page object selectors instead. **Rule:** `.cursor/rules/e2e-testing-guidelines/RULE.md` → 'Deprecated Patterns'."
- Apply label "deprecated"

### Test names using "should"
If any changed file matching `test/e2e/**/*.spec.{ts,js}` contains `/\bit\s*\(\s*['"]should\s/`, then:
- Add a non-blocking Bug titled "E2E test name uses 'should'"
- Body: "E2E test names must use action-based names in present tense, not 'should'. **Rule:** `.cursor/rules/e2e-testing-guidelines/RULE.md` → 'Test Naming Conventions' (lines 26-28)."

### Test names with "and" combining multiple behaviors
If any changed file matching `test/e2e/**/*.spec.{ts,js}` contains `/\bit\s*\(\s*['"][^'"]*\s+and\s+/`, then:
- Add a non-blocking Bug titled "E2E test combines multiple behaviors with 'and'"
- Body: "Split this test into focused tests. Each test should verify one behavior. **Rule:** `.cursor/rules/e2e-testing-guidelines/RULE.md` → 'Test Naming Conventions' (line 27)."

### Deprecated: setTimeout usage
If any changed file matching `test/e2e/**/*.spec.{ts,js}` contains `/\bsetTimeout\s*\(/`, then:
- Add a non-blocking Bug titled "setTimeout usage in E2E test"
- Body: "Do not use `setTimeout()` in E2E tests. Use driver wait methods instead (e.g., `driver.waitForSelector()`). **Rule:** `.cursor/rules/e2e-testing-guidelines/RULE.md` → 'Deprecated Patterns'."
- Apply label "deprecated"

---

## Component Files (*.tsx, *.jsx in ui/)

### Array index used as key in dynamic list
If any changed file matching `ui/**/*.{tsx,jsx}` contains `/\bkey\s*=\s*\{?\s*(?:index|i|idx)\s*\}?/`, then:
- Add a non-blocking Bug titled "Array index used as key in dynamic list"
- Body: "Using array index as key causes React rendering issues and can lead to incorrect component state. Use a unique identifier from the data (e.g., `item.id`, `token.address`). See `.cursor/rules/front-end-performance-rendering/RULE.md` for details."

### Class component instead of functional
If any changed file matching `ui/**/*.{tsx,jsx}` contains `/\bclass\s+\w+\s+extends\s+(?:React\.)?Component/`, then:
- Add a non-blocking Bug titled "Class component detected"
- Body: "Use functional components with hooks instead of class components. See `.cursor/rules/coding-guidelines/RULE.md` (lines 50-89) for migration examples and best practices."

### Using `any` type in components
If any changed file matching `ui/**/*.{tsx,jsx}` contains `/(?:^|\s)(?:const|let|var|function|:\s*)\s*\w+\s*:\s*any\b/`, then:
- Add a non-blocking Bug titled "Using 'any' type in component"
- Body: "Use explicit types instead of 'any'. This improves type safety and developer experience. See `.cursor/rules/coding-guidelines/RULE.md` (lines 20-48) for TypeScript best practices."

### JSON.stringify in useEffect dependencies
If any changed file matching `ui/**/*.{tsx,jsx}` contains `/\buseEffect\s*\([^,]+,\s*\[[^\]]*JSON\.stringify/`, then:
- Add a non-blocking Bug titled "JSON.stringify in useEffect dependencies"
- Body: "JSON.stringify in dependencies causes unnecessary re-renders. Use `useEqualityCheck` hook or normalize to primitives. **Rule:** `.cursor/rules/front-end-performance-hooks-effects/RULE.md` → 'Never Use JSON.stringify in useEffect Dependencies' (lines 88-145)."

---

## Controller Files (*Controller.ts, *-controller.ts)

### Controller not extending BaseController
If any changed file matching `**/*Controller.ts` or `**/*-controller.ts` contains `/\bclass\s+\w+Controller\s+(?!extends\s+BaseController)/`, then:
- Add a non-blocking Bug titled "Controller must extend BaseController"
- Body: "All controllers must extend BaseController from `@metamask/base-controller`. See `.cursor/rules/controller-guidelines/RULE.md` (lines 21-24) for controller structure requirements."

### Direct state mutation (not using this.update())
If any changed file matching `**/*Controller.ts` or `**/*-controller.ts` contains `/\bthis\.state\.\w+\s*=/`, then:
- Add a non-blocking Bug titled "Direct state mutation in controller"
- Body: "All state updates must use `this.update()` method, not direct mutation. Example: `this.update((state) => { state.items.push(item); })`. See `.cursor/rules/controller-guidelines/RULE.md` for state management patterns."

### Missing getDefaultState function export
If a changed file matching `**/*Controller.ts` or `**/*-controller.ts` defines a controller class but does not contain `/(?:export\s+)?function\s+getDefault\w+ControllerState\s*\(/`, then:
- Add a non-blocking Bug titled "Missing getDefaultState function export"
- Body: "Controllers must export a `getDefault${ControllerName}State()` function that returns the default state. See `.cursor/rules/controller-guidelines/RULE.md` for state management patterns."

---

## Redux Files (*reducer.ts, *slice.ts, *actions.ts, *selectors.ts)

### Direct state mutation in reducer
If any changed file matching `**/*reducer.{ts,js}` or `**/*slice.{ts,js}` contains `/\bstate\.\w+\s*=\s*[^;]+;/` and does not use Redux Toolkit's `createSlice`, then:
- Add a non-blocking Bug titled "Direct state mutation in reducer"
- Body: "Reducers must not mutate state directly. Use immutable updates or Redux Toolkit's `createSlice` which uses Immer. See `.cursor/rules/front-end-performance-state-management/RULE.md` for Redux patterns."

### Inline selector function in useSelector
If any changed file matching `ui/**/*.{tsx,jsx}` contains `/\buseSelector\s*\(\s*\([^)]*state[^)]*\)\s*=>\s*state\./`, then:
- Add a non-blocking Bug titled "Inline selector function in useSelector"
- Body: "Extract selector functions to memoized selectors instead of inline functions. This prevents unnecessary re-renders. **Rule:** `.cursor/rules/front-end-performance-state-management/RULE.md` → 'No Inline Selector Functions' section."

---

## General Patterns (All Files)

### console.log statements
If any changed file contains `/\bconsole\.(?:log|debug|info|warn|error)\s*\(/`, then:
- Add a non-blocking Bug titled "console.log statement found"
- Body: "Remove debug statements before committing. See `.cursor/rules/coding-guidelines/RULE.md` for code style guidelines."

### TODO/FIXME without issue reference
If any changed file contains `/(?:^|\s)(TODO|FIXME)(?:\s*:|\s+)(?!.*(?:#\d+|[A-Z]+-\d+))/`, then:
- Add a non-blocking Bug titled "TODO/FIXME comment found"
- Body: "Replace TODO/FIXME with a tracked issue reference, e.g., `TODO(#1234): ...`, or remove it."
- If the TODO already references an issue pattern `/#\d+|[A-Z]+-\d+/`, mark the Bug as resolved automatically.

### Using @ts-ignore without explanation
If any changed file contains `/(?:^|\s)\/\/\s*@ts-ignore(?!\s+.*reason|.*TODO|.*FIXME)/`, then:
- Add a non-blocking Bug titled "@ts-ignore without explanation"
- Body: "Add a comment explaining why @ts-ignore is necessary, or fix the underlying type issue. See `.cursor/rules/coding-guidelines/RULE.md` for TypeScript guidelines."

### JavaScript file when TypeScript required
If any changed file matching `**/*.{js,jsx}` is in a directory where TypeScript is the standard (e.g., `ui/`, `app/scripts/controllers/`), then:
- Add a non-blocking Bug titled "JavaScript file in TypeScript project"
- Body: "New code must be written in TypeScript. Convert this file to TypeScript (.ts or .tsx). See `.cursor/rules/coding-guidelines/RULE.md` (lines 12-18) for TypeScript requirements."

### Commented-out code
If any changed file contains `/(?:^|\s)\/\/\s*(?:const|let|var|function|class|if|for|while|return|import|export)\s+/`, then:
- Add a non-blocking Bug titled "Commented-out code found"
- Body: "Remove commented-out code. If it's needed for reference, add a comment explaining why, or create a tracked issue. See `.cursor/rules/coding-guidelines/RULE.md` for code style guidelines."

---

## Notes

### Pattern Detection Strategy

This file contains **only patterns that can be reliably detected via regex** with minimal false positives. Patterns that require semantic analysis, understanding of code context, or have high false positive rates have been excluded.

### Excluded Patterns

The following patterns are **not included** in this file because they require semantic analysis or have unreliable detection:

**Performance Patterns:**
- Missing `useMemo` for expensive computations - Requires understanding what's "expensive" and context
- Missing `useCallback` for callbacks - Requires analyzing how functions are used (passed as props, etc.)
- Missing `React.memo` - Requires understanding component usage frequency and prop stability
- Static objects/styles inside components - Unreliable regex detection, many false positives
- Missing cleanup in `useEffect` - Requires checking for return statements, unreliable
- Cascading `useEffect` chains - Requires semantic analysis of state dependencies
- Missing dependencies in hooks - **ESLint `react-hooks/exhaustive-deps` handles this better**

**Component Patterns:**
- Props not destructured - Regex too complex and unreliable
- `useEffect` for derived state - Requires understanding if state is derived vs. side effect

**Redux Patterns:**
- Multiple `useSelector` calls - Requires understanding state structure
- Identity function selectors - Requires understanding selector purpose

**Test Patterns:**
- Test name repeats function name - Too specific (only 4 function names), high false positive rate

### Pattern Detection Limitations
- Regex patterns may have false positives or negatives
- Complex architectural patterns may need manual review
- Bugbot flags violations in **newly added or modified lines only** (PR diff)
- All patterns in this file are designed to be **highly reliable** with minimal false positives

### Severity Levels
- **Non-blocking Bug**: All patterns are currently set to non-blocking. These are code quality improvements that should be addressed but do not block merging.

### Rule References
All rules are defined in `.cursor/rules/` files:
- Unit tests: `.cursor/rules/unit-testing-guidelines/RULE.md`
- E2E tests: `.cursor/rules/e2e-testing-guidelines/RULE.md`
- Components: `.cursor/rules/coding-guidelines/RULE.md` and `.cursor/rules/front-end-performance-*/RULE.md`
- Controllers: `.cursor/rules/controller-guidelines/RULE.md`
- Redux: `.cursor/rules/front-end-performance-state-management/RULE.md`
