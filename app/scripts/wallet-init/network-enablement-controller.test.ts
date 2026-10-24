import {
  Messenger,
  MOCK_ANY_NAMESPACE,
  type MockAnyNamespace,
} from '@metamask/messenger';
import type { NetworkEnablementController } from '@metamask/network-enablement-controller';
import { BtcScope, SolAccountType, SolScope } from '@metamask/keyring-api';
import { KnownCaipNamespace } from '@metamask/utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  getNetworkEnablementControllerInitMessenger,
  type NetworkEnablementControllerInitMessengerActions,
  type NetworkEnablementControllerInitMessengerEvents,
} from './messengers/network-enablement-controller-messenger';
import {
  initializeNetworkEnablementController,
  setupNetworkEnablementControllerListeners,
  withNetworkEnablementControllerTestState,
} from './network-enablement-controller';

type MockController = jest.Mocked<
  Pick<
    NetworkEnablementController,
    | 'enableAllPopularNetworks'
    | 'enableNetwork'
    | 'enableNetworkInNamespace'
    | 'init'
    | 'restoreEnabledNetworkMap'
  >
> & { state: NetworkEnablementController['state'] };

function createMockController(
  enabledNetworkMap: NetworkEnablementController['state']['enabledNetworkMap'] = {},
): MockController {
  return {
    enableAllPopularNetworks: jest.fn(),
    enableNetwork: jest.fn(),
    enableNetworkInNamespace: jest.fn(),
    init: jest.fn().mockResolvedValue(undefined),
    restoreEnabledNetworkMap: jest.fn(),
    state: { enabledNetworkMap, nativeAssetIdentifiers: {} },
  };
}

function setup({
  enabledNetworkMap,
  accounts = [],
  autoEnabledNetworks = {},
}: {
  enabledNetworkMap?: NetworkEnablementController['state']['enabledNetworkMap'];
  accounts?: unknown[];
  autoEnabledNetworks?: Record<string, unknown>;
} = {}) {
  const rootMessenger = new Messenger<
    MockAnyNamespace,
    NetworkEnablementControllerInitMessengerActions,
    NetworkEnablementControllerInitMessengerEvents
  >({ namespace: MOCK_ANY_NAMESPACE });
  rootMessenger.registerActionHandler(
    'AccountTreeController:getAccountsFromSelectedAccountGroup',
    () => accounts as never,
  );
  rootMessenger.registerActionHandler(
    'ConfigRegistryController:getState',
    () => ({ configs: { networks: autoEnabledNetworks } }) as never,
  );

  const controller = createMockController(enabledNetworkMap);
  setupNetworkEnablementControllerListeners({
    controller: controller as unknown as NetworkEnablementController,
    messenger: getNetworkEnablementControllerInitMessenger(rootMessenger),
  });

  return { controller, rootMessenger };
}

const ARC_REGISTRY_NETWORK = {
  'eip155:5042': {
    chainId: 'eip155:5042',
    config: { isActive: true, isAutoEnabled: true, isDeprecated: false },
  },
};

describe('withNetworkEnablementControllerTestState', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns the state unchanged outside of test builds', () => {
    process.env.IN_TEST = '';
    const state = {};

    expect(withNetworkEnablementControllerTestState(state)).toBe(state);
  });

  it('enables only Localhost in test builds without persisted state', () => {
    process.env.IN_TEST = 'true';
    const state = { KeyringController: { vault: 'vault' } };

    expect(withNetworkEnablementControllerTestState(state)).toStrictEqual({
      KeyringController: { vault: 'vault' },
      NetworkEnablementController: {
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: { [CHAIN_IDS.LOCALHOST]: true },
        },
        nativeAssetIdentifiers: {},
      },
    });
  });

  it('keeps persisted state in test builds', () => {
    process.env.IN_TEST = 'true';
    const state = {
      NetworkEnablementController: {
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: { [CHAIN_IDS.MAINNET]: true },
        },
      },
    };

    expect(withNetworkEnablementControllerTestState(state)).toBe(state);
  });
});

describe('initializeNetworkEnablementController', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  [
    ['production', ''],
    ['production', 'true'],
    ['testing', ''],
  ].forEach(([environment, debug]) => {
    it(`enables all popular networks on fresh ${environment} builds before initializing`, () => {
      process.env.METAMASK_DEBUG = debug;
      process.env.METAMASK_ENVIRONMENT = environment;
      process.env.IN_TEST = '';
      const controller = createMockController();

      initializeNetworkEnablementController({
        controller: controller as unknown as NetworkEnablementController,
        state: {},
      });

      expect(controller.enableAllPopularNetworks).toHaveBeenCalledTimes(1);
      expect(controller.init).toHaveBeenCalledTimes(1);
      expect(
        controller.enableAllPopularNetworks.mock.invocationCallOrder[0],
      ).toBeLessThan(controller.init.mock.invocationCallOrder[0]);
    });
  });

  it('does not enable popular networks in test builds', () => {
    process.env.IN_TEST = 'true';
    const controller = createMockController();

    initializeNetworkEnablementController({
      controller: controller as unknown as NetworkEnablementController,
      state: {},
    });

    expect(controller.enableAllPopularNetworks).not.toHaveBeenCalled();
    expect(controller.init).toHaveBeenCalledTimes(1);
  });

  it('does not enable popular networks when an enabled network map is persisted', () => {
    process.env.IN_TEST = '';
    const controller = createMockController();

    initializeNetworkEnablementController({
      controller: controller as unknown as NetworkEnablementController,
      state: { NetworkEnablementController: { enabledNetworkMap: {} } },
    });

    expect(controller.enableAllPopularNetworks).not.toHaveBeenCalled();
    expect(controller.init).toHaveBeenCalledTimes(1);
  });

  it('logs initialization errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const error = new Error('init failed');
    const controller = createMockController();
    controller.init.mockRejectedValueOnce(error);

    initializeNetworkEnablementController({
      controller: controller as unknown as NetworkEnablementController,
      state: { NetworkEnablementController: { enabledNetworkMap: {} } },
    });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    consoleErrorSpy.mockRestore();
  });
});

