import {
  Messenger,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import type {
  NetworkEnablementController,
  NetworkEnablementControllerState,
} from '@metamask/network-enablement-controller';
import { BtcScope, SolAccountType, SolScope } from '@metamask/keyring-api';
import { KnownCaipNamespace } from '@metamask/utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import type {
  NetworkEnablementControllerInitMessengerActions,
  NetworkEnablementControllerInitMessengerEvents,
} from './messengers/network-enablement-controller-messenger';
import { setupNetworkEnablementController } from './network-enablement-controller';

const ARC_CAIP_CHAIN_ID = 'eip155:5042';

type TestMessenger = Messenger<
  MockAnyNamespace,
  NetworkEnablementControllerInitMessengerActions,
  NetworkEnablementControllerInitMessengerEvents
>;

function getMessenger(captureException = jest.fn()): TestMessenger {
  return new Messenger({ namespace: MOCK_ANY_NAMESPACE, captureException });
}

function getNetworkEnablementControllerMock(
  enabledNetworkMap: NetworkEnablementControllerState['enabledNetworkMap'] = {},
) {
  return {
    state: { enabledNetworkMap, nativeAssetIdentifiers: {} },
    init: jest.fn().mockResolvedValue(undefined),
    enableNetwork: jest.fn(),
    enableAllPopularNetworks: jest.fn(),
    enableNetworkInNamespace: jest.fn(),
    restoreEnabledNetworkMap: jest.fn(),
  } as unknown as jest.Mocked<NetworkEnablementController>;
}

function registerConfigRegistryNetworks(
  messenger: TestMessenger,
  networks: Record<string, unknown>,
) {
  messenger.registerActionHandler(
    'ConfigRegistryController:getState',
    () => ({ configs: { networks } }) as never,
  );
}

function setup({
  messenger = getMessenger(),
  networkEnablementController = getNetworkEnablementControllerMock(),
  persistedState = {},
}: {
  messenger?: TestMessenger;
  networkEnablementController?: jest.Mocked<NetworkEnablementController>;
  persistedState?: Parameters<
    typeof setupNetworkEnablementController
  >[0]['persistedState'];
} = {}) {
  setupNetworkEnablementController({
    networkEnablementController,
    messenger,
    persistedState,
  });

  return { messenger, networkEnablementController };
}

