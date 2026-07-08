import { NOTIFICATIONS_SETTINGS_SECTION_ROUTE } from '../../helpers/constants/routes';
import type { NotificationsSettingsSectionType } from './notifications-settings-types';

export function getNotificationsSettingsSectionRoute(
  sectionType: NotificationsSettingsSectionType,
): string {
  return NOTIFICATIONS_SETTINGS_SECTION_ROUTE.replace(
    ':sectionType',
    sectionType,
  );
}
