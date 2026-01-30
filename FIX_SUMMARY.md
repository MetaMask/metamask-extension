# Fix Summary: METAMASK-YH52

## Issue
Error: Insufficient number of substitutions for key "closeSlide" with locale "en" (occurred in: /notification.html)

## Root Cause
The `StackCard` component was passing `null` or `undefined` as a substitution value to the i18n `closeSlide` message when translation keys (like `slideDebitCardTitle`, `slideBridgeTitle`) didn't exist in the locale files.

### Technical Details
1. When `t(slide.title)` was called for non-contentful slides, it returned `null` if the translation key was missing
2. This `null` value was then passed as a substitution to `t('closeSlide', [null])`
3. The i18n `applySubstitutions` function detected the `null`/`undefined` substitution and threw the error

## Solution
Added fallback logic to ensure substitutions are never `null` or `undefined`:

```typescript
// Before:
ariaLabel={t('closeSlide', [
  isContentfulContent ? slide.title : t(slide.title),
])}

// After:
ariaLabel={t('closeSlide', [
  isContentfulContent ? slide.title : t(slide.title) || slide.title,
])}
```

Applied the same pattern to:
- Title rendering: `t(slide.title) || slide.title`
- Description rendering: `t(slide.description) || slide.description`
- aria-label substitution: `t(slide.title) || slide.title`

## Changes Made

### 1. Fixed `stack-card.tsx` (Lines 99, 108, 123)
Added fallback operators (`|| slide.title` and `|| slide.description`) to handle missing translations gracefully.

### 2. Added Comprehensive Tests (`stack-card.test.tsx`)
Created 11 test cases covering:
- Contentful and regular slide rendering
- Graceful handling of missing translations
- Close button functionality and aria-label handling
- Proper click event handling
- CSS class application

## Testing

### Unit Tests
```bash
✓ All carousel tests pass (18 tests)
✓ All i18n tests pass (19 tests)
✓ No console baseline violations
```

### Linting
```bash
✓ ESLint passed
✓ No linting errors
```

## Impact
- **User Impact**: Fixes error that was occurring when carousel slides with missing translations were displayed
- **Code Quality**: Improves robustness by handling edge cases gracefully
- **Backwards Compatible**: Yes, the fallback only activates when translations are missing

## Commits
1. `8fa8e64` - Fix i18n substitution error in StackCard component
2. `752267f` - Add comprehensive tests for StackCard component

## Branch
`error-insufficient-number-huebah`

## References
- Fixes METAMASK-YH52
- Related issues: Missing translation keys for `slideDebitCardTitle`, `slideBridgeTitle`, `slideDebitCardDescription`, `slideBridgeDescription`
