import { Mockttp, RequestRuleBuilder } from 'mockttp';
import { AuthenticationController } from '@metamask/profile-sync-controller';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import {
  UserStorageMockttpController,
  UserStorageResponseData,
} from '../../helpers/identity/user-storage/userStorageMockttpController';

const AuthMocks = AuthenticationController.Mocks;

type MockResponse = {
  url: string | RegExp;
  requestMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  response: unknown;
};

/**
 * E2E mock setup for identity APIs (Auth, UserStorage, Backup and sync)
 *
 * @param server - server obj used to mock our endpoints
 * @param userStorageMockttpControllerInstance - optional instance of UserStorageMockttpController, useful if you need persisted user storage between tests
 */
export async function mockIdentityServices(
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
      USER_STORAGE_FEATURE_NAMES.addressBook,
    )
  ) {
    userStorageMockttpControllerInstance.setupPath(
      USER_STORAGE_FEATURE_NAMES.addressBook,
      server,
    );
  }
}

export const MOCK_SRP_E2E_IDENTIFIER_BASE_KEY = 'MOCK_SRP_IDENTIFIER';

const MOCK_SRP_E2E_IDENTIFIERS = {
  baseKey: MOCK_SRP_E2E_IDENTIFIER_BASE_KEY,
  list: new Map<string, string>(),
};

const getE2ESrpIdentifierForPublicKey = (publicKey: string) => {
  const { baseKey, list } = MOCK_SRP_E2E_IDENTIFIERS;

  // Check if the identifier already exists
  if (list.has(publicKey)) {
    return list.get(publicKey);
  }

  const nextIteration = list.size + 1;
  const nextIdentifier = `${baseKey}_${nextIteration}`;

  list.set(publicKey, nextIdentifier);

  return nextIdentifier;
};

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

  requestRuleBuilder?.thenCallback(async (request) => {
    const { path, body } = request;

    const [requestBodyJson, requestBodyText] = await Promise.all([
      body.getJson(),
      body.getText(),
    ]);
    const requestBody = requestBodyJson ?? requestBodyText;

    const json = (
      response.response as (
        requestBody: object | string | undefined,
        path: string,
        getE2ESrpIdentifierForPublicKey: (
          publicKey: string,
        ) => string | undefined,
      ) => void
    )(requestBody, path, getE2ESrpIdentifierForPublicKey);

    return {
      statusCode: 200,
      json,
    };
  });
}

type MockInfuraAndAccountSyncOptions = {
  accountsToMockBalances?: string[];
  accountsSyncResponse?: UserStorageResponseData[];
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
  const accounts = options.accountsToMockBalances ?? [];

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

  mockIdentityServices(mockServer, userStorageMockttpController);
}

/**
 * Sets up mock responses for NFT API calls
 *
 * @param mockServer - The Mockttp server instance
 * @param userAddress - The user address to mock the NFT API call for
 */
export async function mockNftApiCall(
  mockServer: Mockttp,
  userAddress: string,
): Promise<void> {
  mockServer
    .forGet(`https://nft.api.cx.metamask.io/users/${userAddress}/tokens`)
    .withQuery({
      limit: 50,
      includeTopBid: 'true',
      chainIds: ['1', '59144'],
      continuation: '',
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          tokens: [],
        },
      };
    });
}
