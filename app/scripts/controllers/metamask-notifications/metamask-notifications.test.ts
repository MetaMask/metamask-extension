import { ControllerMessenger } from '@metamask/base-controller';
import * as ControllerUtils from '@metamask/controller-utils';
import {
  KeyringControllerGetAccountsAction,
  KeyringControllerState,
  KeyringControllerStateChangeEvent,
} from '@metamask/keyring-controller';
import {
  AuthenticationControllerGetBearerToken,
  AuthenticationControllerIsSignedIn,
} from '../authentication/authentication-controller';
import { MOCK_ACCESS_TOKEN } from '../authentication/mocks/mockServices';
import {
  UserStorageControllerGetStorageKey,
  UserStorageControllerPerformGetStorage,
  UserStorageControllerPerformSetStorage,
} from '../user-storage/user-storage-controller';
import {
  AllowedActions,
  AllowedEvents,
  MetamaskNotificationsController,
  PushNotificationsControllerDisablePushNotifications,
  PushNotificationsControllerEnablePushNotifications,
  PushNotificationsControllerUpdateTriggerPushNotifications,
  defaultState,
} from './metamask-notifications';
import {
  createMockFeatureAnnouncementAPIResult,
  createMockFeatureAnnouncementRaw,
  mockFetchFeatureAnnouncementNotifications,
} from './mocks/mock-feature-announcements';
import {
  MOCK_USER_STORAGE_ACCOUNT,
  createMockFullUserStorage,
  createMockUserStorageWithTriggers,
} from './mocks/mock-notification-user-storage';
import {
  mockBatchCreateTriggers,
  mockBatchDeleteTriggers,
  mockListNotifications,
  mockMarkNotificationsAsRead,
} from './mocks/mock-onchain-notifications';
import { createMockNotificationEthSent } from './mocks/mock-raw-notifications';
import { processNotification } from './processors/process-notifications';
import * as OnChainNotifications from './services/onchain-notifications';
import { UserStorage } from './types/user-storage/user-storage';
import * as MetamaskNotificationsUtils from './utils/utils';

describe('metamask-notifications - constructor()', () => {
  test('initializes state & override state', () => {
    const controller1 = new MetamaskNotificationsController({
      messenger: mockNotificationMessenger().messenger,
    });
    expect(controller1.state).toEqual(defaultState);

    const controller2 = new MetamaskNotificationsController({
      messenger: mockNotificationMessenger().messenger,
      state: {
        ...defaultState,
        isFeatureAnnouncementsEnabled: true,
        isMetamaskNotificationsEnabled: true,
      },
    });
    expect(controller2.state.isFeatureAnnouncementsEnabled).toBe(true);
    expect(controller2.state.isMetamaskNotificationsEnabled).toBe(true);
  });

  test('Keyring Change Event but feature not enabled will not add or remove triggers', async () => {
    const { messenger, globalMessenger, mockListAccounts } = arrangeMocks();

    // initialize controller with 1 address
    mockListAccounts.mockResolvedValueOnce(['addr1']);
    const controller = new MetamaskNotificationsController({ messenger });

    const mockUpdate = jest
      .spyOn(controller, 'updateOnChainTriggersByAccount')
      .mockResolvedValue({} as UserStorage);
    const mockDelete = jest
      .spyOn(controller, 'deleteOnChainTriggersByAccount')
      .mockResolvedValue({} as UserStorage);

    // listAccounts has a new address
    mockListAccounts.mockResolvedValueOnce(['addr1', 'addr2']);
    await actPublishKeyringStateChange(globalMessenger);

    expect(mockUpdate).not.toBeCalled();
    expect(mockDelete).not.toBeCalled();
  });

  test('Keying Change Event with new triggers', async () => {
    const { messenger, globalMessenger, mockListAccounts } = arrangeMocks();

    // initialize controller with 1 address
    mockListAccounts.mockResolvedValueOnce(['addr1']);
    const controller = new MetamaskNotificationsController({ messenger });
    controller.state.isMetamaskNotificationsEnabled = true;

    const mockUpdate = jest
      .spyOn(controller, 'updateOnChainTriggersByAccount')
      .mockResolvedValue({} as UserStorage);
    const mockDelete = jest
      .spyOn(controller, 'deleteOnChainTriggersByAccount')
      .mockResolvedValue({} as UserStorage);

    async function act(
      addresses: string[],
      assertion: () => Promise<void> | void,
    ) {
      mockListAccounts.mockResolvedValueOnce(addresses);
      await actPublishKeyringStateChange(globalMessenger);
      await assertion();

      // Clear mocks for next act/assert
      mockUpdate.mockClear();
      mockDelete.mockClear();
    }

    await act(['addr2'], () => {
      expect(mockUpdate).toBeCalled();
      expect(mockDelete).toBeCalled();
    });

    // Act - new accounts were added
    await act(['addr1', 'addr2'], () => {
      expect(mockUpdate).toBeCalled();
      expect(mockDelete).not.toBeCalled();
    });

    // Act - an account was removed
    await act(['addr1'], () => {
      expect(mockUpdate).not.toBeCalled();
      expect(mockDelete).toBeCalled();
    });

    // Act - an account was added and removed
    await act(['addr2'], () => {
      expect(mockUpdate).toBeCalled();
      expect(mockDelete).toBeCalled();
    });
  });

  function arrangeMocks() {
    const messengerMocks = mockNotificationMessenger();
    jest
      .spyOn(ControllerUtils, 'toChecksumHexAddress')
      .mockImplementation((x) => x);

    return messengerMocks;
  }

  async function actPublishKeyringStateChange(
    messenger: ControllerMessenger<never, KeyringControllerStateChangeEvent>,
  ) {
    await messenger.publish(
      'KeyringController:stateChange',
      {} as KeyringControllerState,
      [],
    );
  }
});

