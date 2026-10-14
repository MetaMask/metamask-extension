import { getIsPerpsIncludedInBuild } from '../../environment';
import {
  NOTIFICATIONS_SETTINGS_ROUTE,
  NOTIFICATIONS_SETTINGS_SECTION_ROUTES,
  type NotificationsSettingsSectionType,
  Route,
} from './route';

export enum NotificationsSettingsQueryParams {
  Section = 'section',
}

const NOTIFICATIONS_SETTINGS_SECTION_ROUTE_BY_PATH = new Map(
  Object.entries(NOTIFICATIONS_SETTINGS_SECTION_ROUTES).map(
    ([sectionType, path]): [string, NotificationsSettingsSectionType] => [
      path,
      sectionType as NotificationsSettingsSectionType,
    ],
  ),
);

/**
 * Resolves a `section` slug (e.g. from a deep-link query param) to a section
 * type. Accepts only kebab-case slugs matching a registered section route;
 * unknown, empty, or missing slugs resolve to null.
 *
 * @param slug - The raw slug value, if any.
 * @returns The matching section type, or null when unsupported.
 */
export function getNotificationsSettingsSectionTypeFromSlug(
  slug: string | null | undefined,
): NotificationsSettingsSectionType | null {
  if (!slug) {
    return null;
  }
  return (
    NOTIFICATIONS_SETTINGS_SECTION_ROUTE_BY_PATH.get(
      `${NOTIFICATIONS_SETTINGS_ROUTE}/${slug.trim().toLowerCase()}`,
    ) ?? null
  );
}

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
