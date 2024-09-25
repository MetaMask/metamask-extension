import { ControllerMessenger } from '@metamask/base-controller';
import * as ControllerUtils from '@metamask/controller-utils';
import {
  KeyringControllerGetAccountsAction,
  KeyringControllerState,
  KeyringControllerStateChangeEvent,
} from '@metamask/keyring-controller';
import { waitFor } from '@testing-library/react';
import {
  AuthenticationController,
  UserStorageController,
} from '@metamask/profile-sync-controller';
import {
  PushPlatformNotificationsControllerEnablePushNotifications,
  PushPlatformNotificationsControllerDisablePushNotifications,
  PushPlatformNotificationsControllerUpdateTriggerPushNotifications,
} from '../push-platform-notifications/push-platform-notifications';
import {
  AllowedActions,
  AllowedEvents,
  MetamaskNotificationsController,
  defaultState,
} from './metamask-notifications';
import {
  createMockFeatureAnnouncementAPIResult,
  createMockFeatureAnnouncementRaw,
} from './mocks/mock-feature-announcements';
import {
  MOCK_USER_STORAGE_ACCOUNT,
  createMockFullUserStorage,
  createMockUserStorageWithTriggers,
} from './mocks/mock-notification-user-storage';
import {
  mockFetchFeatureAnnouncementNotifications,
  mockBatchCreateTriggers,
  mockBatchDeleteTriggers,
  mockListNotifications,
  mockMarkNotificationsAsRead,
} from './mocks/mockServices';
import { createMockNotificationEthSent } from './mocks/mock-raw-notifications';
import { processNotification } from './processors/process-notifications';
import * as OnChainNotifications from './services/onchain-notifications';
import { UserStorage } from './types/user-storage/user-storage';
import * as MetamaskNotificationsUtils from './utils/utils';

const AuthMocks = AuthenticationController.Mocks;

// Mock type used for testing purposes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockVar = any;

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

  test('Keyring Change Event with new triggers will update triggers correctly', async () => {
    const { messenger, globalMessenger, mockListAccounts } = arrangeMocks();

    // initialize controller with 1 address
    const controller = new MetamaskNotificationsController({
      messenger,
      state: {
        isMetamaskNotificationsEnabled: true,
        subscriptionAccountsSeen: ['addr1'],
      },
    });

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

    // Act - if list accounts has been seen, then will not update
    await act(['addr1'], () => {
      expect(mockUpdate).not.toBeCalled();
      expect(mockDelete).not.toBeCalled();
    });

    // Act - if a new address in list, then will update
    await act(['addr1', 'addr2'], () => {
      expect(mockUpdate).toBeCalled();
      expect(mockDelete).not.toBeCalled();
    });

    // Act - if the list doesn't have an address, then we need to delete
    await act(['addr2'], () => {
      expect(mockUpdate).not.toBeCalled();
      expect(mockDelete).toBeCalled();
    });

    // If the address is added back to the list, because it is seen we won't update
    await act(['addr1', 'addr2'], () => {
      expect(mockUpdate).not.toBeCalled();
      expect(mockDelete).not.toBeCalled();
    });
  });

  test('Initializes push notifications', async () => {
    const { messenger, mockEnablePushNotifications } = arrangeMocks();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _controller = new MetamaskNotificationsController({
      messenger,
      state: { isMetamaskNotificationsEnabled: true },
    });

    await waitFor(() => {
      expect(mockEnablePushNotifications).toBeCalled();
    });
  });

  test('Fails to initialize push notifications', async () => {
    const { messenger, mockPerformGetStorage, mockEnablePushNotifications } =
      arrangeMocks();

    // test when user storage is empty
    mockPerformGetStorage.mockResolvedValue(null);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _controller = new MetamaskNotificationsController({
      messenger,
      state: { isMetamaskNotificationsEnabled: true },
    });

    await waitFor(() => {
      expect(mockPerformGetStorage).toBeCalled();
    });

    expect(mockEnablePushNotifications).not.toBeCalled();
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
});