describe('setupNetworkEnablementControllerListeners', () => {
  it('enables the Solana network when `AccountsController:selectedAccountChange` is emitted for a Solana account', () => {
    const { controller, rootMessenger } = setup();

    rootMessenger.publish('AccountsController:selectedAccountChange', {
      type: SolAccountType.DataAccount,
    } as never);

    expect(controller.enableNetworkInNamespace).toHaveBeenCalledWith(
      SolScope.Mainnet,
      KnownCaipNamespace.Solana,
    );
  });

  it('enables Ethereum when the only enabled network is Solana mainnet and there are no Solana accounts', () => {
    const { controller, rootMessenger } = setup({
      enabledNetworkMap: { solana: { [SolScope.Mainnet]: true } },
    });

    rootMessenger.publish(
      'AccountTreeController:selectedAccountGroupChange',
      '' as never,
      '' as never,
    );

    expect(controller.enableNetwork).toHaveBeenCalledWith('0x1');
  });

  it('enables Ethereum when the only enabled network is Bitcoin mainnet and there are no Bitcoin accounts', () => {
    const { controller, rootMessenger } = setup({
      enabledNetworkMap: { bip122: { [BtcScope.Mainnet]: true } },
    });

    rootMessenger.publish(
      'AccountTreeController:selectedAccountGroupChange',
      '' as never,
      '' as never,
    );

    expect(controller.enableNetwork).toHaveBeenCalledWith('0x1');
  });

  it('does not enable Ethereum when the selected account group has accounts', () => {
    const { controller, rootMessenger } = setup({
      enabledNetworkMap: { solana: { [SolScope.Mainnet]: true } },
      accounts: [{ type: SolAccountType.DataAccount }],
    });

    rootMessenger.publish(
      'AccountTreeController:selectedAccountGroupChange',
      '' as never,
      '' as never,
    );

    expect(controller.enableNetwork).not.toHaveBeenCalled();
  });

  it('does not enable Ethereum when multiple networks are enabled', () => {
    const { controller, rootMessenger } = setup({
      enabledNetworkMap: {
        solana: { [SolScope.Mainnet]: true },
        bip122: { [BtcScope.Mainnet]: true },
      },
    });

    rootMessenger.publish(
      'AccountTreeController:selectedAccountGroupChange',
      '' as never,
      '' as never,
    );

    expect(controller.enableNetwork).not.toHaveBeenCalled();
  });

  (
    [
      [
        'a single filter',
        { [CHAIN_IDS.LOCALHOST]: true, [CHAIN_IDS.ARC]: false },
      ],
      [
        'all-default mode',
        {
          [CHAIN_IDS.MAINNET]: true,
          [CHAIN_IDS.POLYGON]: true,
          [CHAIN_IDS.ARC]: false,
        },
      ],
    ] as const
  ).forEach(([description, eip155Networks]) => {
    it(`preserves ${description} when Config Registry auto-adds Arc`, async () => {
      const { controller, rootMessenger } = setup({
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: { ...eip155Networks },
        },
        autoEnabledNetworks: ARC_REGISTRY_NETWORK,
      });

      rootMessenger.publish('NetworkController:networkAdded', {
        chainId: CHAIN_IDS.ARC,
      } as never);

      controller.state.enabledNetworkMap[KnownCaipNamespace.Eip155][
        CHAIN_IDS.ARC
      ] = true;
      rootMessenger.publish(
        'NetworkEnablementController:stateChange',
        { enabledNetworkMap: controller.state.enabledNetworkMap } as never,
        [] as never,
      );

      await new Promise<void>((resolve) => queueMicrotask(resolve));

      expect(controller.restoreEnabledNetworkMap).toHaveBeenCalledWith({
        [KnownCaipNamespace.Eip155]: eip155Networks,
      });
    });
  });

  it('does not restore the filter when a non-registry network is added', () => {
    const { controller, rootMessenger } = setup({
      enabledNetworkMap: {
        [KnownCaipNamespace.Eip155]: {
          [CHAIN_IDS.LOCALHOST]: true,
          [CHAIN_IDS.ARC]: false,
        },
      },
    });

    rootMessenger.publish('NetworkController:networkAdded', {
      chainId: CHAIN_IDS.ARC,
    } as never);

    expect(controller.restoreEnabledNetworkMap).not.toHaveBeenCalled();
  });
});
