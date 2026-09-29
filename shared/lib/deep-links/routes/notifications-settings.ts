import { getIsPerpsIncludedInBuild } from '../../environment';
import {
  NOTIFICATIONS_SETTINGS_ROUTE,
  NOTIFICATIONS_SETTINGS_SECTION_ROUTES,
  Route,
} from './route';

/**
 * Opens notification settings, or an available preference section.
 * Unknown sections and sections unavailable in this build open the main page.
 */
export const notificationsSettings = new Route({
  pathname: NOTIFICATIONS_SETTINGS_ROUTE,
  getTitle: (_: URLSearchParams) => 'deepLink_theNotificationsSettingsPage',
  handler: function handler(params: URLSearchParams) {
    const section = params.get('section')?.trim().toLowerCase();
    const path =
      Object.values(NOTIFICATIONS_SETTINGS_SECTION_ROUTES).find(
        (route) =>
          route === `${NOTIFICATIONS_SETTINGS_ROUTE}/${section}` &&
          (section !== 'perps' || getIsPerpsIncludedInBuild()),
      ) ?? NOTIFICATIONS_SETTINGS_ROUTE;

    return { path, query: new URLSearchParams() };
  },
});
