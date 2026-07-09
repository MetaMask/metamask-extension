import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import { getNotificationCategoryId } from './get-notification-category-id';

const buildNotification = (overrides: Record<string, unknown>) =>
  ({
    id: 'notification-id',
    createdAt: new Date().toISOString(),
    isRead: false,
    type: TRIGGER_TYPES.PLATFORM,
    ...overrides,
  }) as never;

describe('getNotificationCategoryId', () => {
  it('reads the BE-assigned category field', () => {
    expect(
      getNotificationCategoryId(
        buildNotification({ category: 'tradingActivity' }),
      ),
    ).toBe('tradingActivity');
  });

  it('returns undefined when the notification has no category', () => {
    expect(getNotificationCategoryId(buildNotification({}))).toBeUndefined();
  });
});
