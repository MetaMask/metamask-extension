import { PRIVACY_ROUTE, Route } from './route';

/**
 * Where a `privacy` deeplink lands when no `setting` is given, or when the one
 * given isn't recognised.
 */
export const DEFAULT_SETTING_ANCHOR = 'metametrics';

/**
 * Accepted `setting` query param values. Each doubles as the settings item id
 * declared in `ui/pages/settings/privacy-tab/privacy-tab.tsx`, which the
 * settings page scrolls into view via the URL hash.
 */
export const SETTING_ANCHORS = new Set([
  DEFAULT_SETTING_ANCHOR,
  'data-collection',
]);

/**
 * Deeplink to the Privacy & Security settings tab, scrolled to a specific
 * setting.
 *
 * Supported URL formats:
 * - https://link.metamask.io/privacy
 * - https://link.metamask.io/privacy?setting=metametrics
 * - https://link.metamask.io/privacy?setting=data-collection
 *
 * Unknown or missing `setting` values fall back to the MetaMetrics toggle so
 * stale links still land on the privacy settings page.
 */
export const privacy = new Route({
  pathname: '/privacy',
  getTitle: (_: URLSearchParams) => 'deepLink_thePrivacySettingsPage',
  handler: function handler(params: URLSearchParams) {
    const setting = params.get('setting') ?? '';
    const anchor = SETTING_ANCHORS.has(setting)
      ? setting
      : DEFAULT_SETTING_ANCHOR;
    return {
      path: `${PRIVACY_ROUTE}#${anchor}`,
      query: new URLSearchParams(),
    };
  },
});
