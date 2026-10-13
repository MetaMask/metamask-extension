import {
  NOTIFICATIONS_SETTINGS_ROUTE,
  NOTIFICATIONS_SETTINGS_SECTION_ROUTES,
} from '../../helpers/constants/routes';
import type { NotificationsSettingsSectionType } from './notifications-settings-types';

export { NOTIFICATIONS_SETTINGS_SECTION_ROUTES } from '../../helpers/constants/routes';

export function getNotificationsSettingsSectionRoute(
  sectionType: NotificationsSettingsSectionType,
): string {
  return NOTIFICATIONS_SETTINGS_SECTION_ROUTES[sectionType];
}

const NOTIFICATIONS_SETTINGS_SECTION_ROUTE_BY_PATH = Object.fromEntries(
  Object.entries(NOTIFICATIONS_SETTINGS_SECTION_ROUTES).map(
    ([sectionType, path]) => [path, sectionType],
  ),
) as Record<string, NotificationsSettingsSectionType>;

export function getNotificationsSettingsSectionTypeFromPath(
  pathname: string,
): NotificationsSettingsSectionType | null {
  return NOTIFICATIONS_SETTINGS_SECTION_ROUTE_BY_PATH[pathname] ?? null;
}

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
  return getNotificationsSettingsSectionTypeFromPath(
    `${NOTIFICATIONS_SETTINGS_ROUTE}/${slug.trim().toLowerCase()}`,
  );
}