// See /utils for more in-depth testing
describe('metamask-notifications - checkAccountsPresence()', () => {
  test('Returns Record with accounts that have notifications enabled', async () => {
    const { messenger, mockPerformGetStorage } = mockNotificationMessenger();
    mockPerformGetStorage.mockResolvedValue(
      JSON.stringify(createMockFullUserStorage()),
    );

    const controller = new MetamaskNotificationsController({ messenger });
    const result = await controller.checkAccountsPresence([
      MOCK_USER_STORAGE_ACCOUNT,
      'fake_account',
    ]);
    expect(result).toEqual({
      [MOCK_USER_STORAGE_ACCOUNT]: true,
      fake_account: false,
    });
  });
});

describe('metamask-notifications - setMetamaskNotificationsEnabled()', () => {
  test('flips enabled state', async () => {
    const { messenger, mockIsSignedIn } = mockNotificationMessenger();
    mockIsSignedIn.mockReturnValue(true);

    const controller = new MetamaskNotificationsController({
      messenger,
      state: { ...defaultState, isMetamaskNotificationsEnabled: false },
    });

    await controller.setMetamaskNotificationsEnabled(true);

    expect(controller.state.isMetamaskNotificationsEnabled).toBe(true);
  });
});

describe('metamask-notifications - setMetamaskNotificationsFeatureSeen()', () => {
  test('flips state when the method is called', async () => {
    const { messenger, mockIsSignedIn } = mockNotificationMessenger();
    mockIsSignedIn.mockReturnValue(true);

    const controller = new MetamaskNotificationsController({
      messenger,
      state: { ...defaultState, isMetamaskNotificationsFeatureSeen: false },
    });

    await controller.setMetamaskNotificationsFeatureSeen();

    expect(controller.state.isMetamaskNotificationsFeatureSeen).toBe(true);
  });

  test('does not update if auth is not enabled', async () => {
    const { messenger, mockIsSignedIn } = mockNotificationMessenger();
    mockIsSignedIn.mockReturnValue(false); // state is off.

    const controller = new MetamaskNotificationsController({
      messenger,
      state: { ...defaultState, isMetamaskNotificationsFeatureSeen: false },
    });

    await expect(() =>
      controller.setMetamaskNotificationsFeatureSeen(),
    ).rejects.toThrow();

    expect(controller.state.isMetamaskNotificationsFeatureSeen).toBe(false); // this flag was never flipped
  });
});

describe('metamask-notifications - setFeatureAnnouncementsEnabled()', () => {
  test('flips state when the method is called', async () => {
    const { messenger, mockIsSignedIn } = mockNotificationMessenger();
    mockIsSignedIn.mockReturnValue(true);

    const controller = new MetamaskNotificationsController({
      messenger,
      state: { ...defaultState, isFeatureAnnouncementsEnabled: false },
    });

    await controller.setFeatureAnnouncementsEnabled(true);

    expect(controller.state.isFeatureAnnouncementsEnabled).toBe(true);
  });

  test('does not update if auth is not enabled', async () => {
    const { messenger, mockIsSignedIn } = mockNotificationMessenger();
    mockIsSignedIn.mockReturnValue(false); // state is off.

    const controller = new MetamaskNotificationsController({
      messenger,
      state: { ...defaultState, isFeatureAnnouncementsEnabled: false },
    });

    await expect(() =>
      controller.setFeatureAnnouncementsEnabled(false),
    ).rejects.toThrow();
    expect(controller.state.isFeatureAnnouncementsEnabled).toBe(false); // this flag was never flipped
  });
});

