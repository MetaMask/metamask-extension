import { Mockttp, RequestRuleBuilder } from 'mockttp';
import { AuthenticationController } from '@metamask/profile-sync-controller';
import {
  NotificationServicesController,
  NotificationServicesPushController,
} from '@metamask/notification-services-controller';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { UserStorageMockttpController } from '../../helpers/user-storage/userStorageMockttpController';
import { accountsSyncMockResponse } from './account-syncing/mockData';

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
  if (
    !userStorageMockttpControllerInstance?.paths.get(
      USER_STORAGE_FEATURE_NAMES.accounts,
    )
  ) {
    userStorageMockttpControllerInstance.setupPath(
      USER_STORAGE_FEATURE_NAMES.accounts,
      server,
    );
  }
  if (
    !userStorageMockttpControllerInstance?.paths.get(
      USER_STORAGE_FEATURE_NAMES.networks,
    )
  ) {
    userStorageMockttpControllerInstance.setupPath(
      USER_STORAGE_FEATURE_NAMES.networks,
      server,
    );
  }
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

type MockInfuraAndAccountSyncOptions = {
  accountsToMock?: string[];
  accountsSyncResponse?: typeof accountsSyncMockResponse;
};

const MOCK_ETH_BALANCE = '0xde0b6b3a7640000';
const INFURA_URL =
  'https://mainnet.infura.io/v3/00000000000000000000000000000000';

/**
 * Sets up mock responses for Infura balance checks and account syncing
 *
 * @param mockServer - The Mockttp server instance
 * @param userStorageMockttpController - Controller for user storage mocks
 * @param options - Configuration options for mocking
 */
export async function mockInfuraAndAccountSync(
  mockServer: Mockttp,
  userStorageMockttpController: UserStorageMockttpController,
  options: MockInfuraAndAccountSyncOptions = {},
): Promise<void> {
  const accounts = options.accountsToMock ?? [];

  // Set up User Storage / Account Sync mock
  userStorageMockttpController.setupPath(
    USER_STORAGE_FEATURE_NAMES.accounts,
    mockServer,
  );

  userStorageMockttpController.setupPath(
    USER_STORAGE_FEATURE_NAMES.accounts,
    mockServer,
    {
      getResponse: options.accountsSyncResponse ?? undefined,
    },
  );

  // Account Balances
  if (accounts.length > 0) {
    accounts.forEach((account) => {
      mockServer
        .forPost(INFURA_URL)
        .withJsonBodyIncluding({
          method: 'eth_getBalance',
          params: [account.toLowerCase()],
        })
        .thenCallback(() => ({
          statusCode: 200,
          json: {
            jsonrpc: '2.0',
            id: '1111111111111111',
            result: MOCK_ETH_BALANCE,
          },
        }));
    });
  }

  mockNotificationServices(mockServer, userStorageMockttpController);
}
