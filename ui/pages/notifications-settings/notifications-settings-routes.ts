import { NOTIFICATIONS_SETTINGS_SECTION_ROUTE } from '../../helpers/constants/routes';

export function getNotificationsSettingsSectionRoute(
  categoryId: string,
): string {
  return NOTIFICATIONS_SETTINGS_SECTION_ROUTE.replace(
    ':categoryId',
    categoryId,
  );
}
