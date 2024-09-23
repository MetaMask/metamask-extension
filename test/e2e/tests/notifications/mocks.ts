import { Mockttp, RequestRuleBuilder } from 'mockttp';
import { AuthenticationController } from '@metamask/profile-sync-controller';
import {
  NotificationServicesController,
  NotificationServicesPushController,
} from '@metamask/notification-services-controller';

const AuthMocks = AuthenticationController.Mocks;
const NotificationMocks = NotificationServicesController.Mocks;
const PushMocks = NotificationServicesPushController.Mocks;

type MockResponse = {
  url: string | RegExp;
  requestMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  response: unknown;
};

/**
 * E2E mock setup for notification APIs (Auth, Storage, Notifications, Push Notifications, Profile syncing)
 *
 * @param server - server obj used to mock our endpoints
 */
export async function mockNotificationServices(server: Mockttp) {
  // Auth
  mockAPICall(server, AuthMocks.getMockAuthNonceResponse());
  mockAPICall(server, AuthMocks.getMockAuthLoginResponse());
  mockAPICall(server, AuthMocks.getMockAuthAccessTokenResponse());

  // Storage
  const NOTIFICATIONS_USER_STORAGE_ENDPOINT =
    'https://user-storage.api.cx.metamask.io/api/v1/userstorage/notifications';
  const NOTIFICATION_USER_STORAGE_KEY =
    'df1d90e0a8c2c7c48a84cfc80c979b68c7e7d5624b89986a83a280ab92511bd4';
  mockAPICall(server, {
    url: `${NOTIFICATIONS_USER_STORAGE_ENDPOINT}/${NOTIFICATION_USER_STORAGE_KEY}`,
    requestMethod: 'GET',
    response: NotificationMocks.createMockFullUserStorage(),
  });

  mockAPICall(server, {
    url: `${NOTIFICATIONS_USER_STORAGE_ENDPOINT}/${NOTIFICATION_USER_STORAGE_KEY}`,
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
