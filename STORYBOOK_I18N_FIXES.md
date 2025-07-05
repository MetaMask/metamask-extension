# Storybook Translation Provider Error Fixes

## Overview

This document outlines the fixes implemented to resolve persistent translation provider errors in MetaMask's Storybook setup that were causing `g.trim is not a function` and `Cannot read properties of undefined (reading 'languages')` errors in stories using translations.

## Root Cause Analysis

### Primary Issues Identified

1. **Missing `localeMessages` Redux State Slice**
   - The `.storybook/test-data.js` file was missing the `localeMessages` slice entirely
   - Redux selectors (`getCurrentLocale`, `getCurrentLocaleMessages`, `getEnLocaleMessages`) were returning `undefined`
   - Components expecting translation data received `undefined`, causing `.trim()` calls on non-string values

2. **Insufficient Error Handling in I18n Provider**
   - The Storybook I18n provider didn't handle cases where locale data was missing or malformed
   - No fallback mechanisms when `getMessage` returned `null` or `undefined`
   - Missing try-catch blocks for translation errors

3. **Incomplete Redux Store Synchronization**
   - The Redux store wasn't being updated when users changed locales via Storybook's locale toolbar
   - Static locale data in Redux state didn't reflect the dynamic locale selection

## Implementation Details

### 1. Added Missing `localeMessages` State Slice

**File:** `.storybook/test-data.js`

```javascript
// Added to the state object before closing
localeMessages: {
  currentLocale: 'en',
  current: {},
  en: {},
},
```

**Purpose:** Provides the required Redux state structure that locale selectors expect.

### 2. Enhanced Redux Store Initialization

**File:** `.storybook/preview.js`

```javascript
// Populate localeMessages with actual locale data
const populatedTestData = {
  ...testData,
  localeMessages: {
    currentLocale: 'en',
    current: allLocales.en || {},
    en: allLocales.en || {},
  },
};

export const store = configureStore(populatedTestData);
```

**Purpose:** Ensures the Redux store is initialized with proper locale data instead of empty objects.

### 3. Improved I18n Provider Error Handling

**File:** `.storybook/i18n.js`

```javascript
export const I18nProvider = (props) => {
  const { currentLocale, current, en } = props;

  const t = useMemo(() => {
    return (key, ...args) => {
      // Ensure we have valid locale data
      const safeCurrentLocale = currentLocale || 'en';
      const safeCurrent = current || {};
      const safeEn = en || {};

      try {
        const result = getMessage(safeCurrentLocale, safeCurrent, key, ...args) ||
                      getMessage(safeCurrentLocale, safeEn, key, ...args);

        // If getMessage returns null or undefined, return a fallback
        if (result === null || result === undefined) {
          return `[${key}]`;
        }

        return result;
      } catch (error) {
        console.warn(`Translation error for key "${key}":`, error);
        return `[${key}]`;
      }
    };
  }, [currentLocale, current, en]);

  return (
    <I18nContext.Provider value={t}>{props.children}</I18nContext.Provider>
  );
};
```

**Key Improvements:**
- Added null/undefined safety checks for all locale parameters
- Implemented try-catch error handling
- Provides fallback display (`[keyName]`) for missing translations
- Added warning logs for debugging translation issues

### 4. Dynamic Redux Store Updates

**File:** `.storybook/preview.js`

```javascript
const metamaskDecorator = (story, context) => {
  // ... existing code ...

  const currentLocale = context.globals.locale;
  const current = allLocales[currentLocale] || allLocales.en || {};

  // Update Redux store with current locale data
  useEffect(() => {
    store.dispatch({
      type: 'SET_CURRENT_LOCALE',
      payload: {
        messages: current,
        locale: currentLocale,
      },
    });
  }, [currentLocale, current]);

  // ... rest of decorator ...
};
```

**Purpose:** Ensures Redux state stays in sync when users change locales via Storybook toolbar.

### 5. Enhanced Prop Safety

**File:** `.storybook/preview.js`

```javascript
<I18nProvider
  currentLocale={currentLocale || 'en'}
  current={current || {}}
  en={allLocales.en || {}}
>
```

**Purpose:** Provides fallback values to prevent undefined props being passed to the I18n provider.

## Testing Strategy

### Manual Testing Steps

1. **Basic Translation Functionality**
   ```bash
   npm run storybook
   ```
   - Navigate to any story that uses translations
   - Verify no console errors appear
   - Verify translations display correctly (not `[keyName]` fallbacks)

2. **Locale Switching**
   - Use Storybook's locale toolbar to switch between different languages
   - Verify translations update correctly
   - Verify no console errors during locale changes
   - Check that Redux state updates by inspecting Redux DevTools (if enabled)

3. **Error Scenarios**
   - Test with missing translation keys
   - Verify fallback display shows `[keyName]` instead of errors
   - Check console for appropriate warning messages

### Automated Testing Considerations

The fixes include console warnings that can be tested programmatically:

```javascript
// Example test for missing translation handling
expect(console.warn).toHaveBeenCalledWith(
  expect.stringContaining('Translation error for key'),
  expect.any(Error)
);
```

### Component-Level Testing

Stories using the following translation patterns should now work without errors:

```javascript
// useContext hook
const t = useContext(I18nContext);
const label = t('buttonLabel');

// Direct function calls
import { getMessage } from '../shared/modules/i18n';
const message = getMessage(locale, messages, 'key');

// Redux selectors
const currentLocaleMessages = useSelector(getCurrentLocaleMessages);
```

## Files Modified

1. **`.storybook/test-data.js`** - Added missing `localeMessages` state slice
2. **`.storybook/i18n.js`** - Enhanced error handling and fallback mechanisms
3. **`.storybook/preview.js`** - Improved Redux store initialization and dynamic updates

## Success Criteria

✅ **Primary Errors Resolved:**
- No more `g.trim is not a function` errors in Storybook console
- No more `Cannot read properties of undefined (reading 'languages')` errors

✅ **Functionality Verified:**
- All stories with translations render properly without console errors
- Translation switching works correctly via Storybook toolbar
- Missing translation keys show graceful fallbacks instead of errors
- Redux state properly reflects selected locale

✅ **Developer Experience:**
- Helpful console warnings for debugging translation issues
- Graceful degradation when translations are missing
- No breaking changes to existing story code

## Troubleshooting

### If Stories Still Show Translation Errors

1. **Check Locale Data Import**
   ```javascript
   // Verify in browser console
   console.log(allLocales.en); // Should show translation object
   ```

2. **Verify Redux State**
   ```javascript
   // Check Redux store state
   console.log(store.getState().localeMessages);
   ```

3. **Check Translation Key Usage**
   ```javascript
   // Ensure translation keys exist in messages.json
   const key = 'someTranslationKey';
   console.log(allLocales.en[key]); // Should show translation object
   ```

### Common Issues

- **Stale browser cache:** Hard refresh (Ctrl/Cmd + Shift + R) Storybook
- **Missing translation keys:** Check `app/_locales/en/messages.json` for the key
- **Invalid locale selection:** Verify locale exists in `localeList` in preview.js

## Future Improvements

1. **Enhanced Locale Coverage:** Ensure all supported locales have complete translation coverage
2. **Type Safety:** Add TypeScript types for translation keys to catch missing translations at build time
3. **Performance:** Consider lazy loading of locale data for better initial load times
4. **Testing:** Add automated tests for i18n functionality in Storybook context

## Additional Notes

- The fixes maintain backward compatibility with existing stories
- No changes required to individual story files
- The solution follows the existing application patterns for i18n handling
- Error boundaries remain in place for unexpected translation errors