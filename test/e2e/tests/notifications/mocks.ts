import { Mockttp, RequestRuleBuilder } from 'mockttp';
import {
  NotificationServicesController,
  NotificationServicesPushController,
} from '@metamask/notification-services-controller';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { UserStorageMockttpController } from '../../helpers/identity/user-storage/userStorageMockttpController';

const NotificationMocks = NotificationServicesController.Mocks;
const PushMocks = NotificationServicesPushController.Mocks;

type MockResponse = {
  url: string | RegExp;
  requestMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  response: unknown;
};

/**
 * E2E mock setup for notification APIs (Notifications, Push Notifications)
 *
 * @param server - server obj used to mock our endpoints
 * @param userStorageMockttpControllerInstance - optional instance of UserStorageMockttpController, useful if you need persisted user storage between tests
 */
export async function mockNotificationServices(
  server: Mockttp,
  userStorageMockttpControllerInstance: UserStorageMockttpController = new UserStorageMockttpController(),
) {
  // Storage
  if (
    !userStorageMockttpControllerInstance?.paths.get(
      USER_STORAGE_FEATURE_NAMES.notifications,
    )
  ) {
    userStorageMockttpControllerInstance.setupPath(
      USER_STORAGE_FEATURE_NAMES.notifications,
      server,
    );
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
