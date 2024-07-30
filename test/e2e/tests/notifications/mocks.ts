import { Mockttp, RequestRuleBuilder } from 'mockttp';
import {
  getMockAuthNonceResponse,
  getMockAuthLoginResponse,
  getMockAuthAccessTokenResponse,
} from '../../../../app/scripts/controllers/authentication/mocks/mockResponses';
import {
  getMockUserStorageGetResponse,
  getMockUserStoragePutResponse,
} from '../../../../app/scripts/controllers/user-storage/mocks/mockResponses';
import {
  getMockFeatureAnnouncementResponse,
  getMockBatchCreateTriggersResponse,
  getMockBatchDeleteTriggersResponse,
  getMockListNotificationsResponse,
  getMockMarkNotificationsAsReadResponse,
} from '../../../../app/scripts/controllers/metamask-notifications/mocks/mockResponses';
import {
  getMockRetrievePushNotificationLinksResponse,
  getMockUpdatePushNotificationLinksResponse,
  getMockCreateFCMRegistrationTokenResponse,
  getMockDeleteFCMRegistrationTokenResponse,
} from '../../../../app/scripts/controllers/push-platform-notifications/mocks/mockResponse';

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
  mockAPICall(server, getMockAuthNonceResponse());
  mockAPICall(server, getMockAuthLoginResponse());
  mockAPICall(server, getMockAuthAccessTokenResponse());

  // Storage
  mockAPICall(server, getMockUserStorageGetResponse());
  mockAPICall(server, getMockUserStoragePutResponse());

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
