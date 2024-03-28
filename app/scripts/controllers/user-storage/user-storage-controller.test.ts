import nock from 'nock';
import { ControllerMessenger } from '@metamask/base-controller';
import {
  MOCK_STORAGE_DATA,
  MOCK_STORAGE_KEY,
  MOCK_STORAGE_KEY_SIGNATURE,
} from './mocks/mockStorage';
import UserStorageController, { AuthParams } from './user-storage-controller';
import {
  mockEndpointGetUserStorage,
  mockEndpointUpsertUserStorage,
} from './mocks/mockServices';

describe('user-storage/user-storage-controller - constructor() tests', () => {
  test('Creates UserStorage with default state', () => {
    const { messengerMocks, authMocks } = arrangeMocks();
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
      auth: authMocks,
    });

    expect(controller.state.isProfileSyncingEnabled).toBe(true);
  });

  function arrangeMocks() {
    return {
      authMocks: mockAuthParams(),
      messengerMocks: mockUserStorageMessenger(),
    };
  }
});

describe('user-storage/user-storage-controller - performGetStorage() tests', () => {
  test('returns users notification storage', async () => {
    const { messengerMocks, authMocks, mockAPI } = arrangeMocks();
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
      auth: authMocks,
    });

    const result = await controller.performGetStorage('notification_settings');
    mockAPI.done();
    expect(result).toBe(MOCK_STORAGE_DATA);
  });

  test('rejects if UserStorage is not enabled', async () => {
    const { messengerMocks, authMocks } = arrangeMocks();
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
      auth: authMocks,
      state: { isProfileSyncingEnabled: false },
    });

    await expect(
      controller.performGetStorage('notification_settings'),
    ).rejects.toThrow();
  });

  test.each([
    [
      'fails when no bearer token is found',
      (authMocks: ReturnType<typeof mockAuthParams>) =>
        authMocks.getBearerToken.mockResolvedValue(null),
    ],
    [
      'fails when no session identifier is found',
      (authMocks: ReturnType<typeof mockAuthParams>) =>
        authMocks.getSessionIdentifier.mockResolvedValue(null),
    ],
  ])('rejects on auth failure - %s', async (_, arrangeFailureCase) => {
    const { messengerMocks, authMocks } = arrangeMocks();
    arrangeFailureCase(authMocks);
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
      auth: authMocks,
    });

    await expect(
      controller.performGetStorage('notification_settings'),
    ).rejects.toThrow();
  });

  function arrangeMocks() {
    return {
      authMocks: mockAuthParams(),
      messengerMocks: mockUserStorageMessenger(),
      mockAPI: mockEndpointGetUserStorage(),
    };
  }
});

describe('user-storage/user-storage-controller - performSetStorage() tests', () => {
  test('saves users storage', async () => {
    const { messengerMocks, authMocks, mockAPI } = arrangeMocks();
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
      auth: authMocks,
    });

    await controller.performSetStorage('notification_settings', 'new data');
    mockAPI.done();
  });

  test('rejects if UserStorage is not enabled', async () => {
    const { messengerMocks, authMocks } = arrangeMocks();
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
      auth: authMocks,
      state: { isProfileSyncingEnabled: false },
    });

    await expect(
      controller.performSetStorage('notification_settings', 'new data'),
    ).rejects.toThrow();
  });

  test.each([
    [
      'fails when no bearer token is found',
      (authMocks: ReturnType<typeof mockAuthParams>) =>
        authMocks.getBearerToken.mockResolvedValue(null),
    ],
    [
      'fails when no session identifier is found',
      (authMocks: ReturnType<typeof mockAuthParams>) =>
        authMocks.getSessionIdentifier.mockResolvedValue(null),
    ],
  ])('rejects on auth failure - %s', async (_, arrangeFailureCase) => {
    const { messengerMocks, authMocks } = arrangeMocks();
    arrangeFailureCase(authMocks);
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
      auth: authMocks,
    });

    await expect(
      controller.performSetStorage('notification_settings', 'new data'),
    ).rejects.toThrow();
  });

  test('rejects if api call fails', async () => {
    const { messengerMocks, authMocks } = arrangeMocks({
      mockAPI: mockEndpointUpsertUserStorage({ status: 500 }),
    });
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
      auth: authMocks,
    });
    await expect(
      controller.performSetStorage('notification_settings', 'new data'),
    ).rejects.toThrow();
  });

  function arrangeMocks(overrides?: { mockAPI?: nock.Scope }) {
    return {
      authMocks: mockAuthParams(),
      messengerMocks: mockUserStorageMessenger(),
      mockAPI: overrides?.mockAPI ?? mockEndpointUpsertUserStorage(),
    };
  }
});

