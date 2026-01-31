# Fix Summary: Missing Carousel Slide Translation Keys (METAMASK-YH6C)

## Issue Description
The application was throwing errors when rendering carousel slides that were not from Contentful:
- `Unable to find value of key "slideBridgeDescription" for locale "en"`
- `Unable to find value of key "slideBridgeTitle" for locale "en"`
- `Unable to find value of key "slideSmartAccountUpgradeDescription" for locale "en"`
- `Unable to find value of key "slideSmartAccountUpgradeTitle" for locale "en"`
- `Insufficient number of substitutions for key "closeSlide" with locale "en"`

## Root Cause
The `StackCard` component (`ui/components/multichain/carousel/stack-card/stack-card.tsx`) distinguishes between Contentful and non-Contentful slides based on whether the slide ID starts with `contentful-`:

```typescript
const isContentfulContent = slide.id.startsWith('contentful-');
```

For non-Contentful slides, it attempts to translate the slide's title and description as i18n keys:

```typescript
{isContentfulContent ? slide.title : t(slide.title)}
{isContentfulContent ? slide.description : t(slide.description)}
```

However, the translation keys for bridge and smart account upgrade slides were missing from the English locale file (`app/_locales/en/messages.json`), causing the i18n system to throw errors.

## Solution
Added the missing translation keys to `app/_locales/en/messages.json`:

### Added Keys:
1. **slideBridgeTitle**
   - Message: "Ready to bridge?"
   
2. **slideBridgeDescription**
   - Message: "Move across 9 chains, all within your wallet"
   
3. **slideSmartAccountUpgradeTitle**
   - Message: "Start using smart accounts"
   
4. **slideSmartAccountUpgradeDescription**
   - Message: "Same address, smarter features"

These keys were added alphabetically between `skipDeepLinkInterstitialDescription` and `slippage` (lines 7128-7139).

## Impact
- **Before**: Carousel slides for Bridge and Smart Account Upgrade features threw i18n errors when rendered
- **After**: All carousel slides render correctly with proper localized text
- The `closeSlide` aria label now works correctly as it receives properly translated slide titles as substitution parameters

## Files Changed
- `app/_locales/en/messages.json` - Added 4 new translation keys

## Testing
- JSON validation passed
- Lint checks passed (`yarn lint:changed:fix`)
- Translation keys follow the existing naming convention and structure

## Commit
```
commit 5baf173cec
fix: Add missing carousel slide translation keys

Add missing i18n translation keys for carousel slides that were causing
errors when non-Contentful slides were rendered:
- slideBridgeTitle
- slideBridgeDescription
- slideSmartAccountUpgradeTitle
- slideSmartAccountUpgradeDescription

These slides were being treated as i18n keys by the StackCard component
when their IDs didn't start with 'contentful-', but the translations
were missing from the English locale file.

Fixes METAMASK-YH6C
```

## References
- Issue: METAMASK-YH6C
- Component: `ui/components/multichain/carousel/stack-card/stack-card.tsx`
- Locale file: `app/_locales/en/messages.json`
