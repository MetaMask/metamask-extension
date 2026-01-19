import {
  ActionConstraint,
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { AccountTrackerController } from '@metamask/assets-controllers';
import {
  AutoManagedNetworkClient,
  CustomNetworkClientConfiguration,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkState,
} from '@metamask/network-controller';
import {
  PreferencesControllerGetStateAction,
  PreferencesState,
} from '@metamask/preferences-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getAccountTrackerControllerMessenger,
  AccountTrackerControllerMessenger,
  getAccountTrackerControllerInitMessenger,
  AccountTrackerControllerInitMessenger,
} from './messengers';
import { AccountTrackerControllerInit } from './account-tracker-controller-init';

jest.mock('@metamask/assets-controllers');

function getInitRequestMock(
  baseMessenger = new Messenger<
    MockAnyNamespace,
    | RemoteFeatureFlagControllerGetStateAction
    | NetworkControllerGetStateAction
    | NetworkControllerGetNetworkClientByIdAction
    | PreferencesControllerGetStateAction
    | ActionConstraint,
    never
  >({ namespace: MOCK_ANY_NAMESPACE }),
): jest.Mocked<
  ControllerInitRequest<
    AccountTrackerControllerMessenger,
    AccountTrackerControllerInitMessenger
  >
> {
  baseMessenger.registerActionHandler(
    'RemoteFeatureFlagController:getState',
    () => ({
      remoteFeatureFlags: {
        assetsAccountApiBalances: ['0x1', '0x38', '0xe708'],
      },
      cacheTimestamp: Date.now(),
    }),
  );

  baseMessenger.registerActionHandler(
    'NetworkController:getState',
    () =>
      ({
        selectedNetworkClientId: '0x1',
      }) as NetworkState,
  );

  baseMessenger.registerActionHandler(
    'NetworkController:getNetworkClientById',
    () =>
      ({
        configuration: { chainId: '0x1' },
      }) as unknown as AutoManagedNetworkClient<CustomNetworkClientConfiguration>,
  );

  baseMessenger.registerActionHandler(
    'PreferencesController:getState',
    () =>
      ({
        useExternalServices: true,
      }) as unknown as PreferencesState,
  );

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAccountTrackerControllerMessenger(baseMessenger),
    initMessenger: getAccountTrackerControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('AccountTrackerControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = AccountTrackerControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(AccountTrackerController);
  });

  it('passes the proper arguments to the controller', () => {
    AccountTrackerControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(AccountTrackerController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      getStakedBalanceForChain: expect.any(Function),
      includeStakedAssets: false,
      allowExternalServices: expect.any(Function),
      accountsApiChainIds: expect.any(Function),
      fetchingEnabled: expect.any(Function),
      isOnboarded: expect.any(Function),
    });
  });

  it('initializes with Account API feature flag configuration', () => {
    AccountTrackerControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(AccountTrackerController);
    const [constructorArgs] = controllerMock.mock.calls[0];

    expect(constructorArgs.accountsApiChainIds).toBeDefined();
    const chainIds = constructorArgs.accountsApiChainIds?.();
    expect(chainIds).toEqual(['0x1', '0x38', '0xe708']);
    expect(chainIds).toContain('0x1'); // Ethereum
    expect(chainIds).toContain('0x38'); // BSC
    expect(chainIds).toContain('0xe708'); // Linea
  });
});
