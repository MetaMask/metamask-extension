import type { INotification } from '@metamask/notification-services-controller/notification-services';
import { ALL_NOTIFICATIONS_CATEGORY_ID } from './notification-categories-types';
import { filterNotificationsByCategory } from './notifications';

const buildNotification = (id: string, category?: string) =>
  ({
    id,
    createdAt: new Date().toISOString(),
    isRead: false,
    category,
  }) as unknown as INotification;

describe('filterNotificationsByCategory', () => {
  const walletActivityNotification = buildNotification(
    'wallet-activity-notification',
    'walletActivity',
  );
  const marketingNotification = buildNotification(
    'marketing-notification',
    'updatesAndRewards',
  );
  const uncategorizedNotification = buildNotification(
    'uncategorized-notification',
  );
  const notifications = [
    walletActivityNotification,
    marketingNotification,
    uncategorizedNotification,
  ];

  it('returns every notification for the All category', () => {
    expect(
      filterNotificationsByCategory(
        ALL_NOTIFICATIONS_CATEGORY_ID,
        notifications,
      ),
    ).toEqual(notifications);
  });

  it('returns only notifications whose BE-assigned category matches', () => {
    expect(
      filterNotificationsByCategory('walletActivity', notifications),
    ).toEqual([walletActivityNotification]);

    expect(
      filterNotificationsByCategory('updatesAndRewards', notifications),
    ).toEqual([marketingNotification]);

    expect(
      filterNotificationsByCategory('tradingActivity', notifications),
    ).toEqual([]);
  });
});
