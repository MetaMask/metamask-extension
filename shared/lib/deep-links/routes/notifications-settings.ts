import { getIsPerpsIncludedInBuild } from '../../environment';
import {
  getNotificationsSettingsSectionTypeFromSlug,
  NotificationsSettingsQueryParams,
  NOTIFICATIONS_SETTINGS_ROUTE,
  NOTIFICATIONS_SETTINGS_SECTION_ROUTES,
} from '../../notifications-settings';
import { Route } from './route';

/**
 * Opens notification settings, or an available preference section.
 * Unknown sections and sections unavailable in this build open the main page.
 */
export const notificationsSettings = new Route({
  pathname: '/notifications-settings',
  getTitle: (_: URLSearchParams) => 'deepLink_theNotificationsSettingsPage',
  handler: function handler(params: URLSearchParams) {
    const sectionType = getNotificationsSettingsSectionTypeFromSlug(
      params.get(NotificationsSettingsQueryParams.Section),
    );
    const path =
      sectionType && (sectionType !== 'perps' || getIsPerpsIncludedInBuild())
        ? NOTIFICATIONS_SETTINGS_SECTION_ROUTES[sectionType]
        : NOTIFICATIONS_SETTINGS_ROUTE;

    return { path, query: new URLSearchParams() };
  },
});
