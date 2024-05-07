import { TRIGGER_TYPES } from '../constants/notification-schema';
import { createMockFeatureAnnouncementRaw } from '../mocks/mock-feature-announcements';
import { createMockNotificationEthSent } from '../mocks/mock-raw-notifications';
import { processNotification } from './process-notifications';

describe('process-notifications - processNotification()', () => {
  // More thorough tests are found in the specific process
  test('Maps Feature Announcement to shared Notification Type', () => {
    const result = processNotification(createMockFeatureAnnouncementRaw());
    expect(result).toBeDefined();
  });

  // More thorough tests are found in the specific process
  test('Maps On Chain Notification to shared Notification Type', () => {
    const result = processNotification(createMockNotificationEthSent());
    expect(result).toBeDefined();
  });

  test('Throws on invalid notification to process', () => {
    const rawNotification = createMockNotificationEthSent();

    // Testing Mock with invalid notification type
    rawNotification.type = 'FAKE_NOTIFICATION_TYPE' as TRIGGER_TYPES.ETH_SENT;

    expect(() => processNotification(rawNotification)).toThrow();
  });
});
