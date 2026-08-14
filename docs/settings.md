# Settings

This document explains how to add or update Settings pages in the extension.

## Ownership

Core UX owns Settings, including the Settings root, tabs, sub-pages, search, route registry, and shared Settings components.

The exception is onboarding. Settings-like screens that are part of onboarding pages or onboarding default-configuration flows are owned by the onboarding area, not Core UX.

## Key Files

- `ui/pages/settings/settings-registry.ts`: single source of truth for Settings routes, tabs, labels, icons, and page components.
- `ui/pages/settings/search-config.ts`: searchable Settings items and sub-page search entries.
- `ui/pages/settings/shared/`: reusable Settings building blocks such as `SettingsTab`, `createToggleItem`, `createSelectItem`, and shared row components.
- `ui/pages/settings/<tab-name>/`: tab and sub-page implementations.
- `ui/helpers/constants/routes.ts`: Settings route constants.
- `app/_locales/en/messages.json`: user-facing Settings copy.

## Adding a New Setting Item

1. Pick the owning Settings tab and add the item to that tab's item list, for example `TRANSACTION_SETTING_ITEMS` in `ui/pages/settings/transactions-tab/transactions-tab.tsx`.
2. Use an existing shared factory when possible:
   - Use `createToggleItem` for a boolean setting.
   - Use `createSelectItem` for a setting that links to a sub-page list and shows the selected value.
   - Use a custom component only when the setting needs richer layout, async state, nested navigation, or custom side effects.
3. Add or reuse selectors and actions for the setting state. Keep persisted controller state changes covered by the relevant controller migration and tests when the state shape changes.
4. Add title and description strings to `app/_locales/en/messages.json`.
5. Add the setting ID and title key to `ui/pages/settings/search-config.ts` so Settings search can find it.
6. Add or update colocated tests for the tab or item.

## Adding a New Settings Sub-Page

1. Add a route constant in `ui/helpers/constants/routes.ts`.
2. Add an entry to `SETTINGS_ROUTES` in `ui/pages/settings/settings-registry.ts` with:
   - `labelKey`
   - `parentPath`
   - `component: mmLazy(() => import(...))`
3. Create the sub-page component under the appropriate `ui/pages/settings/<tab-name>/` directory.
4. Add search entries in `ui/pages/settings/search-config.ts` if users should be able to find the sub-page or its rows.
5. Add tests for route metadata, rendering, search, and any state updates.

## Adding a New Settings Tab

1. Add a route constant in `ui/helpers/constants/routes.ts`.
2. Add a `SETTINGS_ROUTES` entry with `isTab: true`, an `iconName`, a `labelKey`, and a lazy component.
3. Place the route in `SETTINGS_ROOT_SECTIONS` so the Settings root groups it correctly.
4. Add a tab component under `ui/pages/settings/<tab-name>/`.
5. Add a `*_ITEMS` record and a `SETTINGS_SEARCH_CONFIG` entry in `ui/pages/settings/search-config.ts`; `tabId` must match the last segment of the tab route path.
6. Add tests for registry order, root grouping, search, and the tab UI.

## Review Checklist

- Confirm Core UX is included as owner or reviewer unless the change is in onboarding.
- Confirm Settings search finds the new item or sub-page.
- Confirm labels, descriptions, and test IDs are stable and localized.
- Confirm any metric for `MetaMetricsEventName.SettingsUpdated` uses the expected property name.
- Confirm Settings works in popup, full-screen, and sidepanel layouts.
- Confirm in full-screen that route urls are as expected.