describe('metamask-notifications - createOnChainTriggers()', () => {
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

    const controller = new MetamaskNotificationsController({
      messenger,
      state: { ...defaultState, isFeatureAnnouncementsEnabled: true },
    });

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

    const controller = new MetamaskNotificationsController({
      messenger,
      state: { ...defaultState, isFeatureAnnouncementsEnabled: true },
    });

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
  test('updates feature announcements as read', async () => {
    const { messenger } = arrangeMocks();
    const controller = new MetamaskNotificationsController({ messenger });

    await controller.markMetamaskNotificationsAsRead([
      processNotification(createMockFeatureAnnouncementRaw()),
      processNotification(createMockNotificationEthSent()),
    ]);

    // Should see 2 items in controller read state
    expect(controller.state.metamaskNotificationsReadList.length).toBe(1);
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

describe('metamask-notifications - enableMetamaskNotifications()', () => {
  it('create new notifications when switched on and no new notifications', async () => {
    const mocks = arrangeMocks();
    mocks.mockListAccounts.mockResolvedValue(['0xAddr1']);
    const controller = new MetamaskNotificationsController({
      messenger: mocks.messenger,
    });

    const promise = controller.enableMetamaskNotifications();

    // Act - intermediate state
    expect(controller.state.isUpdatingMetamaskNotifications).toBe(true);

    await promise;

    // Act - final state
    expect(controller.state.isUpdatingMetamaskNotifications).toBe(false);
    expect(controller.state.isMetamaskNotificationsEnabled).toBe(true);

    // Act - services called
    expect(mocks.mockCreateOnChainTriggers).toBeCalled();
  });

  it('not create new notifications when enabling an account already in storage', async () => {
    const mocks = arrangeMocks();
    mocks.mockListAccounts.mockResolvedValue(['0xAddr1']);
    const userStorage = createMockFullUserStorage({ address: '0xAddr1' });
    mocks.mockPerformGetStorage.mockResolvedValue(JSON.stringify(userStorage));
    const controller = new MetamaskNotificationsController({
      messenger: mocks.messenger,
    });

    await controller.enableMetamaskNotifications();

    const existingTriggers =
      MetamaskNotificationsUtils.getAllUUIDs(userStorage);
    const upsertedTriggers =
      mocks.mockCreateOnChainTriggers.mock.calls[0][3].map((t) => t.id);

    expect(existingTriggers).toEqual(upsertedTriggers);
  });

  function arrangeMocks() {
    const messengerMocks = mockNotificationMessenger();

    const mockCreateOnChainTriggers = jest
      .spyOn(OnChainNotifications, 'createOnChainTriggers')
      .mockResolvedValue();

    return { ...messengerMocks, mockCreateOnChainTriggers };
  }
});

describe('metamask-notifications - disableMetamaskNotifications()', () => {
  it('disable notifications and turn off push notifications', async () => {
    const mocks = arrangeMocks();
    const controller = new MetamaskNotificationsController({
      messenger: mocks.messenger,
      state: { isMetamaskNotificationsEnabled: true },
    });

    const promise = controller.disableMetamaskNotifications();

    // Act - intermediate state
    expect(controller.state.isUpdatingMetamaskNotifications).toBe(true);

    await promise;

    // Act - final state
    expect(controller.state.isUpdatingMetamaskNotifications).toBe(false);
    expect(controller.state.isMetamaskNotificationsEnabled).toBe(false);

    expect(mocks.mockDisablePushNotifications).toBeCalled();

    // We do not delete triggers when disabling notifications
    // As other devices might be using those triggers to receive notifications
    expect(mocks.mockDeleteOnChainTriggers).not.toBeCalled();
  });

  function arrangeMocks() {
    const messengerMocks = mockNotificationMessenger();

    const mockDeleteOnChainTriggers = jest
      .spyOn(OnChainNotifications, 'deleteOnChainTriggers')
      .mockResolvedValue({} as UserStorage);

    return { ...messengerMocks, mockDeleteOnChainTriggers };
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
      'KeyringController:getState',
      'AuthenticationController:getBearerToken',
      'AuthenticationController:isSignedIn',
      'PushPlatformNotificationsController:disablePushNotifications',
      'PushPlatformNotificationsController:enablePushNotifications',
      'PushPlatformNotificationsController:updateTriggerPushNotifications',
      'UserStorageController:getStorageKey',
      'UserStorageController:performGetStorage',
      'UserStorageController:performSetStorage',
      'UserStorageController:enableProfileSyncing',
    ],
    allowedEvents: [
      'KeyringController:stateChange',
      'KeyringController:lock',
      'KeyringController:unlock',
      'PushPlatformNotificationsController:onNewNotifications',
    ],
  });

  const mockListAccounts =
    typedMockAction<KeyringControllerGetAccountsAction>().mockResolvedValue([]);

  const mockGetBearerToken =
    typedMockAction<AuthenticationController.AuthenticationControllerGetBearerToken>().mockResolvedValue(
      AuthMocks.MOCK_ACCESS_TOKEN,
    );

  const mockIsSignedIn =
    typedMockAction<AuthenticationController.AuthenticationControllerIsSignedIn>().mockReturnValue(
      true,
    );

  const mockDisablePushNotifications =
    typedMockAction<PushPlatformNotificationsControllerDisablePushNotifications>();

  const mockEnablePushNotifications =
    typedMockAction<PushPlatformNotificationsControllerEnablePushNotifications>();

  const mockUpdateTriggerPushNotifications =
    typedMockAction<PushPlatformNotificationsControllerUpdateTriggerPushNotifications>();

  const mockGetStorageKey =
    typedMockAction<UserStorageController.UserStorageControllerGetStorageKey>().mockResolvedValue(
      'MOCK_STORAGE_KEY',
    );

  const mockEnableProfileSyncing =
    typedMockAction<UserStorageController.UserStorageControllerEnableProfileSyncing>();

  const mockPerformGetStorage =
    typedMockAction<UserStorageController.UserStorageControllerPerformGetStorage>().mockResolvedValue(
      JSON.stringify(createMockFullUserStorage()),
    );

  const mockPerformSetStorage =
    typedMockAction<UserStorageController.UserStorageControllerPerformSetStorage>();

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

    if (actionType === 'UserStorageController:enableProfileSyncing') {
      return mockEnableProfileSyncing();
    }

    if (actionType === 'UserStorageController:performGetStorage') {
      return mockPerformGetStorage(params[0]);
    }

    if (actionType === 'UserStorageController:performSetStorage') {
      return mockPerformSetStorage(params[0], params[1]);
    }

    if (actionType === 'KeyringController:getState') {
      return { isUnlocked: true } as MockVar;
    }

    throw new Error(`MOCK_FAIL - unsupported messenger call: ${actionType}`);
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
