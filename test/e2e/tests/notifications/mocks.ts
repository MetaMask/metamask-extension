import { Mockttp, RequestRuleBuilder } from 'mockttp';
import { AuthenticationController } from '@metamask/profile-sync-controller';
import {
  NotificationServicesController,
  NotificationServicesPushController,
} from '@metamask/notification-services-controller';
import { UserStorageMockttpController } from '../../helpers/user-storage/userStorageMockttpController';

const AuthMocks = AuthenticationController.Mocks;
const NotificationMocks = NotificationServicesController.Mocks;
const PushMocks = NotificationServicesPushController.Mocks;

type MockResponse = {
  url: string | RegExp;
  requestMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  response: unknown;
};

/**
 * E2E mock setup for notification APIs (Auth, UserStorage, Notifications, Push Notifications, Profile syncing)
 *
 * @param server - server obj used to mock our endpoints
 * @param userStorageMockttpControllerInstance - optional instance of UserStorageMockttpController, useful if you need persisted user storage between tests
 */
export async function mockNotificationServices(
  server: Mockttp,
  userStorageMockttpControllerInstance: UserStorageMockttpController = new UserStorageMockttpController(),
) {
  // Auth
  mockAPICall(server, AuthMocks.getMockAuthNonceResponse());
  mockAPICall(server, AuthMocks.getMockAuthLoginResponse());
  mockAPICall(server, AuthMocks.getMockAuthAccessTokenResponse());

  // Storage
  if (!userStorageMockttpControllerInstance?.paths.get('accounts')) {
    userStorageMockttpControllerInstance.setupPath('accounts', server);
  }
  if (!userStorageMockttpControllerInstance?.paths.get('networks')) {
    userStorageMockttpControllerInstance.setupPath('networks', server);
  }
  if (!userStorageMockttpControllerInstance?.paths.get('notifications')) {
    userStorageMockttpControllerInstance.setupPath('notifications', server);
  }

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
