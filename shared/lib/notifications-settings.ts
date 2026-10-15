export const NOTIFICATIONS_SETTINGS_ROUTE = '/settings/notifications';
export const NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE = `${NOTIFICATIONS_SETTINGS_ROUTE}/wallet-activity`;
export const NOTIFICATIONS_SETTINGS_PERPS_ROUTE = `${NOTIFICATIONS_SETTINGS_ROUTE}/perps`;
export const NOTIFICATIONS_SETTINGS_MARKETING_ROUTE = `${NOTIFICATIONS_SETTINGS_ROUTE}/marketing`;
export const NOTIFICATIONS_SETTINGS_AGENTIC_CLI_ROUTE = `${NOTIFICATIONS_SETTINGS_ROUTE}/agentic-cli`;

// Deep-link input must not resolve inherited properties such as `constructor`.
export const NOTIFICATIONS_SETTINGS_SECTION_ROUTES = Object.assign(
  Object.create(null) as object,
  {
    walletActivity: NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
    perps: NOTIFICATIONS_SETTINGS_PERPS_ROUTE,
    marketing: NOTIFICATIONS_SETTINGS_MARKETING_ROUTE,
    agenticCli: NOTIFICATIONS_SETTINGS_AGENTIC_CLI_ROUTE,
  } as const,
);

export type NotificationsSettingsSectionType =
  keyof typeof NOTIFICATIONS_SETTINGS_SECTION_ROUTES;

export enum NotificationsSettingsQueryParams {
  Section = 'section',
}

/**
 * Resolves a section slug to its registered notification settings section.
 *
 * @param slug - The raw section slug, if any.
 * @returns The matching section type, or null when unsupported.
 */
export function getNotificationsSettingsSectionTypeFromSlug(
  slug: string | null | undefined,
): NotificationsSettingsSectionType | null {
  if (!slug) {
    return null;
  }

  const path = `${NOTIFICATIONS_SETTINGS_ROUTE}/${slug.trim().toLowerCase()}`;
  const entry = Object.entries(NOTIFICATIONS_SETTINGS_SECTION_ROUTES).find(
    ([, sectionRoute]) => sectionRoute === path,
  );
  return (entry?.[0] as NotificationsSettingsSectionType | undefined) ?? null;
}