describe('metamask-notifications - setSnapNotificationsEnabled()', () => {
  test('flips state when the method is called', async () => {
    const { messenger, mockIsSignedIn } = mockNotificationMessenger();
    mockIsSignedIn.mockReturnValue(true);

    const controller = new MetamaskNotificationsController({
      messenger,
      state: { ...defaultState, isSnapNotificationsEnabled: false },
    });

    await controller.setSnapNotificationsEnabled(true);

    expect(controller.state.isSnapNotificationsEnabled).toBe(true);
  });

  test('does not update if auth is not enabled', async () => {
    const { messenger, mockIsSignedIn } = mockNotificationMessenger();
    mockIsSignedIn.mockReturnValue(false); // state is off.

    const controller = new MetamaskNotificationsController({
      messenger,
      state: { ...defaultState, isSnapNotificationsEnabled: false },
    });

    await controller.setSnapNotificationsEnabled(false);

    expect(controller.state.isSnapNotificationsEnabled).toBe(false); // this flag was never flipped
  });
});

describe('metamask-notifications - createOnChainTriggers()', () => {
  test('(Re-Creates) triggers and updates push notification links if using an existing User Storage (login for existing user)', async () => {
    const {
      messenger,
      mockInitializeUserStorage,
      mockEnablePushNotifications,
      mockCreateOnChainTriggers,
    } = arrangeMocks();
    const controller = new MetamaskNotificationsController({ messenger });

    const result = await controller.createOnChainTriggers();
    expect(result).toBeDefined();
    expect(mockInitializeUserStorage).not.toBeCalled(); // not called since we don't need to initialize (this is an existing user)
    expect(mockCreateOnChainTriggers).toBeCalled();
    expect(mockEnablePushNotifications).toBeCalled();
  });

  test('Create new triggers and push notifications if there is no User Storage (login for new user)', async () => {
    const {
      messenger,
      mockInitializeUserStorage,
      mockEnablePushNotifications,
      mockCreateOnChainTriggers,
      mockPerformGetStorage,
    } = arrangeMocks();
    const controller = new MetamaskNotificationsController({ messenger });
    mockPerformGetStorage.mockResolvedValue(null); // Mock no storage found.

    const result = await controller.createOnChainTriggers();
    expect(result).toBeDefined();
    expect(mockInitializeUserStorage).toBeCalled(); // called since no user storage (this is an existing user)
    expect(mockCreateOnChainTriggers).toBeCalled();
    expect(mockEnablePushNotifications).toBeCalled();
  });

  test('Throws if not given a valid auth & storage key', async () => {
    const mocks = arrangeMocks();
    const controller = new MetamaskNotificationsController({
      messenger: mocks.messenger,
    });

    const testScenarios = {
      ...arrangeFailureAuthAssertions(mocks),
      ...arrangeFailureUserStorageKeyAssertions(mocks),
    };

    for (const mockFailureAction of Object.values(testScenarios)) {
      mockFailureAction();
      await expect(controller.createOnChainTriggers()).rejects.toThrow();
    }
  });

  function arrangeMocks() {
    const messengerMocks = mockNotificationMessenger();
    const mockCreateOnChainTriggers = jest
      .spyOn(OnChainNotifications, 'createOnChainTriggers')
      .mockResolvedValue();
    const mockInitializeUserStorage = jest
      .spyOn(MetamaskNotificationsUtils, 'initializeUserStorage')
      .mockReturnValue(createMockUserStorageWithTriggers(['t1', 't2']));
    return {
      ...messengerMocks,
      mockCreateOnChainTriggers,
      mockInitializeUserStorage,
    };
  }
});

