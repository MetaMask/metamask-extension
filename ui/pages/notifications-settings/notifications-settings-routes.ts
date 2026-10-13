import {
  NOTIFICATIONS_SETTINGS_ROUTE,
  NOTIFICATIONS_SETTINGS_SECTION_ROUTES,
} from '../../helpers/constants/routes';

import { getNotificationsSettingsSectionTypeFromSlug } from '../../../shared/lib/deep-links/routes/notifications-settings';
import type { NotificationsSettingsSectionType } from './notifications-settings-types';

export { NOTIFICATIONS_SETTINGS_SECTION_ROUTES } from '../../helpers/constants/routes';

export function getNotificationsSettingsSectionRoute(
  sectionType: NotificationsSettingsSectionType,
): string {
  return NOTIFICATIONS_SETTINGS_SECTION_ROUTES[sectionType];
}

export function getNotificationsSettingsSectionTypeFromPath(
  pathname: string,
): NotificationsSettingsSectionType | null {
  if (!pathname.startsWith(`${NOTIFICATIONS_SETTINGS_ROUTE}/`)) {
    return null;
  }
  return getNotificationsSettingsSectionTypeFromSlug(
    pathname.slice(NOTIFICATIONS_SETTINGS_ROUTE.length + 1),
  );
}
