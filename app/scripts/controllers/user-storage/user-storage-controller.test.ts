import nock from 'nock';
import { ControllerMessenger } from '@metamask/base-controller';
import {
  AuthenticationControllerGetBearerToken,
  AuthenticationControllerGetSessionProfile,
  AuthenticationControllerIsSignedIn,
  AuthenticationControllerPerformSignIn,
} from '../authentication/authentication-controller';
import {
  MOCK_STORAGE_DATA,
  MOCK_STORAGE_KEY,
  MOCK_STORAGE_KEY_SIGNATURE,
} from './mocks/mockStorage';
import UserStorageController, {
  AllowedActions,
} from './user-storage-controller';
import {
  mockEndpointGetUserStorage,
  mockEndpointUpsertUserStorage,
} from './mocks/mockServices';

const typedMockFn = <Fn extends (...args: unknown[]) => unknown>() =>
  jest.fn<ReturnType<Fn>, Parameters<Fn>>();

describe('user-storage/user-storage-controller - constructor() tests', () => {
  test('Creates UserStorage with default state', () => {
    const { messengerMocks } = arrangeMocks();
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
    });

    expect(controller.state.isProfileSyncingEnabled).toBe(true);
  });

  function arrangeMocks() {
    return {
      messengerMocks: mockUserStorageMessenger(),
    };
  }
});

describe('user-storage/user-storage-controller - performGetStorage() tests', () => {
  test('returns users notification storage', async () => {
    const { messengerMocks, mockAPI } = arrangeMocks();
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
    });

    const result = await controller.performGetStorage('notification_settings');
    mockAPI.done();
    expect(result).toBe(MOCK_STORAGE_DATA);
  });

  test('rejects if UserStorage is not enabled', async () => {
    const { messengerMocks } = arrangeMocks();
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
      state: { isProfileSyncingEnabled: false },
    });

    await expect(
      controller.performGetStorage('notification_settings'),
    ).rejects.toThrow();
  });

  test.each([
    [
      'fails when no bearer token is found (auth errors)',
      (messengerMocks: ReturnType<typeof mockUserStorageMessenger>) =>
        messengerMocks.mockAuthGetBearerToken.mockRejectedValue(
          new Error('MOCK FAILURE'),
        ),
    ],
    [
      'fails when no session identifier is found (auth errors)',
      (messengerMocks: ReturnType<typeof mockUserStorageMessenger>) =>
        messengerMocks.mockAuthGetSessionProfile.mockRejectedValue(
          new Error('MOCK FAILURE'),
        ),
    ],
  ])('rejects on auth failure - %s', async (_, arrangeFailureCase) => {
    const { messengerMocks } = arrangeMocks();
    arrangeFailureCase(messengerMocks);
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
    });

    await expect(
      controller.performGetStorage('notification_settings'),
    ).rejects.toThrow();
  });

  function arrangeMocks() {
    return {
      messengerMocks: mockUserStorageMessenger(),
      mockAPI: mockEndpointGetUserStorage(),
    };
  }
});

describe('user-storage/user-storage-controller - performSetStorage() tests', () => {
  test('saves users storage', async () => {
    const { messengerMocks, mockAPI } = arrangeMocks();
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
    });

    await controller.performSetStorage('notification_settings', 'new data');
    mockAPI.done();
  });

  test('rejects if UserStorage is not enabled', async () => {
    const { messengerMocks } = arrangeMocks();
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
      state: { isProfileSyncingEnabled: false },
    });

    await expect(
      controller.performSetStorage('notification_settings', 'new data'),
    ).rejects.toThrow();
  });

  test.each([
    [
      'fails when no bearer token is found (auth errors)',
      (messengerMocks: ReturnType<typeof mockUserStorageMessenger>) =>
        messengerMocks.mockAuthGetBearerToken.mockRejectedValue(
          new Error('MOCK FAILURE'),
        ),
    ],
    [
      'fails when no session identifier is found (auth errors)',
      (messengerMocks: ReturnType<typeof mockUserStorageMessenger>) =>
        messengerMocks.mockAuthGetSessionProfile.mockRejectedValue(
          new Error('MOCK FAILURE'),
        ),
    ],
  ])('rejects on auth failure - %s', async (_, arrangeFailureCase) => {
    const { messengerMocks } = arrangeMocks();
    arrangeFailureCase(messengerMocks);
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
    });

    await expect(
      controller.performSetStorage('notification_settings', 'new data'),
    ).rejects.toThrow();
  });

  test('rejects if api call fails', async () => {
    const { messengerMocks } = arrangeMocks({
      mockAPI: mockEndpointUpsertUserStorage({ status: 500 }),
    });
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
    });
    await expect(
      controller.performSetStorage('notification_settings', 'new data'),
    ).rejects.toThrow();
  });

  function arrangeMocks(overrides?: { mockAPI?: nock.Scope }) {
    return {
      messengerMocks: mockUserStorageMessenger(),
      mockAPI: overrides?.mockAPI ?? mockEndpointUpsertUserStorage(),
    };
  }
});

