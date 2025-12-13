# E2E Test Anti-Patterns

For full guidelines, see [e2e-testing-guidelines.mdc](rules/e2e-testing-guidelines.mdc).

## Critical

| Pattern                 | Regex                              | Comment                                              |
| ----------------------- | ---------------------------------- | ---------------------------------------------------- |
| Hard-coded delays       | `driver\.delay\(`                  | Use `driver.waitForSelector()` instead               |
| Deprecated method       | `driver\.isElementPresent\(`       | Use `driver.assertElementNotPresent()` with guards   |
| Raw Selenium access     | `driver\.driver\.`                 | Use driver wrapper methods                           |
| JS test files           | `\.spec\.js$`                      | Use TypeScript (`.spec.ts`)                          |
| getText() assertion     | `\.getText\(\)`                    | Use `findElement` with `text` property instead       |
| unlockWallet usage      | `unlockWallet\(`                   | Use `loginWithBalanceValidation()` instead           |
| CSS/ID selectors        | `(click\|find)Element\(['"][\.\#]` | Use predefined selectors from the page object class  |
| Helper file imports     | `from ['"].*\/shared['"]`          | Use page objects and flows instead of shared helpers |
| Inline selector in test | `waitForSelector\(\{\s*css:`       | Use page object selectors, not inline CSS in tests   |

## Warning

| Pattern               | Regex                        | Comment                  |
| --------------------- | ---------------------------- | ------------------------ |
| "should" in test name | `it\(\s*['"]should\s`        | Use action-based names   |
| Multiple behaviors    | `it\(\s*['"][^'"]*\s+and\s+` | Split into focused tests |
| setTimeout            | `setTimeout\(`               | Use driver wait methods  |
