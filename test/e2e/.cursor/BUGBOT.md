# E2E Test Anti-Patterns

For full guidelines, see [e2e-testing-guidelines.mdc](rules/e2e-testing-guidelines.mdc).

## Critical

| Pattern             | Regex                        | Comment                                            |
| ------------------- | ---------------------------- | -------------------------------------------------- |
| Hard-coded delays   | `driver\.delay\(`            | Use `driver.waitForSelector()` instead             |
| Deprecated method   | `driver\.isElementPresent\(` | Use `driver.assertElementNotPresent()` with guards |
| Raw Selenium access | `driver\.driver\.`           | Use driver wrapper methods                         |
| JS test files       | `\.spec\.js$`                | Use TypeScript (`.spec.ts`)                        |

## Warning

| Pattern               | Regex                              | Comment                      |
| --------------------- | ---------------------------------- | ---------------------------- |
| CSS/ID selectors      | `(click\|find)Element\(['"][\.\#]` | Use `data-testid` attributes |
| "should" in test name | `it\(\s*['"]should\s`              | Use action-based names       |
| Multiple behaviors    | `it\(\s*['"][^'"]*\s+and\s+`       | Split into focused tests     |
| setTimeout            | `setTimeout\(`                     | Use driver wait methods      |
