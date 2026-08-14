/* eslint-disable @typescript-eslint/naming-convention */
import type { PushAnalyticsPayload } from '@metamask/notification-services-controller/push-services';
import { onPushNotificationClicked } from '.';

jest.mock('../../platforms/extension', () =>
  jest.fn().mockImplementation(() => ({
    getExtensionURL: jest
      .fn()
      .mockReturnValue('chrome-extension://id/home.html'),
  })),
);

const mockOpenWindow = jest.fn().mockResolvedValue(null);

beforeAll(() => {
  Object.assign(globalThis, { clients: { openWindow: mockOpenWindow } });
});

beforeEach(() => {
  mockOpenWindow.mockClear();
});

describe('onPushNotificationClicked', () => {
  const makeEvent = (notificationId = 'event-id'): NotificationEvent =>
    ({
      notification: {
        close: jest.fn(),
        data: { notification_id: notificationId },
      },
      waitUntil: jest.fn(),
    }) as unknown as NotificationEvent;

  it('uses provided payload notification_id for navigation', async () => {
    const event = makeEvent();
    const payload: PushAnalyticsPayload = {
      notification_id: 'payload-id',
      notification_type: 'wallet_activity',
      notification_subtype: 'eth_received',
    };

    await onPushNotificationClicked(event, payload);

    expect(event.notification.close).toHaveBeenCalled();
    expect(mockOpenWindow).toHaveBeenCalledWith(
      'chrome-extension://id/home.html#notifications/payload-id',
    );
  });

  it('falls back to event.notification.data when no payload given', async () => {
    const event = makeEvent('event-id');

    await onPushNotificationClicked(event);

    expect(event.notification.close).toHaveBeenCalled();
    expect(mockOpenWindow).toHaveBeenCalledWith(
      'chrome-extension://id/home.html#notifications/event-id',
    );
  });
});
