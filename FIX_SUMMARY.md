# Fix Summary: No Current Window Error in Service Worker

## Issue
**Error ID**: METAMASK-YG2J  
**Error Message**: "No current window"  
**Location**: `/scripts/app-init.js`

## Root Cause
Sentry's browser SDK, when initialized in a service worker context (MV3), attempts to access `globalThis.location` which doesn't exist in service workers. This causes the SDK to throw an "No current window" error during error reporting.

## Solution
Added a `globalThis.location` stub in the service worker context to provide the properties Sentry expects, preventing the error from occurring.

## Implementation Details

### Changed File
- `app/scripts/lib/setupSentry.js`

### Changes Made
Added a location stub in the `setSentryClient()` function:

```javascript
/**
 * In service worker context (MV3), there is no location object.
 * Sentry's browser SDK expects this object to exist and throws "No current window" error when it doesn't.
 * We create a minimal stub with the properties Sentry needs to prevent this error.
 */
if (!globalThis.location && isManifestV3) {
  globalThis.location = {
    origin: browser.runtime?.getURL('') ?? '',
    href: browser.runtime?.getURL('') ?? '',
    protocol: 'chrome-extension:',
    host: '',
    hostname: '',
    port: '',
    pathname: '/',
    search: '',
    hash: '',
  };
}
```

### Why This Works
1. The stub provides all standard `location` properties that Sentry might access
2. Uses `browser.runtime.getURL('')` to provide the extension's base URL as the origin
3. Follows the same pattern as existing workarounds for `globalThis.nw` and `globalThis.history`
4. Only applies in MV3 (service worker) context where location doesn't naturally exist

## Testing
- ✅ All existing unit tests pass
- ✅ Build completes successfully (`yarn build:test`)
- ✅ No linting errors
- ✅ Code follows existing patterns in the codebase

## Verification
The fix ensures that:
1. Sentry can initialize in service worker context without throwing errors
2. Error reporting continues to work normally
3. The `toMetamaskUrl()` function can safely access `globalThis.location.origin`
4. No existing functionality is broken

## Commit
- **Branch**: `error-no-current-aomj1y`
- **Commit**: `ca97c1d12e`
- **Status**: Pushed to remote
