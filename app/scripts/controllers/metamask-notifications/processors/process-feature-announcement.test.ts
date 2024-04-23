import { TRIGGER_TYPES } from '../constants/notification-schema';
import { createMockFeatureAnnouncementRaw } from '../mocks/mock-feature-announcements';
import {
  isFeatureAnnouncementRead,
  processFeatureAnnouncement,
} from './process-feature-announcement';

describe('process-feature-announcement - isFeatureAnnouncementRead()', () => {
  const MOCK_NOTIFICATION_ID = 'MOCK_NOTIFICATION_ID';

  test('Returns true if a given notificationId is within list of read platform notifications', () => {
    const notification = {
      id: MOCK_NOTIFICATION_ID,
      createdAt: new Date().toString(),
    };

    const result1 = isFeatureAnnouncementRead(notification, [
      'id-1',
      'id-2',
      MOCK_NOTIFICATION_ID,
    ]);
    expect(result1).toBe(true);

    const result2 = isFeatureAnnouncementRead(notification, ['id-1', 'id-2']);
    expect(result2).toBe(false);
  });

  test('Returns isRead if notification is older than 30 days', () => {
    const mockDate = new Date();
    mockDate.setDate(mockDate.getDate() - 31);

    const notification = {
      id: MOCK_NOTIFICATION_ID,
      createdAt: mockDate.toString(),
    };

    const result = isFeatureAnnouncementRead(notification, []);
    expect(result).toBe(true);
  });
});

describe('process-feature-announcement - processFeatureAnnouncement()', () => {
  test('Processes a Raw Feature Announcement to a shared Notification Type', () => {
    const rawNotification = createMockFeatureAnnouncementRaw();
    const result = processFeatureAnnouncement(rawNotification);

    expect(result.id).toBe(rawNotification.data.id);
    expect(result.type).toBe(TRIGGER_TYPES.FEATURES_ANNOUNCEMENT);
    expect(result.isRead).toBe(false);
    expect(result.data).toBeDefined();
  });
});