describe('user-storage/user-storage-controller - performSetStorage() tests', () => {
  test('Should return a storage key', async () => {
    const { messengerMocks, authMocks } = arrangeMocks();
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
      auth: authMocks,
    });

    const result = await controller.getStorageKey();
    expect(result).toBe(MOCK_STORAGE_KEY);
  });

  test('rejects if UserStorage is not enabled', async () => {
    const { messengerMocks, authMocks } = arrangeMocks();
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
      auth: authMocks,
      state: { isProfileSyncingEnabled: false },
    });

    await expect(controller.getStorageKey()).rejects.toThrow();
  });

  function arrangeMocks() {
    return {
      authMocks: mockAuthParams(),
      messengerMocks: mockUserStorageMessenger(),
    };
  }
});

describe('user-storage/user-storage-controller - disableProfileSyncing() tests', () => {
  test('should disable user storage / profile syncing when called', async () => {
    const { messengerMocks, authMocks } = arrangeMocks();
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
      auth: authMocks,
    });

    expect(controller.state.isProfileSyncingEnabled).toBe(true);
    await controller.disableProfileSyncing();
    expect(controller.state.isProfileSyncingEnabled).toBe(false);
  });

  function arrangeMocks() {
    return {
      authMocks: mockAuthParams(),
      messengerMocks: mockUserStorageMessenger(),
    };
  }
});

describe('user-storage/user-storage-controller - enableProfileSyncing() tests', () => {
  test('should enable user storage / profile syncing', async () => {
    const { messengerMocks, authMocks } = arrangeMocks();
    authMocks.isAuthEnabled.mockReturnValue(false); // mock that auth is not enabled

    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
      auth: authMocks,
      state: { isProfileSyncingEnabled: false },
    });

    expect(controller.state.isProfileSyncingEnabled).toBe(false);
    await controller.enableProfileSyncing();
    expect(controller.state.isProfileSyncingEnabled).toBe(true);
    expect(authMocks.isAuthEnabled).toBeCalled();
    expect(authMocks.signIn).toBeCalled();
  });

  function arrangeMocks() {
    return {
      authMocks: mockAuthParams(),
      messengerMocks: mockUserStorageMessenger(),
    };
  }
});

function mockAuthParams(): jest.MockedObject<AuthParams> {
  const getBearerToken = jest.fn().mockResolvedValue('MOCK_BEARER_TOKEN');
  const getSessionIdentifier = jest
    .fn()
    .mockResolvedValue('MOCK_SESSION_IDENTIFIER');
  const mockSignIn = jest.fn().mockResolvedValue('New Access Token');
  const mockIsAuthEnabled = jest.fn().mockReturnValue(true);
  return {
    getBearerToken,
    getSessionIdentifier,
    isAuthEnabled: mockIsAuthEnabled,
    signIn: mockSignIn,
  };
}

function mockUserStorageMessenger() {
  const messenger = new ControllerMessenger<any, any>().getRestricted({
    name: 'UserStorageController',
    allowedActions: [`SnapController:handleRequest`],
  });

  const mockSnapGetPublicKey = jest.fn().mockResolvedValue('MOCK_PUBLIC_KEY');
  const mockSnapSignMessage = jest
    .fn()
    .mockResolvedValue(MOCK_STORAGE_KEY_SIGNATURE);
  jest
    .spyOn(messenger, 'call')
    .mockImplementation((actionType: any, params: any) => {
      if (
        actionType === 'SnapController:handleRequest' &&
        params?.request.method === 'getPublicKey'
      ) {
        return mockSnapGetPublicKey();
      }

      if (
        actionType === 'SnapController:handleRequest' &&
        params?.request.method === 'signMessage'
      ) {
        return mockSnapSignMessage();
      }

      return '';
    });

  return {
    messenger,
    mockSnapGetPublicKey,
    mockSnapSignMessage,
  };
}