describe('metamask-notifications - deleteOnChainTriggersByAccount', () => {
  test('Deletes and disables push notifications for a given account', async () => {
    const {
      messenger,
      nockMockDeleteTriggersAPI,
      mockDisablePushNotifications,
    } = arrangeMocks();
    const controller = new MetamaskNotificationsController({ messenger });
    const result = await controller.deleteOnChainTriggersByAccount([
      MOCK_USER_STORAGE_ACCOUNT,
    ]);
    expect(
      MetamaskNotificationsUtils.traverseUserStorageTriggers(result).length,
    ).toBe(0);
    expect(nockMockDeleteTriggersAPI.isDone()).toBe(true);
    expect(mockDisablePushNotifications).toBeCalled();
  });

  test('Does nothing if account does not exist in storage', async () => {
    const { messenger, mockDisablePushNotifications } = arrangeMocks();
    const controller = new MetamaskNotificationsController({ messenger });
    const result = await controller.deleteOnChainTriggersByAccount([
      'UNKNOWN_ACCOUNT',
    ]);
    expect(
      MetamaskNotificationsUtils.traverseUserStorageTriggers(result).length,
    ).not.toBe(0);

    expect(mockDisablePushNotifications).not.toBeCalled();
  });

  test('Throws errors when invalid auth and storage', async () => {
    const mocks = arrangeMocks();
    const controller = new MetamaskNotificationsController({
      messenger: mocks.messenger,
    });

    const testScenarios = {
      ...arrangeFailureAuthAssertions(mocks),
      ...arrangeFailureUserStorageKeyAssertions(mocks),
      ...arrangeFailureUserStorageAssertions(mocks),
    };

    for (const mockFailureAction of Object.values(testScenarios)) {
      mockFailureAction();
      await expect(
        controller.deleteOnChainTriggersByAccount([MOCK_USER_STORAGE_ACCOUNT]),
      ).rejects.toThrow();
    }
  });

  function arrangeMocks() {
    const messengerMocks = mockNotificationMessenger();
    const nockMockDeleteTriggersAPI = mockBatchDeleteTriggers();
    return { ...messengerMocks, nockMockDeleteTriggersAPI };
  }
});

describe('metamask-notifications - updateOnChainTriggersByAccount()', () => {
  test('Creates Triggers and Push Notification Links for a new account', async () => {
    const {
      messenger,
      mockUpdateTriggerPushNotifications,
      mockPerformSetStorage,
    } = arrangeMocks();
    const MOCK_ACCOUNT = 'MOCK_ACCOUNT2';
    const controller = new MetamaskNotificationsController({ messenger });

    const result = await controller.updateOnChainTriggersByAccount([
      MOCK_ACCOUNT,
    ]);
    expect(
      MetamaskNotificationsUtils.traverseUserStorageTriggers(result, {
        address: MOCK_ACCOUNT.toLowerCase(),
      }).length > 0,
    ).toBe(true);

    expect(mockUpdateTriggerPushNotifications).toBeCalled();
    expect(mockPerformSetStorage).toBeCalled();
  });

  test('Throws errors when invalid auth and storage', async () => {
    const mocks = arrangeMocks();
    const controller = new MetamaskNotificationsController({
      messenger: mocks.messenger,
    });

    const testScenarios = {
      ...arrangeFailureAuthAssertions(mocks),
      ...arrangeFailureUserStorageKeyAssertions(mocks),
      ...arrangeFailureUserStorageAssertions(mocks),
    };

    for (const mockFailureAction of Object.values(testScenarios)) {
      mockFailureAction();
      await expect(
        controller.deleteOnChainTriggersByAccount([MOCK_USER_STORAGE_ACCOUNT]),
      ).rejects.toThrow();
    }
  });

  function arrangeMocks() {
    const messengerMocks = mockNotificationMessenger();
    const mockBatchTriggersAPI = mockBatchCreateTriggers();
    return { ...messengerMocks, mockBatchTriggersAPI };
  }
});

