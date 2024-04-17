import { ControllerMessenger } from '@metamask/base-controller';
import {
  AllowedActions,
  AllowedEvents,
  MetamaskNotificationsController,
  PushNotificationsControllerDisablePushNotifications,
  PushNotificationsControllerEnablePushNotifications,
  PushNotificationsControllerUpdateTriggerPushNotifications,
  UserStorageControllerGetStorageKey,
  UserStorageControllerPerformGetStorage,
  UserStorageControllerPerformSetStorage,
  defaultState,
} from './metamask-notifications';
import { AccountsControllerListAccountsAction } from '@metamask/accounts-controller';
import {
  AuthenticationControllerGetBearerToken,
  AuthenticationControllerIsSignedIn,
} from '../authentication/authentication-controller';
import { MOCK_ACCESS_TOKEN } from '../authentication/mocks/mockServices';
import {
  MOCK_USER_STORAGE_ACCOUNT,
  createMockFullUserStorage,
} from './mocks/mock-notification-user-storage';
import * as ControllerUtils from '@metamask/controller-utils';
import { UserStorage } from './types/user-storage/user-storage';

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

  test('initializes with known accounts', () => {
    arrangeMocks();
    const { messenger, mockListAccounts } = mockNotificationMessenger();
    mockListAccounts.mockReturnValue([
      { address: '0x465357FAd4FF8e216cac51661b18BA7619fF9fC3' },
      { address: '0xC6c9eAF82C1f5C2589aFaA7E251f28e7F12Ccafd' },
    ]);

    const controller = new MetamaskNotificationsController({ messenger });
    expect(controller.state.metamaskNotificationsAddressRegistry.length).toBe(
      2,
    );
  });

  test('Account Switch to new account will new account added', async () => {
    arrangeMocks();
    const { messenger, globalMessenger } = mockNotificationMessenger();
    const controller = new MetamaskNotificationsController({
      messenger,
    });

    // Mocking since we don't want to invoke actual updates
    jest
      .spyOn(controller, 'updateOnChainTriggersByAccount')
      .mockResolvedValue({} as UserStorage);

    // State 1 (empty)
    expect(controller.state.metamaskNotificationsAddressRegistry.length).toBe(
      0,
    );

    // State 2 (1 item)
    await globalMessenger.publish('AccountsController:selectedAccountChange', [
      { address: '0x465357FAd4FF8e216cac51661b18BA7619fF9fC3' },
    ]);
    expect(controller.state.metamaskNotificationsAddressRegistry.length).toBe(
      1,
    );

    // State 3 (1 item since duplicate)
    await globalMessenger.publish('AccountsController:selectedAccountChange', [
      { address: '0x465357FAd4FF8e216cac51661b18BA7619fF9fC3' },
    ]);
    expect(controller.state.metamaskNotificationsAddressRegistry.length).toBe(
      1,
    );
  });

  function arrangeMocks() {
    jest
      .spyOn(ControllerUtils, 'toChecksumHexAddress')
      .mockImplementation((x) => x);
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

describe('metamask-notifications - toggleMetamaskNotificationsEnabled()', () => {
  test('flips enabled state', async () => {
    const { messenger, mockIsSignedIn } = mockNotificationMessenger();
    mockIsSignedIn.mockReturnValue(true);

    const controller = new MetamaskNotificationsController({
      messenger,
      state: { ...defaultState, isMetamaskNotificationsEnabled: false },
    });

    await controller.toggleMetamaskNotificationsEnabled();

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

    await controller.setMetamaskNotificationsFeatureSeen();

    expect(controller.state.isMetamaskNotificationsFeatureSeen).toBe(false); // this flag was never flipped
  });
});

describe('metamask-notifications - toggleFeatureAnnouncementsEnabled()', () => {
  test('flips state when the method is called', async () => {
    const { messenger, mockIsSignedIn } = mockNotificationMessenger();
    mockIsSignedIn.mockReturnValue(true);

    const controller = new MetamaskNotificationsController({
      messenger,
      state: { ...defaultState, isFeatureAnnouncementsEnabled: false },
    });

    await controller.toggleFeatureAnnouncementsEnabled();

    expect(controller.state.isFeatureAnnouncementsEnabled).toBe(true);
  });

  test('does not update if auth is not enabled', async () => {
    const { messenger, mockIsSignedIn } = mockNotificationMessenger();
    mockIsSignedIn.mockReturnValue(false); // state is off.

    const controller = new MetamaskNotificationsController({
      messenger,
      state: { ...defaultState, isFeatureAnnouncementsEnabled: false },
    });

    await controller.toggleFeatureAnnouncementsEnabled();

    expect(controller.state.isFeatureAnnouncementsEnabled).toBe(false); // this flag was never flipped
  });
});

describe('metamask-notifications - toggleSnapNotificationsEnabled()', () => {
  test('flips state when the method is called', async () => {
    const { messenger, mockIsSignedIn } = mockNotificationMessenger();
    mockIsSignedIn.mockReturnValue(true);

    const controller = new MetamaskNotificationsController({
      messenger,
      state: { ...defaultState, isSnapNotificationsEnabled: false },
    });

    await controller.toggleSnapNotificationsEnabled();

    expect(controller.state.isSnapNotificationsEnabled).toBe(true);
  });

  test('does not update if auth is not enabled', async () => {
    const { messenger, mockIsSignedIn } = mockNotificationMessenger();
    mockIsSignedIn.mockReturnValue(false); // state is off.

    const controller = new MetamaskNotificationsController({
      messenger,
      state: { ...defaultState, isSnapNotificationsEnabled: false },
    });

    await controller.toggleSnapNotificationsEnabled();

    expect(controller.state.isSnapNotificationsEnabled).toBe(false); // this flag was never flipped
  });
});

// This is hard to test since the utils and services are classes (we need to instantiate a new version - much harder than mocking!!)
// describe('metamask-notifications - createOnChainTriggers()', () => {});

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
      'AccountsController:listAccounts',
      'AuthenticationController:getBearerToken',
      'AuthenticationController:isSignedIn',
      'PushPlatformNotificationsController:disablePushNotifications',
      'PushPlatformNotificationsController:enablePushNotifications',
      'PushPlatformNotificationsController:updateTriggerPushNotifications',
      'UserStorageController:getStorageKey',
      'UserStorageController:performGetStorage',
      'UserStorageController:performSetStorage',
    ],
    allowedEvents: ['AccountsController:selectedAccountChange'],
  });

  const mockListAccounts =
    typedMockAction<AccountsControllerListAccountsAction>().mockReturnValue([]);

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
    const [_, ...params]: any[] = args;

    if (actionType === 'AccountsController:listAccounts') {
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
