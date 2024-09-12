import { Mockttp, RequestRuleBuilder } from 'mockttp';
import {
  AuthenticationController,
  UserStorageController,
} from '@metamask/profile-sync-controller';
import {
  NotificationServicesController,
  NotificationsServicesPushController,
} from '@metamask/notification-services-controller';

const AuthMocks = AuthenticationController.Mocks;
const NotificationMocks = NotificationServicesController.Mocks;
const PushMocks = NotificationsServicesPushController.Mocks;

type MockResponse = {
  url: string | RegExp;
  requestMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  response: unknown;
};

/**
 * E2E mock setup for notification APIs (Auth, Storage, Notifications, Push Notifications)
 *
 * @param server - server obj used to mock our endpoints
 */
export function mockNotificationServices(server: Mockttp) {
  // Auth
  mockAPICall(server, AuthMocks.getMockAuthNonceResponse());
  mockAPICall(server, AuthMocks.getMockAuthLoginResponse());
  mockAPICall(server, AuthMocks.getMockAuthAccessTokenResponse());

  // Storage
  const NOTIFICATIONS_USER_STORAGE_ENDPOINT =
    'https://user-storage.api.cx.metamask.io/api/v1/userstorage/notifications';
  const NOTIFICATION_USER_STORAGE_ID =
    'd1d70f77627f7e33a42734be088b316e9f8762c00ab91c91996a5893640d259c';

  mockAPICall(server, {
    url: `${NOTIFICATIONS_USER_STORAGE_ENDPOINT}/${NOTIFICATION_USER_STORAGE_ID}`,
    requestMethod: 'GET',
    response: NotificationMocks.createMockFullUserStorage(),
  });

  mockAPICall(server, {
    url: `${NOTIFICATIONS_USER_STORAGE_ENDPOINT}/${NOTIFICATION_USER_STORAGE_ID}`,
    requestMethod: 'PUT',
    response: null,
  });

  // Notifications
  mockAPICall(server, NotificationMocks.getMockFeatureAnnouncementResponse());
  mockAPICall(server, NotificationMocks.getMockBatchCreateTriggersResponse());
  mockAPICall(server, NotificationMocks.getMockBatchDeleteTriggersResponse());
  mockAPICall(server, NotificationMocks.getMockListNotificationsResponse());
  mockAPICall(
    server,
    NotificationMocks.getMockMarkNotificationsAsReadResponse(),
  );
  // Push Notifications
  mockAPICall(server, PushMocks.getMockRetrievePushNotificationLinksResponse());
  mockAPICall(server, PushMocks.getMockUpdatePushNotificationLinksResponse());
  mockAPICall(server, PushMocks.getMockCreateFCMRegistrationTokenResponse());
  mockAPICall(server, PushMocks.getMockDeleteFCMRegistrationTokenResponse());

  mockAPICall(server, PushMocks.getMockDeleteFCMRegistrationTokenResponse());
}

function mockAPICall(server: Mockttp, response: MockResponse) {
  let requestRuleBuilder: RequestRuleBuilder | undefined;

  if (response.requestMethod === 'GET') {
    requestRuleBuilder = server.forGet(response.url);
  }

  if (response.requestMethod === 'POST') {
    requestRuleBuilder = server.forPost(response.url);
  }

  if (response.requestMethod === 'PUT') {
    requestRuleBuilder = server.forPut(response.url);
  }

  if (response.requestMethod === 'DELETE') {
    requestRuleBuilder = server.forDelete(response.url);
  }

  requestRuleBuilder?.thenCallback(() => ({
    statusCode: 200,
    json: response.response,
  }));
}
