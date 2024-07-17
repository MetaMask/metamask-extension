import { Mockttp, RequestRuleBuilder } from 'mockttp';
import {
  AuthenticationController,
  UserStorageController,
} from '@metamask/profile-sync-controller';
import {
  NotificationServicesController,
  NotificationsServicesPushController,
} from '@metamask/notification-services-controller';

type MockResponse = {
  url: string | RegExp;
  requestMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  response: unknown;
};

const {
  getMockFeatureAnnouncementResponse,
  getMockBatchCreateTriggersResponse,
  getMockBatchDeleteTriggersResponse,
  getMockListNotificationsResponse,
  getMockMarkNotificationsAsReadResponse,
} = NotificationServicesController.Mocks;

const {
  getMockRetrievePushNotificationLinksResponse,
  getMockUpdatePushNotificationLinksResponse,
  getMockCreateFCMRegistrationTokenResponse,
  getMockDeleteFCMRegistrationTokenResponse,
} = NotificationsServicesPushController.Mocks;

/**
 * E2E mock setup for notification APIs (Auth, Storage, Notifications, Push Notifications)
 *
 * @param server - server obj used to mock our endpoints
 */
export function mockNotificationServices(server: Mockttp) {
  // Auth
  mockAPICall(
    server,
    AuthenticationController.Mocks.getMockAuthNonceResponse(),
  );
  mockAPICall(
    server,
    AuthenticationController.Mocks.getMockAuthLoginResponse(),
  );
  mockAPICall(
    server,
    AuthenticationController.Mocks.getMockAuthAccessTokenResponse(),
  );

  // Storage
  mockAPICall(
    server,
    UserStorageController.Mocks.getMockUserStorageGetResponse(),
  );
  mockAPICall(
    server,
    UserStorageController.Mocks.getMockUserStoragePutResponse(),
  );

  // Notifications
  mockAPICall(server, getMockFeatureAnnouncementResponse());
  mockAPICall(server, getMockBatchCreateTriggersResponse());
  mockAPICall(server, getMockBatchDeleteTriggersResponse());
  mockAPICall(server, getMockListNotificationsResponse());
  mockAPICall(server, getMockMarkNotificationsAsReadResponse());

  // Push Notifications
  mockAPICall(server, getMockRetrievePushNotificationLinksResponse());
  mockAPICall(server, getMockUpdatePushNotificationLinksResponse());
  mockAPICall(server, getMockCreateFCMRegistrationTokenResponse());
  mockAPICall(server, getMockDeleteFCMRegistrationTokenResponse());
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
