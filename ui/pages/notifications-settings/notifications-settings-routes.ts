import {
  NOTIFICATIONS_SETTINGS_AGENTIC_CLI_ROUTE,
  NOTIFICATIONS_SETTINGS_MARKETING_ROUTE,
  NOTIFICATIONS_SETTINGS_PERPS_ROUTE,
  NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
} from '../../helpers/constants/routes';
import type { NotificationsSettingsSectionType } from './notifications-settings-types';

export const NOTIFICATIONS_SETTINGS_SECTION_ROUTES: Record<
  NotificationsSettingsSectionType,
  string
> = {
  walletActivity: NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
  perps: NOTIFICATIONS_SETTINGS_PERPS_ROUTE,
  marketing: NOTIFICATIONS_SETTINGS_MARKETING_ROUTE,
  agenticCli: NOTIFICATIONS_SETTINGS_AGENTIC_CLI_ROUTE,
};

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
