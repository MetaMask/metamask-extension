import { Mockttp, RequestRuleBuilder } from 'mockttp';
import {
  getMockFeatureAnnouncementResponse,
  getMockBatchCreateTriggersResponse,
  getMockBatchDeleteTriggersResponse,
  getMockListNotificationsResponse,
  getMockMarkNotificationsAsReadResponse,
  createMockNotificationEthSent,
  createMockNotificationEthReceived,
  createMockNotificationERC20Sent,
  createMockNotificationERC20Received,
  createMockNotificationERC721Sent,
  createMockNotificationERC721Received,
  createMockNotificationERC1155Sent,
  createMockNotificationERC1155Received,
  createMockNotificationMetaMaskSwapsCompleted,
  createMockNotificationRocketPoolStakeCompleted,
  createMockNotificationRocketPoolUnStakeCompleted,
  createMockNotificationLidoStakeCompleted,
  createMockNotificationLidoWithdrawalRequested,
  createMockNotificationLidoReadyToBeWithdrawn,
} from '@metamask/notification-services-controller/notification-services/mocks';
import {
  getMockRetrievePushNotificationLinksResponse,
  getMockUpdatePushNotificationLinksResponse,
  getMockCreateFCMRegistrationTokenResponse,
  getMockDeleteFCMRegistrationTokenResponse,
} from '@metamask/notification-services-controller/push-services/mocks';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import {
  getMockAuthNonceResponse,
  getMockAuthLoginResponse,
  getMockAuthAccessTokenResponse,
} from '@metamask/profile-sync-controller/auth/mocks';
import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import { UserStorageMockttpController } from '../../helpers/identity/user-storage/userStorageMockttpController';

type MockResponse = {
  url: string | RegExp;
  requestMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  response: unknown;
};

const mockListNotificationsResponse = getMockListNotificationsResponse();
mockListNotificationsResponse.response = [
  createMockNotificationEthSent(),
  createMockNotificationEthReceived(),
  createMockNotificationERC20Sent(),
  createMockNotificationERC20Received(),
  createMockNotificationERC721Sent(),
  createMockNotificationERC721Received(),
  createMockNotificationERC1155Sent(),
  createMockNotificationERC1155Received(),
  createMockNotificationMetaMaskSwapsCompleted(),
  createMockNotificationRocketPoolStakeCompleted(),
  createMockNotificationRocketPoolUnStakeCompleted(),
  createMockNotificationLidoStakeCompleted(),
  createMockNotificationLidoWithdrawalRequested(),
  createMockNotificationLidoReadyToBeWithdrawn(),
  // TODO - add this back in once GH actions consumes correct secrets.
  // createMockNotificationLidoWithdrawalCompleted(),
].map((n, i) => {
  const date = new Date();
  date.setDate(date.getDate() - i);
  n.id = `${n.id}-${i}`;
  n.created_at = date.toString();
  return n;
});

const mockFeatureAnnouncementResponse = {
  ...getMockFeatureAnnouncementResponse(),
  url: /^https:\/\/cdn\.contentful\.com\/.*$/u,
};
const date = new Date();
date.setMonth(date.getMonth() - 1);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(mockFeatureAnnouncementResponse.response as any).items[0].sys.createdAt =
  date.toString();

export function getMockWalletNotificationItemId(trigger: TRIGGER_TYPES) {
  return (
    mockListNotificationsResponse.response.find((n) => n.data.kind === trigger)
      ?.id ?? 'DOES NOT EXIST'
  );
}

export function getMockFeatureAnnouncementItemId() {
  return (
    mockFeatureAnnouncementResponse.response.items?.at(0)?.fields?.id ??
    'DOES NOT EXIST'
  );
}

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
  userStorageMockttpControllerInstance.setupPath(
    USER_STORAGE_FEATURE_NAMES.notifications,
    server,
  );

  // Auth
  mockAPICall(server, getMockAuthNonceResponse());
  mockAPICall(server, getMockAuthLoginResponse());
  mockAPICall(server, getMockAuthAccessTokenResponse());

  // Notifications
  mockAPICall(server, mockFeatureAnnouncementResponse, (r) =>
    r.withQuery({
      content_type: 'productAnnouncement',
    }),
  );
  mockAPICall(server, getMockBatchCreateTriggersResponse());
  mockAPICall(server, getMockBatchDeleteTriggersResponse());
  mockAPICall(server, mockListNotificationsResponse);
  mockAPICall(server, getMockMarkNotificationsAsReadResponse());

  // Push Notifications
  mockAPICall(server, getMockRetrievePushNotificationLinksResponse());
  mockAPICall(server, getMockUpdatePushNotificationLinksResponse());
  mockAPICall(server, getMockCreateFCMRegistrationTokenResponse());
  mockAPICall(server, getMockDeleteFCMRegistrationTokenResponse());
}

function mockAPICall(
  server: Mockttp,
  response: MockResponse,
  modifyRequest?: (r: RequestRuleBuilder) => RequestRuleBuilder,
) {
  let requestRuleBuilder: RequestRuleBuilder | undefined;

  if (response.requestMethod === 'GET') {
    requestRuleBuilder = server.forGet(response.url);
    requestRuleBuilder ??= modifyRequest?.(requestRuleBuilder);
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