describe('metamask-notifications - fetchAndUpdateMetamaskNotifications()', () => {
  test('Processes and shows feature announcements and wallet notifications', async () => {
    const {
      messenger,
      mockFeatureAnnouncementAPIResult,
      mockListNotificationsAPIResult,
    } = arrangeMocks();
    const controller = new MetamaskNotificationsController({ messenger });

    const result = await controller.fetchAndUpdateMetamaskNotifications();

    // Should have 1 feature announcement and 1 wallet notification
    expect(result.length).toBe(2);
    expect(
      result.find(
        (n) => n.id === mockFeatureAnnouncementAPIResult.items?.[0].fields.id,
      ),
    ).toBeDefined();
    expect(result.find((n) => n.id === mockListNotificationsAPIResult[0].id));

    // State is also updated
    expect(controller.state.metamaskNotificationsList.length).toBe(2);
  });

  test('Only fetches and processes feature announcements if not authenticated', async () => {
    const { messenger, mockGetBearerToken, mockFeatureAnnouncementAPIResult } =
      arrangeMocks();
    mockGetBearerToken.mockRejectedValue(
      new Error('MOCK - failed to get access token'),
    );

    const controller = new MetamaskNotificationsController({ messenger });

    // Should only have feature announcement
    const result = await controller.fetchAndUpdateMetamaskNotifications();
    expect(result.length).toBe(1);
    expect(
      result.find(
        (n) => n.id === mockFeatureAnnouncementAPIResult.items?.[0].fields.id,
      ),
    ).toBeDefined();

    // State is also updated
    expect(controller.state.metamaskNotificationsList.length).toBe(1);
  });

  function arrangeMocks() {
    const messengerMocks = mockNotificationMessenger();

    const mockFeatureAnnouncementAPIResult =
      createMockFeatureAnnouncementAPIResult();
    const mockFeatureAnnouncementsAPI =
      mockFetchFeatureAnnouncementNotifications({
        status: 200,
        body: mockFeatureAnnouncementAPIResult,
      });

    const mockListNotificationsAPIResult = [createMockNotificationEthSent()];
    const mockListNotificationsAPI = mockListNotifications({
      status: 200,
      body: mockListNotificationsAPIResult,
    });
    return {
      ...messengerMocks,
      mockFeatureAnnouncementAPIResult,
      mockFeatureAnnouncementsAPI,
      mockListNotificationsAPIResult,
      mockListNotificationsAPI,
    };
  }
});

describe('metamask-notifications - markMetamaskNotificationsAsRead()', () => {
  test('updates feature announcements and wallet notifications as read', async () => {
    const { messenger } = arrangeMocks();
    const controller = new MetamaskNotificationsController({ messenger });

    await controller.markMetamaskNotificationsAsRead([
      processNotification(createMockFeatureAnnouncementRaw()),
      processNotification(createMockNotificationEthSent()),
    ]);

    // Should see 2 items in controller read state
    expect(controller.state.metamaskNotificationsReadList.length).toBe(2);
  });

  test('should at least mark feature announcements locally if external updates fail', async () => {
    const { messenger } = arrangeMocks({ onChainMarkAsReadFails: true });
    const controller = new MetamaskNotificationsController({ messenger });

    await controller.markMetamaskNotificationsAsRead([
      processNotification(createMockFeatureAnnouncementRaw()),
      processNotification(createMockNotificationEthSent()),
    ]);

    // Should see 1 item in controller read state.
    // This is because on-chain failed.
    // We can debate & change implementation if it makes sense to mark as read locally if external APIs fail.
    expect(controller.state.metamaskNotificationsReadList.length).toBe(1);
  });

  function arrangeMocks(options?: { onChainMarkAsReadFails: boolean }) {
    const messengerMocks = mockNotificationMessenger();

    const mockMarkAsReadAPI = mockMarkNotificationsAsRead({
      status: options?.onChainMarkAsReadFails ? 500 : 200,
    });

    return {
      ...messengerMocks,
      mockMarkAsReadAPI,
    };
  }
});

// Type-Computation - we are extracting args and parameters from a generic type utility
// Thus this `AnyFunc` can be used to help constrain the generic parameters correctly
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunc = (...args: any[]) => any;
const typedMockAction = <Action extends { handler: AnyFunc }>() =>
  jest.fn<ReturnType<Action['handler']>, Parameters<Action['handler']>>();