describe('setupNetworkEnablementController', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.useRealTimers();
  });

  it('initializes the controller', () => {
    const { networkEnablementController } = setup();

    expect(networkEnablementController.init).toHaveBeenCalledTimes(1);
  });

  it('reports a failed initialization', async () => {
    const captureException = jest.fn();
    const networkEnablementController = getNetworkEnablementControllerMock();
    networkEnablementController.init.mockRejectedValue(new Error('failed'));

    setup({
      messenger: getMessenger(captureException),
      networkEnablementController,
    });
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(captureException).toHaveBeenCalledWith(new Error('failed'));
  });

  it('enables all popular networks on a fresh install', () => {
    process.env.IN_TEST = '';

    const { networkEnablementController } = setup();

    expect(
      networkEnablementController.enableAllPopularNetworks,
    ).toHaveBeenCalledTimes(1);
    expect(networkEnablementController.enableNetwork).not.toHaveBeenCalled();
  });

  it('enables only localhost on a fresh install in test builds', () => {
    process.env.IN_TEST = 'true';

    const { networkEnablementController } = setup();

    expect(networkEnablementController.enableNetwork).toHaveBeenCalledWith(
      CHAIN_IDS.LOCALHOST,
    );
    expect(
      networkEnablementController.enableAllPopularNetworks,
    ).not.toHaveBeenCalled();
  });

  it('keeps the persisted network selection', () => {
    process.env.IN_TEST = '';

    const { networkEnablementController } = setup({
      persistedState: {
        NetworkEnablementController: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: { [CHAIN_IDS.MAINNET]: true },
          },
          nativeAssetIdentifiers: {},
        },
      },
    });

    expect(
      networkEnablementController.enableAllPopularNetworks,
    ).not.toHaveBeenCalled();
    expect(networkEnablementController.enableNetwork).not.toHaveBeenCalled();
  });

  it('enables the Solana network when `AccountsController:selectedAccountChange` is emitted', () => {
    const { messenger, networkEnablementController } = setup();

    messenger.publish(
      'AccountsController:selectedAccountChange',
      // @ts-expect-error: Partial mock.
      { type: SolAccountType.DataAccount },
    );

    expect(
      networkEnablementController.enableNetworkInNamespace,
    ).toHaveBeenCalledWith(SolScope.Mainnet, KnownCaipNamespace.Solana);
  });

  (
    [
      ['Solana', KnownCaipNamespace.Solana, SolScope.Mainnet],
      ['Bitcoin', KnownCaipNamespace.Bip122, BtcScope.Mainnet],
    ] as const
  ).forEach(([name, namespace, chainId]) => {
    it(`enables Ethereum when \`AccountTreeController:selectedAccountGroupChange\` is emitted, only ${name} mainnet is enabled, and there are no matching accounts`, () => {
      const messenger = getMessenger();
      messenger.registerActionHandler(
        'AccountTreeController:getAccountsFromSelectedAccountGroup',
        () => [],
      );
      const { networkEnablementController } = setup({
        messenger,
        networkEnablementController: getNetworkEnablementControllerMock({
          [namespace]: { [chainId]: true },
        }),
      });
      networkEnablementController.enableNetwork.mockClear();

      messenger.publish(
        'AccountTreeController:selectedAccountGroupChange',
        '',
        '',
      );

      expect(networkEnablementController.enableNetwork).toHaveBeenCalledWith(
        '0x1',
      );
    });
  });

  it('does not enable Ethereum when `AccountTreeController:selectedAccountGroupChange` is emitted and there are accounts', () => {
    const messenger = getMessenger();
    messenger.registerActionHandler(
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      // @ts-expect-error: Partial mock.
      () => [{ type: SolAccountType.DataAccount }],
    );
    const { networkEnablementController } = setup({
      messenger,
      networkEnablementController: getNetworkEnablementControllerMock({
        [KnownCaipNamespace.Solana]: { [SolScope.Mainnet]: true },
      }),
    });
    networkEnablementController.enableNetwork.mockClear();

    messenger.publish(
      'AccountTreeController:selectedAccountGroupChange',
      '',
      '',
    );

    expect(networkEnablementController.enableNetwork).not.toHaveBeenCalled();
  });

  it('does not enable Ethereum when `AccountTreeController:selectedAccountGroupChange` is emitted and multiple networks are enabled', () => {
    const messenger = getMessenger();
    messenger.registerActionHandler(
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      () => [],
    );
    const { networkEnablementController } = setup({
      messenger,
      networkEnablementController: getNetworkEnablementControllerMock({
        [KnownCaipNamespace.Solana]: { [SolScope.Mainnet]: true },
        [KnownCaipNamespace.Bip122]: { [BtcScope.Mainnet]: true },
      }),
    });
    networkEnablementController.enableNetwork.mockClear();

    messenger.publish(
      'AccountTreeController:selectedAccountGroupChange',
      '',
      '',
    );

    expect(networkEnablementController.enableNetwork).not.toHaveBeenCalled();
  });

  (
    [
      [
        'a single filter',
        {
          [CHAIN_IDS.LOCALHOST]: true,
          [CHAIN_IDS.ARC]: false,
        },
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
  ).forEach(([name, evmNetworks]) => {
    it(`preserves ${name} when Config Registry auto-adds a network`, async () => {
      const messenger = getMessenger();
      registerConfigRegistryNetworks(messenger, {
        [ARC_CAIP_CHAIN_ID]: {
          chainId: ARC_CAIP_CHAIN_ID,
          config: { isActive: true, isAutoEnabled: true, isDeprecated: false },
        },
      });
      const { networkEnablementController } = setup({
        messenger,
        persistedState: {
          NetworkEnablementController: {
            enabledNetworkMap: {},
            nativeAssetIdentifiers: {},
          },
        },
        networkEnablementController: getNetworkEnablementControllerMock({
          [KnownCaipNamespace.Eip155]: { ...evmNetworks },
        }),
      });

      messenger.publish(
        'NetworkController:networkAdded',
        // @ts-expect-error: Partial mock.
        { chainId: CHAIN_IDS.ARC },
      );
      messenger.publish(
        'NetworkEnablementController:stateChange',
        {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              ...evmNetworks,
              [CHAIN_IDS.ARC]: true,
            },
          },
          nativeAssetIdentifiers: {},
        },
        [],
      );
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      expect(
        networkEnablementController.restoreEnabledNetworkMap,
      ).toHaveBeenCalledWith({ [KnownCaipNamespace.Eip155]: evmNetworks });
    });
  });

  it('does not restore the selection when a non-registry network is added', () => {
    const messenger = getMessenger();
    registerConfigRegistryNetworks(messenger, {});
    const { networkEnablementController } = setup({ messenger });

    messenger.publish(
      'NetworkController:networkAdded',
      // @ts-expect-error: Partial mock.
      { chainId: CHAIN_IDS.ARC },
    );

    expect(
      networkEnablementController.restoreEnabledNetworkMap,
    ).not.toHaveBeenCalled();
  });

  it('reports a timeout when an auto-added network is never enabled', async () => {
    jest.useFakeTimers();
    const captureException = jest.fn();
    const messenger = getMessenger(captureException);
    registerConfigRegistryNetworks(messenger, {
      [ARC_CAIP_CHAIN_ID]: {
        chainId: ARC_CAIP_CHAIN_ID,
        config: { isActive: true, isAutoEnabled: true, isDeprecated: false },
      },
    });
    const { networkEnablementController } = setup({ messenger });

    messenger.publish(
      'NetworkController:networkAdded',
      // @ts-expect-error: Partial mock.
      { chainId: CHAIN_IDS.ARC },
    );
    await jest.advanceTimersByTimeAsync(30_000);

    expect(captureException).toHaveBeenCalledWith(
      new Error(`Timed out waiting for ${CHAIN_IDS.ARC} to be enabled`),
    );
    expect(
      networkEnablementController.restoreEnabledNetworkMap,
    ).not.toHaveBeenCalled();
  });
});