describe('user-storage/user-storage-controller - performSetStorage() tests', () => {
  test('Should return a storage key', async () => {
    const { messengerMocks } = arrangeMocks();
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
    });

    const result = await controller.getStorageKey();
    expect(result).toBe(MOCK_STORAGE_KEY);
  });

  test('rejects if UserStorage is not enabled', async () => {
    const { messengerMocks } = arrangeMocks();
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
      state: { isProfileSyncingEnabled: false },
    });

    await expect(controller.getStorageKey()).rejects.toThrow();
  });

  function arrangeMocks() {
    return {
      messengerMocks: mockUserStorageMessenger(),
    };
  }
});

describe('user-storage/user-storage-controller - disableProfileSyncing() tests', () => {
  test('should disable user storage / profile syncing when called', async () => {
    const { messengerMocks } = arrangeMocks();
    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
    });

    expect(controller.state.isProfileSyncingEnabled).toBe(true);
    await controller.disableProfileSyncing();
    expect(controller.state.isProfileSyncingEnabled).toBe(false);
  });

  function arrangeMocks() {
    return {
      messengerMocks: mockUserStorageMessenger(),
    };
  }
});

describe('user-storage/user-storage-controller - enableProfileSyncing() tests', () => {
  test('should enable user storage / profile syncing', async () => {
    const { messengerMocks } = arrangeMocks();
    messengerMocks.mockAuthIsSignedIn.mockReturnValue(false); // mock that auth is not enabled

    const controller = new UserStorageController({
      messenger: messengerMocks.messenger,
      state: { isProfileSyncingEnabled: false },
    });

    expect(controller.state.isProfileSyncingEnabled).toBe(false);
    await controller.enableProfileSyncing();
    expect(controller.state.isProfileSyncingEnabled).toBe(true);
    expect(messengerMocks.mockAuthIsSignedIn).toBeCalled();
    expect(messengerMocks.mockAuthPerformSignIn).toBeCalled();
  });

  function arrangeMocks() {
    return {
      messengerMocks: mockUserStorageMessenger(),
    };
  }
});

function mockUserStorageMessenger() {
  const messenger = new ControllerMessenger<
    AllowedActions,
    never
  >().getRestricted({
    name: 'UserStorageController',
    allowedActions: [
      'SnapController:handleRequest',
      'AuthenticationController:getBearerToken',
      'AuthenticationController:getSessionProfile',
      'AuthenticationController:isSignedIn',
      'AuthenticationController:performSignIn',
    ],
  });

  const mockSnapGetPublicKey = jest.fn().mockResolvedValue('MOCK_PUBLIC_KEY');
  const mockSnapSignMessage = jest
    .fn()
    .mockResolvedValue(MOCK_STORAGE_KEY_SIGNATURE);

  const mockAuthGetBearerToken =
    typedMockFn<
      AuthenticationControllerGetBearerToken['handler']
    >().mockResolvedValue('MOCK_BEARER_TOKEN');

  const mockAuthGetSessionProfile = typedMockFn<
    AuthenticationControllerGetSessionProfile['handler']
  >().mockResolvedValue({
    identifierId: '',
    metametricsId: '',
    profileId: 'MOCK_PROFILE_ID',
  });

  const mockAuthPerformSignIn =
    typedMockFn<
      AuthenticationControllerPerformSignIn['handler']
    >().mockResolvedValue('New Access Token');

  const mockAuthIsSignedIn =
    typedMockFn<
      AuthenticationControllerIsSignedIn['handler']
    >().mockReturnValue(true);

  jest.spyOn(messenger, 'call').mockImplementation((...args) => {
    const [actionType, params] = args;
    if (actionType === 'SnapController:handleRequest') {
      if (params?.request.method === 'getPublicKey') {
        return mockSnapGetPublicKey();
      }

      if (params?.request.method === 'signMessage') {
        return mockSnapSignMessage();
      }

      throw new Error(
        `MOCK_FAIL - unsupported SnapController:handleRequest call: ${params?.request.method}`,
      );
    }

    if (actionType === 'AuthenticationController:getBearerToken') {
      return mockAuthGetBearerToken();
    }

    if (actionType === 'AuthenticationController:getSessionProfile') {
      return mockAuthGetSessionProfile();
    }

    if (actionType === 'AuthenticationController:performSignIn') {
      return mockAuthPerformSignIn();
    }

    if (actionType === 'AuthenticationController:isSignedIn') {
      return mockAuthIsSignedIn();
    }

    function exhaustedMessengerMocks(action: never) {
      throw new Error(`MOCK_FAIL - unsupported messenger call: ${action}`);
    }

    return exhaustedMessengerMocks(actionType);
  });

  return {
    messenger,
    mockSnapGetPublicKey,
    mockSnapSignMessage,
    mockAuthGetBearerToken,
    mockAuthGetSessionProfile,
    mockAuthPerformSignIn,
    mockAuthIsSignedIn,
  };
}
