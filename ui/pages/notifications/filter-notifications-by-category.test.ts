import {
  TRIGGER_TYPES,
  type INotification,
} from '@metamask/notification-services-controller/notification-services';
import { NotificationCategoryId } from './notification-categories-types';
import { filterNotificationsByCategory } from './notifications';

const buildNotification = (type: TRIGGER_TYPES) =>
  ({
    id: `${type}-notification`,
    createdAt: new Date().toISOString(),
    isRead: false,
    type,
  }) as unknown as INotification;

describe('filterNotificationsByCategory', () => {
  const walletActivityNotification = buildNotification(
    TRIGGER_TYPES.ETH_SENT,
  );
  const marketingNotification = buildNotification(
    TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
  );
  const notifications = [walletActivityNotification, marketingNotification];

  it('returns every notification for the All category', () => {
    expect(
      filterNotificationsByCategory(NotificationCategoryId.All, notifications),
    ).toEqual(notifications);
  });

  it('returns only notifications matching the selected category', () => {
    expect(
      filterNotificationsByCategory(
        NotificationCategoryId.WalletActivity,
        notifications,
      ),
    ).toEqual([walletActivityNotification]);

    expect(
      filterNotificationsByCategory(
        NotificationCategoryId.Marketing,
        notifications,
      ),
    ).toEqual([marketingNotification]);

    expect(
      filterNotificationsByCategory(NotificationCategoryId.Perps, notifications),
    ).toEqual([]);
  });
});
