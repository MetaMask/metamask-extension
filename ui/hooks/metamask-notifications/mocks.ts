import type { Hex } from '@metamask/utils';
import type { NotificationPreferences } from '@metamask/authenticated-user-storage';
import type { NotificationCategoryMetadata } from '../../pages/notifications/notification-categories-types';

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
});

export const createMockNotificationCategories =
  (): NotificationCategoryMetadata[] => [
    {
      categoryId: 'walletActivity',
      ausKeys: ['walletActivity'],
      label: 'Wallet activity',
      description: 'Buys, sells, transfers, and swaps',
      icon: 'Clock',
    },
    {
      categoryId: 'tradingActivity',
      ausKeys: ['perps'],
      label: 'Trading activity',
      description:
        'Perps position changes, liquidations, funding rates, and margin updates',
      icon: 'Candlestick',
    },
    {
      categoryId: 'tradingSignals',
      ausKeys: ['socialAI'],
      label: 'Trading signals',
      description:
        'Updates from traders and assets you follow, plus curated market news',
      icon: 'Flash',
    },
    {
      categoryId: 'updatesAndRewards',
      ausKeys: ['marketing'],
      label: 'Updates and rewards',
      description:
        'Product updates, feature announcements, and new rewards campaigns',
      icon: 'Megaphone',
    },
    {
      categoryId: 'agenticCli',
      ausKeys: ['agenticCli'],
      label: 'Agentic CLI',
      description:
        'CLI connection requests, approvals, and session updates for Agentic',
      icon: 'Code',
    },
  ];
