# Sidepanel Implementation Documentation

## Overview

The MetaMask extension supports Chrome's Side Panel API, allowing users to access MetaMask in a persistent side panel instead of the traditional popup window. This provides a better user experience with a larger, always-accessible interface.

## Table of Contents

1. [Architecture](#architecture)
2. [Feature Flag & Browser Support](#feature-flag--browser-support)
3. [Manifest Configuration](#manifest-configuration)
4. [Background Script Implementation](#background-script-implementation)
5. [UI Implementation](#ui-implementation)
6. [State Management](#state-management)
7. [User Preferences](#user-preferences)
8. [Browser Compatibility](#browser-compatibility)
9. [Key Files](#key-files)

---

## Architecture

The sidepanel implementation consists of several key components:

1. **Manifest Configuration**: Defines the sidepanel entry point
2. **Background Script**: Manages sidepanel behavior and preferences
3. **UI Components**: Handle sidepanel detection and user interactions
4. **State Management**: Stores user preferences for sidepanel vs popup
5. **Environment Detection**: Identifies when running in sidepanel context

### Environment Types

The environment type is determined by parsing the URL pathname. When the pathname is `/sidepanel.html`, it returns `ENVIRONMENT_TYPE_SIDEPANEL` (see `app/scripts/lib/util.ts`).

---

## Feature Flag & Browser Support

### Feature Flag

The sidepanel feature is controlled by the `IS_SIDEPANEL` environment variable, which must be set to `'true'` during the build process.

### Browser Support Detection

The `getIsSidePanelFeatureEnabled()` function (located in `shared/modules/environment.ts`) performs comprehensive browser support detection:

1. **Build Flag Check**: Verifies `IS_SIDEPANEL === 'true'`
2. **API Existence Check**: Checks if `chrome.sidePanel` API exists (Firefox and Opera don't have it)
3. **Arc Browser Detection**: Detects Arc browser via CSS variable `--arc-palette-title` and disables feature (API exists but doesn't work properly)

**Supported Browsers:**

- ✅ Chrome 115+ (Manifest V3)
- ✅ Edge (Chromium-based)
- ✅ Brave (Chromium-based)

**Unsupported Browsers:**

- ❌ Firefox (no sidePanel API)
- ❌ Opera (uses `sidebarAction` API instead of `sidePanel` API - not implemented in MetaMask)
- ❌ Arc Browser (API exists but doesn't work properly)

### React Hook for Sidepanel Detection

The `useSidePanelEnabled()` hook (located in `ui/hooks/useSidePanelEnabled.ts`) provides easy access to sidepanel feature status. It wraps `getIsSidePanelFeatureEnabled()` and returns `false` for Firefox, Opera, and Arc browser.

### Runtime Browser Support Check

The `useBrowserSupportsSidePanel()` hook (located in `ui/hooks/useBrowserSupportsSidePanel.ts`) performs a runtime check for browsers that claim to support sidepanel but don't work properly (like Arc). It queries for sidepanel contexts using `chrome.runtime.getContexts()` to verify the API actually works.

---

## Manifest Configuration

The sidepanel is configured in the Chrome Manifest V3 (`app/manifest/v3/chrome.json`) with `side_panel.default_path` set to `"sidepanel.html"`. This configuration:

- Defines `sidepanel.html` as the entry point
- Requires Chrome 115+ (specified by `minimum_chrome_version`)
- Only applies to Manifest V3 builds (Chrome/Edge/Brave, not Opera)

### Sidepanel HTML Entry Point

The sidepanel HTML file (`app/html/pages/sidepanel.html`) is minimal and uses the same structure as other MetaMask pages, including standard head and body partials.

---

## Background Script Implementation

### Initialization

The `initSidePanelBehavior()` function (located in `app/scripts/background.js`) initializes sidepanel behavior on startup. It:

- Only runs if feature flag is enabled and browser supports sidePanel API
- Waits for controller initialization
- Gets user preference (`useSidePanelAsDefault`, defaults to `false`)
- Sets panel behavior via `browser.sidePanel.setPanelBehavior({ openPanelOnActionClick })`

### Preference Listener

The background script listens for preference changes via `PreferencesController:stateChange` events and updates sidepanel behavior dynamically using `browser.sidePanel.setPanelBehavior()`.

### Sidepanel Connection Tracking

The background script tracks when the sidepanel is open using a `sidePanelIsOpen` boolean flag. When a sidepanel connection is established (detected via `ENVIRONMENT_TYPE_SIDEPANEL`), it sets the flag to `true` and registers a cleanup callback that sets it to `false` when the connection closes. This tracking is used to determine if MetaMask is open.

---

## UI Implementation

### Environment Detection in UI

Components detect if they're running in sidepanel context by comparing `getEnvironmentType()` with `ENVIRONMENT_TYPE_SIDEPANEL` constant.

### Toggling Between Popup and Sidepanel

The `toggleDefaultView()` function (located in `ui/components/multichain/global-menu/global-menu.tsx`) handles switching between popup and sidepanel:

**When switching from sidepanel to popup:**

- Sets preference to `false`
- Closes the sidepanel window

**When switching from popup to sidepanel:**

- Opens sidepanel first using `browser.sidePanel.open()`
- Waits 500ms and verifies sidepanel opened using `chrome.runtime.getContexts()`
- Only sets preference if sidepanel successfully opened (fail-fast approach)
- Closes popup after successful sidepanel open
- Handles Arc browser edge case where API exists but doesn't work

### Onboarding Flow

During onboarding (in `ui/pages/onboarding-flow/creation-successful/creation-successful.tsx`), new users are redirected to use sidepanel. The flow:

- Checks if sidepanel is enabled
- Opens sidepanel using `browser.sidePanel.open()` with current window ID
- Sets `useSidePanelAsDefault` preference to `true`
- Dispatches `setCompletedOnboardingWithSidepanel()` action
- Falls back to regular onboarding if sidepanel open fails

### Sidepanel-Specific Styling

The routes component applies `app--sidepanel` CSS class when running in sidepanel context. The settings page (`ui/pages/settings/index.scss`) includes sidepanel-specific styles that apply popup layout regardless of viewport width and handle back button, close button, and logo display.

---

## State Management

### Redux Actions

Key actions for sidepanel preferences (located in `ui/store/actions.ts`):

- **`setUseSidePanelAsDefault(value: boolean)`**: Sets the user preference for sidepanel vs popup
- **`setCompletedOnboardingWithSidepanel()`**: Thunk action that completes onboarding when sidepanel is used
- **`completeOnboardingWithSidepanel()`**: Action creator that dispatches `COMPLETE_ONBOARDING_WITH_SIDEPANEL` action

### Preferences Controller State

The preference is stored in `PreferencesController`:

- **Key**: `useSidePanelAsDefault`
- **Type**: `boolean`
- **Default**: `false`
- **Purpose**: Controls whether clicking the extension icon opens sidepanel or popup

### App State Controller

The `AppStateController` tracks `sidePanelGasPollTokens: string[]` to allow the gas fee controller to track which environment is requesting gas fee updates.

---

## User Preferences

### Setting Preference

Users can toggle between sidepanel and popup via:

1. **Global Menu**: Settings → "Switch to Side Panel" / "Switch to Popup"
2. **Onboarding**: Option to use sidepanel during initial setup

### Preference Behavior

When `useSidePanelAsDefault` is `true`:

- Clicking the extension icon opens the sidepanel
- Background script calls `browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`

When `useSidePanelAsDefault` is `false`:

- Clicking the extension icon opens the popup (default behavior)
- Background script calls `browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })`

---

## Browser Compatibility

### Type Definitions

Since `webextension-polyfill` doesn't include sidePanel API types yet, custom types are defined in `shared/types/sidepanel.ts`. The `BrowserWithSidePanel` type augments the browser type with optional `sidePanel` property containing `open()` method and `onClosed` event listeners.

### Browser Detection

**Firefox:**

- No `chrome.sidePanel` API
- Feature automatically disabled
- Falls back to popup behavior

**Opera:**

- Uses a different extension API model despite being Chromium-based
- **Uses `chrome.sidebarAction` API instead of `chrome.sidePanel` API**
- MetaMask currently only checks for `chrome.sidePanel` API (see `shared/modules/environment.ts`)
- Since Opera's `sidebarAction` API hasn't been implemented in MetaMask, sidepanel doesn't work for Opera
- Detected via user agent string containing `'OPR'` (see `app/scripts/lib/util.ts`)
- Feature automatically disabled via API check (fails because `chrome.sidePanel` doesn't exist)
- Falls back to popup behavior
- **Note**: To support Opera, MetaMask would need to implement `chrome.sidebarAction` API separately

**Arc Browser:**

- Has `chrome.sidePanel` API but doesn't work properly
- Detected via CSS variable `--arc-palette-title`
- Feature disabled to prevent broken behavior

**Chrome/Edge/Brave:**

- Full support for sidepanel
- API works as expected

---

## Key Files

### Core Implementation Files

| File                            | Purpose                                                  |
| ------------------------------- | -------------------------------------------------------- |
| `app/manifest/v3/chrome.json`   | Manifest configuration for sidepanel                     |
| `app/html/pages/sidepanel.html` | Sidepanel HTML entry point                               |
| `app/scripts/background.js`     | Background script initialization and preference handling |
| `shared/modules/environment.ts` | Browser support detection                                |
| `shared/types/sidepanel.ts`     | TypeScript type definitions                              |
| `app/scripts/lib/util.ts`       | Environment type detection                               |

### UI Components

| File                                                                   | Purpose                                 |
| ---------------------------------------------------------------------- | --------------------------------------- |
| `ui/hooks/useSidePanelEnabled.ts`                                      | React hook for feature detection        |
| `ui/hooks/useBrowserSupportsSidePanel.ts`                              | Runtime browser support check           |
| `ui/components/multichain/global-menu/global-menu.tsx`                 | Toggle between popup/sidepanel          |
| `ui/pages/onboarding-flow/creation-successful/creation-successful.tsx` | Onboarding sidepanel option             |
| `ui/pages/routes/routes.component.tsx`                                 | Route handling with sidepanel detection |
| `ui/pages/settings/index.scss`                                         | Sidepanel-specific styles               |

### State Management

| File                                                | Purpose                                   |
| --------------------------------------------------- | ----------------------------------------- |
| `ui/store/actions.ts`                               | Redux actions for sidepanel preferences   |
| `app/scripts/controllers/preferences-controller.ts` | Stores `useSidePanelAsDefault` preference |
| `app/scripts/controllers/app-state-controller.ts`   | Tracks sidepanel polling tokens           |

### Constants

| File                      | Purpose                               |
| ------------------------- | ------------------------------------- |
| `shared/constants/app.ts` | `ENVIRONMENT_TYPE_SIDEPANEL` constant |

---

## Summary

The sidepanel implementation provides a modern, persistent interface for MetaMask users on supported browsers. Key features:

1. **Feature Flag Controlled**: Enabled via `IS_SIDEPANEL` build flag
2. **Browser Detection**: Automatically detects and handles unsupported browsers
3. **User Preference**: Users can toggle between popup and sidepanel
4. **Seamless Integration**: Works with existing MetaMask architecture
5. **Robust Error Handling**: Handles edge cases like Arc browser gracefully

The implementation follows MetaMask's architecture patterns, using controllers for state management, Redux for UI state, and proper TypeScript typing throughout.

---

## Future Considerations

### Opera Support

Opera uses a different API (`chrome.sidebarAction`) instead of Chrome's `chrome.sidePanel` API. To add Opera support in the future, the following would need to be implemented:

1. **Detect Opera browser** - Already done via user agent check (`'OPR'` in `app/scripts/lib/util.ts`)
2. **Implement `chrome.sidebarAction` API support** - Similar functionality to `chrome.sidePanel` but with Opera-specific methods
3. **Update browser detection logic** - Check for `chrome.sidebarAction` when Opera is detected
4. **Update manifest configuration** - Opera may require different manifest entries for sidebar support
5. **Test Opera-specific behavior** - Ensure sidebar functionality works correctly in Opera's implementation

**Current Status**: Opera support is not implemented. The codebase checks for `chrome.sidePanel` API, which Opera doesn't provide, causing sidepanel to be disabled for Opera users.

---

## E2E Testing

### Overview

**There are no dedicated E2E tests specifically for sidepanel functionality.** Instead, existing E2E tests adapt to work with sidepanel when it's enabled via the `IS_SIDEPANEL` build flag. Tests detect sidepanel builds and adjust their behavior accordingly.

### How E2E Tests Detect Sidepanel

Tests check if sidepanel is enabled using the `isSidePanelEnabled()` helper function (located in `test/e2e/helpers.js`). This function:

- Only returns `true` for Chrome (`SELENIUM_BROWSER === 'chrome'`)
- Requires `IS_SIDEPANEL === 'true'` build flag
- Returns `false` for Firefox (no sidepanel support)

### Post-Onboarding Navigation Helper

The main sidepanel-specific helper is `handleSidepanelPostOnboarding()` (located in `test/e2e/page-objects/flows/onboarding.flow.ts`). This function:

- Only runs when sidepanel is enabled on Chrome
- Waits 2 seconds for onboarding completion to process
- Navigates the test window directly to `home.html` to continue testing

**Why This Helper Exists:**

- When sidepanel is enabled, clicking "Done" during onboarding opens the home page in the sidepanel
- The main test window remains on the onboarding completion page
- This helper ensures the test window navigates to the home page to continue testing

### Test Adaptations

Tests adapt their behavior when sidepanel is detected:

1. **Window Switching**: Tests use URL-based switching (`switchToWindowWithUrl`) instead of title-based switching, as window titles may not be reliable with sidepanel.

2. **Network Request Counting**: Some tests skip request count assertions because sidepanel loads `home.html` in parallel with the main test window, making accurate counting difficult.

3. **State Persistence**: Tests that rely on state persistence across page reloads may skip certain flows, as appState can be lost during reloads with sidepanel.

4. **Toast Notifications**: Some tests skip toast notification checks, as they may not appear reliably in sidepanel context.

5. **Onboarding Complete**: The onboarding complete page doesn't wait for the button to disappear when sidepanel is enabled, since clicking "Done" opens a new window (sidepanel) instead of navigating in the current window.

### Running E2E Tests with Sidepanel

To run E2E tests with sidepanel enabled:

```bash
# Build test build with sidepanel flag
IS_SIDEPANEL=true yarn build:test

# Run E2E tests (sidepanel is automatically detected)
yarn test:e2e:chrome

# Or run a specific test
yarn test:e2e:single test/e2e/tests/onboarding/onboarding.spec.ts --browser=chrome
```

### Current Testing Strategy

**What Works:**

- ✅ Tests detect sidepanel builds and adapt behavior
- ✅ Post-onboarding navigation is handled
- ✅ Window switching works with URL-based approach
- ✅ Most core functionality tests pass with sidepanel

**What's Limited:**

- ⚠️ No dedicated sidepanel-specific test coverage
- ⚠️ Some tests skip assertions/flows when sidepanel is enabled
- ⚠️ State persistence tests may be unreliable
- ⚠️ Network request counting is skipped

**Future Improvements:**

- Add dedicated sidepanel E2E tests
- Improve state persistence handling
- Better window management for sidepanel scenarios
- More reliable toast/notification testing
