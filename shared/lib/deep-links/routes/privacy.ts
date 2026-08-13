import { PRIVACY_ROUTE, Route } from './route';

/**
 * Maps the `setting` query param to the settings item ids declared in
 * `ui/pages/settings/privacy-tab/privacy-tab.tsx`. The settings page scrolls
 * the matching item into view via the URL hash.
 */
export const SETTING_ANCHORS: Record<string, string> = {
  metametrics: 'metametrics',
  'data-collection': 'data-collection',
};

export const DEFAULT_SETTING_ANCHOR = 'metametrics';

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
    const anchor =
      SETTING_ANCHORS[params.get('setting') ?? ''] ?? DEFAULT_SETTING_ANCHOR;
    return {
      path: `${PRIVACY_ROUTE}#${anchor}`,
      query: new URLSearchParams(),
    };
  },
});
