import { NOTIFICATIONS_SETTINGS_SECTION_ROUTES } from '../../helpers/constants/routes';
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
