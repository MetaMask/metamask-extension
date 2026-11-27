# Interestfor Polyfill Firefox Manual Test

## Background

This test verifies that the interestfor polyfill works correctly with the LavaMoat policy overrides that restrict three unnecessary globals:

- `InterestEvent` (write)
- `interestForPolyfillInstalled` (write)
- `interestForUsePolyfillAlways` (read)

## Test Steps

### 1. Load Extension in Firefox

```bash
# Build Firefox MV2 version
yarn build:test:mv2

# In Firefox:
# 1. Open about:debugging#/runtime/this-firefox
# 2. Click "Load Temporary Add-on"
# 3. Navigate to dist/firefox/ and select manifest.json
```

### 2. Open Browser Console

- Press Ctrl+Shift+J (or Cmd+Opt+J on Mac)
- Check for LavaMoat policy errors
- Expected: No errors related to "LavaMoat", "policy", or "interestfor"

### 3. Test Interestfor Polyfill

#### Option A: Use test-interestfor.html

1. Open `test-interestfor.html` in Firefox
2. Observe the test results on the page
3. Hover the button to trigger the interestfor event
4. Expected results:
   - ✅ No LavaMoat errors
   - ✅ Polyfill loads (optional: interestForPolyfillInstalled flag may be present)
   - ✅ Interest event fires on hover
   - ✅ Popover opens when button is hovered

#### Option B: Test in Extension UI

1. Open MetaMask extension popup
2. Navigate to a page with interestfor usage:
   - **Transaction Status**: Go to activity, click a transaction
     - Hover the status button (e.g., "Confirmed")
     - Expected: Tooltip/popover appears with transaction details
   - **Ramps Quote Display**: Go to Buy/Sell flow
     - Look for warning icons with interestfor
     - Hover to see warning messages
3. Check browser console for errors

## Expected Results

### ✅ Success Criteria

- No LavaMoat policy errors in console
- Polyfill loads successfully
- Hovering elements with `interestfor` attribute fires `interest` events
- Popovers open in response to hover
- No runtime errors related to `InterestEvent`, `interestForPolyfillInstalled`, or `interestForUsePolyfillAlways`

### ❌ Failure Indicators

- Console errors mentioning "LavaMoat" or "policy violation"
- Popovers fail to open on hover
- JavaScript errors referencing the restricted globals
- Extension fails to load

## Notes

- Firefox does not have native Interest Invokers support, so the polyfill always loads
- The three restricted globals are not needed for the polyfill to function
- Testing confirms that the LavaMoat overrides successfully restrict these globals without breaking functionality
