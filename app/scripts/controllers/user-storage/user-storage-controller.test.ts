import nock from 'nock';
import { ControllerMessenger } from '@metamask/base-controller';
import {
  MOCK_STORAGE_DATA,
  MOCK_STORAGE_KEY_SIGNATURE,
} from './mocks/mockStorage';
import UserStorageController from './user-storage-controller';
import {
  mockEndpointGetUserStorage,
  mockEndpointUpsertUserStorage,
} from './mocks/mockServices';

describe('user-storage/user-storage-controller - performGetString() tests', () => {
  test('returns users notification storage', async () => {
    const { messengerMocks, authMocks, mockAPI } = arrangeMocks();
    const controller = new UserStorageController(
      messengerMocks.messenger,
      authMocks,
    );

    const result = await controller.performGetStorage('notification_settings');
    mockAPI.done();
    expect(result).toBe(MOCK_STORAGE_DATA);
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
    const controller = new UserStorageController(
      messengerMocks.messenger,
      authMocks,
    );

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
    const controller = new UserStorageController(
      messengerMocks.messenger,
      authMocks,
    );

    await controller.performSetStorage('notification_settings', 'new data');
    mockAPI.done();
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
    const controller = new UserStorageController(
      messengerMocks.messenger,
      authMocks,
    );

    await expect(
      controller.performSetStorage('notification_settings', 'new data'),
    ).rejects.toThrow();
  });

  test('rejects if api call fails', async () => {
    const { messengerMocks, authMocks } = arrangeMocks({
      mockAPI: mockEndpointUpsertUserStorage({ status: 500 }),
    });
    const controller = new UserStorageController(
      messengerMocks.messenger,
      authMocks,
    );
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

function mockAuthParams() {
  const getBearerToken = jest.fn().mockResolvedValue('MOCK_BEARER_TOKEN');
  const getSessionIdentifier = jest
    .fn()
    .mockResolvedValue('MOCK_SESSION_IDENTIFIER');
  return {
    getBearerToken,
    getSessionIdentifier,
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
