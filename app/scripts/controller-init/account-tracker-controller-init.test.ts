import { ActionConstraint, Messenger } from '@metamask/base-controller';
import {
  NetworkControllerGetSelectedNetworkClientAction,
  NetworkControllerNetworkDidChangeEvent,
} from '@metamask/network-controller';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import AccountTrackerController from '../controllers/account-tracker-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getAccountTrackerControllerMessenger,
  AccountTrackerControllerMessenger,
  getAccountTrackerControllerInitMessenger,
  AccountTrackerControllerInitMessenger,
} from './messengers';
import { AccountTrackerControllerInit } from './account-tracker-controller-init';

jest.mock('../controllers/account-tracker-controller');

function getInitRequestMock(
  baseMessenger = new Messenger<
    | NetworkControllerGetSelectedNetworkClientAction
    | RemoteFeatureFlagControllerGetStateAction
    | ActionConstraint,
    never
  >(),
): jest.Mocked<
  ControllerInitRequest<
    AccountTrackerControllerMessenger,
    AccountTrackerControllerInitMessenger
  >
> {
  baseMessenger.registerActionHandler(
    'NetworkController:getSelectedNetworkClient',
    () => ({
      // @ts-expect-error: Partial mock.
      provider: {},

      // @ts-expect-error: Partial mock.
      blockTracker: {},
    }),
  );

  baseMessenger.registerActionHandler(
    'RemoteFeatureFlagController:getState',
    () => ({
      remoteFeatureFlags: {
        assetsAccountApiBalances: ['0x1', '0x38', '0xe708'],
      },
      cacheTimestamp: Date.now(),
    }),
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
      state: { accounts: {} },
      provider: expect.any(Object),
      blockTracker: expect.any(Object),
      getNetworkIdentifier: expect.any(Function),
      accountsApiChainIds: expect.any(Function),
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

  it('calls `updateAccounts` when `NetworkController:networkDidChange` is emitted', () => {
    const messenger = new Messenger<
      | NetworkControllerGetSelectedNetworkClientAction
      | RemoteFeatureFlagControllerGetStateAction
      | ActionConstraint,
      NetworkControllerNetworkDidChangeEvent
    >();

    const request = getInitRequestMock(messenger);
    const { controller } = AccountTrackerControllerInit(request);

    expect(controller.updateAccounts).not.toHaveBeenCalled();

    messenger.publish('NetworkController:networkDidChange', {
      selectedNetworkClientId: 'test',
      networkConfigurationsByChainId: {},
      networksMetadata: {},
    });

    expect(controller.updateAccounts).toHaveBeenCalledTimes(1);
  });
});
