import { Mockttp, RequestRuleBuilder } from 'mockttp';
import {
  getMockFeatureAnnouncementResponse,
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
  getMockUpdatePushNotificationLinksResponse,
  getMockCreateFCMRegistrationTokenResponse,
  getMockDeleteFCMRegistrationTokenResponse,
} from '@metamask/notification-services-controller/push-services/mocks';
import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import { MockttpNotificationTriggerServer } from '../../helpers/notifications/mock-notification-trigger-server';

type MockResponse = {
  url: string | RegExp;
  requestMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  response: unknown;
};

export type UserStorageAccount = {
  v: string;
  a: string;
  i: string;
  n: string;
  nlu: number;
};

export const notificationsMockAccounts: UserStorageAccount[] = [
  {
    v: '1',
    a: '0xAa4179E7f103701e904D27DF223a39Aa9c27405a'.toLowerCase(),
    i: '0000-1111',
    n: 'Hello from account 1',
    nlu: 1738590287,
  },
  {
    v: '1',
    a: '0xd2a4aFe5c2fF0a16Bf81F77ba4201A8107AA874b'.toLowerCase(),
    i: '1111-1111',
    n: 'Hello from account 2',
    nlu: 1738590287,
  },
];

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
 * @param triggerServer - notification trigger server
 */
export async function mockNotificationServices(
  server: Mockttp,
  triggerServer: MockttpNotificationTriggerServer = new MockttpNotificationTriggerServer(),
) {
  // Trigger Server
  triggerServer.setupServer(server);

  // Notification Server
  mockAPICall(server, mockFeatureAnnouncementResponse, (r) =>
    r.withQuery({
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      content_type: 'productAnnouncement',
    }),
  );
  mockAPICall(server, mockListNotificationsResponse);
  mockAPICall(server, getMockMarkNotificationsAsReadResponse());

  // Push Notifications
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