function mockNotificationMessenger() {
  const globalMessenger = new ControllerMessenger<
    AllowedActions,
    AllowedEvents
  >();

  const messenger = globalMessenger.getRestricted({
    name: 'MetamaskNotificationsController',
    allowedActions: [
      'KeyringController:getAccounts',
      'AuthenticationController:getBearerToken',
      'AuthenticationController:isSignedIn',
      'PushPlatformNotificationsController:disablePushNotifications',
      'PushPlatformNotificationsController:enablePushNotifications',
      'PushPlatformNotificationsController:updateTriggerPushNotifications',
      'UserStorageController:getStorageKey',
      'UserStorageController:performGetStorage',
      'UserStorageController:performSetStorage',
    ],
    allowedEvents: ['KeyringController:stateChange'],
  });

  const mockListAccounts =
    typedMockAction<KeyringControllerGetAccountsAction>().mockResolvedValue([]);

  const mockGetBearerToken =
    typedMockAction<AuthenticationControllerGetBearerToken>().mockResolvedValue(
      MOCK_ACCESS_TOKEN,
    );

  const mockIsSignedIn =
    typedMockAction<AuthenticationControllerIsSignedIn>().mockReturnValue(true);

  const mockDisablePushNotifications =
    typedMockAction<PushNotificationsControllerDisablePushNotifications>();

  const mockEnablePushNotifications =
    typedMockAction<PushNotificationsControllerEnablePushNotifications>();

  const mockUpdateTriggerPushNotifications =
    typedMockAction<PushNotificationsControllerUpdateTriggerPushNotifications>();

  const mockGetStorageKey =
    typedMockAction<UserStorageControllerGetStorageKey>().mockResolvedValue(
      'MOCK_STORAGE_KEY',
    );

  const mockPerformGetStorage =
    typedMockAction<UserStorageControllerPerformGetStorage>().mockResolvedValue(
      JSON.stringify(createMockFullUserStorage()),
    );

  const mockPerformSetStorage =
    typedMockAction<UserStorageControllerPerformSetStorage>();

  jest.spyOn(messenger, 'call').mockImplementation((...args) => {
    const [actionType] = args;

    // This mock implementation does not have a nice discriminate union where types/parameters can be correctly inferred
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [, ...params]: any[] = args;

    if (actionType === 'KeyringController:getAccounts') {
      return mockListAccounts();
    }

    if (actionType === 'AuthenticationController:getBearerToken') {
      return mockGetBearerToken();
    }

    if (actionType === 'AuthenticationController:isSignedIn') {
      return mockIsSignedIn();
    }

    if (
      actionType ===
      'PushPlatformNotificationsController:disablePushNotifications'
    ) {
      return mockDisablePushNotifications(params[0]);
    }

    if (
      actionType ===
      'PushPlatformNotificationsController:enablePushNotifications'
    ) {
      return mockEnablePushNotifications(params[0]);
    }

    if (
      actionType ===
      'PushPlatformNotificationsController:updateTriggerPushNotifications'
    ) {
      return mockUpdateTriggerPushNotifications(params[0]);
    }

    if (actionType === 'UserStorageController:getStorageKey') {
      return mockGetStorageKey();
    }

    if (actionType === 'UserStorageController:performGetStorage') {
      return mockPerformGetStorage(params[0]);
    }

    if (actionType === 'UserStorageController:performSetStorage') {
      return mockPerformSetStorage(params[0], params[1]);
    }

    function exhaustedMessengerMocks(action: never) {
      return new Error(`MOCK_FAIL - unsupported messenger call: ${action}`);
    }
    throw exhaustedMessengerMocks(actionType);
  });

  return {
    globalMessenger,
    messenger,
    mockListAccounts,
    mockGetBearerToken,
    mockIsSignedIn,
    mockDisablePushNotifications,
    mockEnablePushNotifications,
    mockUpdateTriggerPushNotifications,
    mockGetStorageKey,
    mockPerformGetStorage,
    mockPerformSetStorage,
  };
}

function arrangeFailureAuthAssertions(
  mocks: ReturnType<typeof mockNotificationMessenger>,
) {
  const testScenarios = {
    NotLoggedIn: () => mocks.mockIsSignedIn.mockReturnValue(false),

    // unlikely, but in case it returns null
    NoBearerToken: () =>
      mocks.mockGetBearerToken.mockResolvedValueOnce(null as unknown as string),

    RejectedBearerToken: () =>
      mocks.mockGetBearerToken.mockRejectedValueOnce(
        new Error('MOCK - no bearer token'),
      ),
  };

  return testScenarios;
}

function arrangeFailureUserStorageKeyAssertions(
  mocks: ReturnType<typeof mockNotificationMessenger>,
) {
  const testScenarios = {
    NoStorageKey: () =>
      mocks.mockGetStorageKey.mockResolvedValueOnce(null as unknown as string), // unlikely but in case it returns null
    RejectedStorageKey: () =>
      mocks.mockGetStorageKey.mockRejectedValueOnce(
        new Error('MOCK - no storage key'),
      ),
  };
  return testScenarios;
}

function arrangeFailureUserStorageAssertions(
  mocks: ReturnType<typeof mockNotificationMessenger>,
) {
  const testScenarios = {
    NoUserStorage: () =>
      mocks.mockPerformGetStorage.mockResolvedValueOnce(null),
    ThrowUserStorage: () =>
      mocks.mockPerformGetStorage.mockRejectedValueOnce(
        new Error('MOCK - Unable to call storage api'),
      ),
  };
  return testScenarios;
}
