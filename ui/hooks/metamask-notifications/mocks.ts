import type { Hex } from '@metamask/utils';
import type { NotificationPreferences } from '@metamask/authenticated-user-storage';

export const createMockNotificationPreferences = (
  overrides: Partial<NotificationPreferences> = {},
): NotificationPreferences => ({
  walletActivity: {
    pushNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
    accounts: [
      {
        address: '0x1111111111111111111111111111111111111111' as Hex,
        enabled: true,
      },
      {
        address: '0x2222222222222222222222222222222222222222' as Hex,
        enabled: true,
      },
      {
        address: '0x3333333333333333333333333333333333333333' as Hex,
        enabled: true,
      },
    ],
    ...overrides.walletActivity,
  },
  marketing: {
    pushNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
    ...overrides.marketing,
  },
  perps: {
    pushNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
    ...overrides.perps,
  },
  socialAI: {
    pushNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
    mutedTraderProfileIds: [],
    ...overrides.socialAI,
  },
  agenticCli: {
    pushNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
    ...overrides.agenticCli,
  },
  priceAlerts: {
    pushNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
    ...overrides.priceAlerts,
  },
});
