import type { MoneyAccountUpgradeController } from '@metamask/money-account-upgrade-controller';
import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/chain-ids';
import { FEATURED_RPCS } from '../../../../shared/constants/network';
import { MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME } from '../../../../shared/lib/money/feature-flags';
import { MONEY_ACCOUNT_VAULT_CONFIG_FLAG_NAME } from '../../../../shared/lib/money/vault-config';
import { captureException } from '../../../../shared/lib/sentry';
import { deriveMoneyAccountAddress } from './get-money-account-address';
import {
  MoneyAccountUpgradeService,
  type MoneyAccountUpgradeServiceMessenger,
} from './money-account-upgrade-service';
import { upgradeAccountWithRetry } from './upgrade-account-with-retry';

jest.mock('../../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));
jest.mock('./get-money-account-address');
jest.mock('./upgrade-account-with-retry');

const MONEY_ADDRESS = '0xD5FE9B0579443E7025Cf3309Ba420977710e7183' as Hex;
const MONEY_ADDRESS_LOWERCASED =
  MONEY_ADDRESS.toLowerCase() as Lowercase<Hex>;

const VAULT_CONFIG = {
  chainId: CHAIN_IDS.MONAD,
  boringVault: '0xb4563bcD3B7764CCBf497f515585f70B6C3EA5Ae',
  tellerAddress: '0x2D49EA58A4C70b62c8B56DE971310d9e999c8117',
  accountantAddress: '0x7382c5b8B51B8C4f127B3123C1039581BAA5A06B',
  lensAddress: '0xA816ECd922de94c6879AD23B9A884dB257F20947',
  underlyingToken: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
};

// The same vault, but published under a fresher flag payload with a different
// vmUSD token address — must be treated as a config change.
const CHANGED_VAULT_CONFIG = {
  ...VAULT_CONFIG,
  underlyingToken: '0x1111111111111111111111111111111111111111',
};

const MONAD_NETWORK_CONFIGURATION = FEATURED_RPCS.find(
  ({ chainId }) => chainId === CHAIN_IDS.MONAD,
);

/**
 * Flush the microtask queue so scheduled bootstraps settle.
 */
const flushPromises = async () => {
  await new Promise(process.nextTick);
};

function createService({
  isEnabled = true,
  isUnlocked = true,
  hasHdKeyring = true,
  vaultConfig = VAULT_CONFIG as unknown,
  networkConfigured = true,
  init = jest.fn().mockResolvedValue(undefined),
  addNetwork = jest.fn().mockResolvedValue(MONAD_NETWORK_CONFIGURATION),
}: {
  isEnabled?: boolean;
  isUnlocked?: boolean;
  hasHdKeyring?: boolean;
  vaultConfig?: unknown;
  networkConfigured?: boolean;
  init?: jest.Mock;
  addNetwork?: jest.Mock;
} = {}) {
  const config = {
    isEnabled,
    isUnlocked,
    hasHdKeyring,
    vaultConfig,
    networkConfigured,
  };

  const call = jest.fn((action: string, ...args: unknown[]) => {
    if (action === 'RemoteFeatureFlagController:getState') {
      return {
        remoteFeatureFlags: {
          [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: {
            enabled: config.isEnabled,
            minimumVersion: '0.0.1',
          },
          [MONEY_ACCOUNT_VAULT_CONFIG_FLAG_NAME]: config.vaultConfig,
        },
      };
    }
    if (action === 'KeyringController:getState') {
      return {
        isUnlocked: config.isUnlocked,
        keyrings:
          config.isUnlocked && config.hasHdKeyring
            ? [{ type: 'HD Key Tree', accounts: [], metadata: { id: 'hd' } }]
            : [],
      };
    }
    if (action === 'NetworkController:getState') {
      return {
        networkConfigurationsByChainId: config.networkConfigured
          ? { [CHAIN_IDS.MONAD]: MONAD_NETWORK_CONFIGURATION }
          : {},
      };
    }
    if (action === 'LegacyBackgroundApiService:addNetwork') {
      return addNetwork(...args);
    }
    throw new Error(`Unexpected action: ${action}`);
  });

  const subscribers: Record<string, (() => void)[]> = {};
  const subscribe = jest.fn((event: string, handler: () => void) => {
    subscribers[event] = [...(subscribers[event] ?? []), handler];
  });

  const messenger = {
    call,
    subscribe,
    registerMethodActionHandlers: jest.fn(),
  } as unknown as MoneyAccountUpgradeServiceMessenger;

  const upgradeAccount = jest.fn().mockResolvedValue(undefined);
  const upgradeController = {
    init,
    upgradeAccount,
  } as unknown as MoneyAccountUpgradeController;

  const service = new MoneyAccountUpgradeService({
    messenger,
    upgradeController,
  });

  const trigger = async (
    event:
      | 'RemoteFeatureFlagController:stateChange'
      | 'KeyringController:stateChange',
  ) => {
    subscribers[event]?.forEach((handler) => handler());
    await flushPromises();
  };

  return {
    service,
    config,
    init,
    addNetwork,
    call,
    trigger,
    upgradeAccount,
    messenger,
  };
}

describe('MoneyAccountUpgradeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(deriveMoneyAccountAddress).mockResolvedValue(MONEY_ADDRESS);
    jest
      .mocked(upgradeAccountWithRetry)
      .mockImplementation(async (upgradeAccount, address) => {
        await upgradeAccount(address);
      });
  });

  it('bootstraps at construction when the flag is on and the wallet is unlocked', async () => {
    const { init } = createService();
    await flushPromises();

    expect(init).toHaveBeenCalledWith({
      chainId: VAULT_CONFIG.chainId,
      boringVaultAddress: VAULT_CONFIG.boringVault,
    });
  });

  it('configures the Money chain before bootstrapping when it is missing', async () => {
    const order: string[] = [];
    const init = jest.fn().mockImplementation(async () => {
      order.push('init');
    });
    const addNetwork = jest.fn().mockImplementation(async () => {
      order.push('addNetwork');
      return MONAD_NETWORK_CONFIGURATION;
    });
    createService({ networkConfigured: false, init, addNetwork });
    await flushPromises();

    expect(order).toStrictEqual(['addNetwork', 'init']);
  });

  it('does not bootstrap when the feature flag is off', async () => {
    const { init } = createService({ isEnabled: false });
    await flushPromises();

    expect(init).not.toHaveBeenCalled();
  });

  it('does not bootstrap while the wallet is locked', async () => {
    const { init } = createService({ isUnlocked: false });
    await flushPromises();

    expect(init).not.toHaveBeenCalled();
  });

  it('does not bootstrap while the keyring list has no HD keyring', async () => {
    const { init } = createService({ hasHdKeyring: false });
    await flushPromises();

    expect(init).not.toHaveBeenCalled();
  });

  it('bootstraps on unlock via the keyring state change', async () => {
    const { config, init, trigger } = createService({ isUnlocked: false });
    await flushPromises();
    expect(init).not.toHaveBeenCalled();

    config.isUnlocked = true;
    await trigger('KeyringController:stateChange');

    expect(init).toHaveBeenCalledTimes(1);
  });

  it('reports a missing vault config to Sentry only once', async () => {
    const { init, trigger } = createService({ vaultConfig: null });
    await flushPromises();
    await trigger('RemoteFeatureFlagController:stateChange');
    await trigger('RemoteFeatureFlagController:stateChange');

    expect(init).not.toHaveBeenCalled();
    expect(jest.mocked(captureException)).toHaveBeenCalledTimes(1);
  });

  it('does not re-bootstrap when triggers repeat with the same config', async () => {
    const { init, trigger } = createService();
    await trigger('RemoteFeatureFlagController:stateChange');
    await trigger('KeyringController:stateChange');

    expect(init).toHaveBeenCalledTimes(1);
  });

  it('re-bootstraps when the vault config changes', async () => {
    const { config, init, trigger } = createService();
    await flushPromises();

    config.vaultConfig = CHANGED_VAULT_CONFIG;
    await trigger('RemoteFeatureFlagController:stateChange');

    expect(init).toHaveBeenCalledTimes(2);
  });

  it('serializes a config-change bootstrap after the in-flight one', async () => {
    let resolveFirst: (value?: unknown) => void = () => undefined;
    const init = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValue(undefined);
    const { config, trigger } = createService({ init });

    config.vaultConfig = CHANGED_VAULT_CONFIG;
    await trigger('RemoteFeatureFlagController:stateChange');
    expect(init).toHaveBeenCalledTimes(1);

    resolveFirst();
    await flushPromises();

    expect(init).toHaveBeenCalledTimes(2);
    expect(init).toHaveBeenLastCalledWith({
      chainId: CHANGED_VAULT_CONFIG.chainId,
      boringVaultAddress: CHANGED_VAULT_CONFIG.boringVault,
    });
  });

  it('retries a failed bootstrap on the next trigger', async () => {
    const init = jest
      .fn()
      .mockRejectedValueOnce(new Error('CHOMP outage'))
      .mockResolvedValue(undefined);
    const { trigger } = createService({ init });
    await flushPromises();

    await trigger('KeyringController:stateChange');

    expect(init).toHaveBeenCalledTimes(2);
  });

  it('survives a throwing messenger call', () => {
    const messenger = {
      call: jest.fn().mockImplementation(() => {
        throw new Error('handler not registered');
      }),
      subscribe: jest.fn(),
      registerMethodActionHandlers: jest.fn(),
    } as unknown as MoneyAccountUpgradeServiceMessenger;

    expect(
      () =>
        new MoneyAccountUpgradeService({
          messenger,
          upgradeController: {
            init: jest.fn(),
          } as unknown as MoneyAccountUpgradeController,
        }),
    ).not.toThrow();
  });

  describe('triggerUpgrade', () => {
    it('upgrades the derived address, lowercased', async () => {
      const { service, upgradeAccount } = createService();
      await flushPromises();

      service.triggerUpgrade();
      await flushPromises();

      expect(upgradeAccount).toHaveBeenCalledWith(MONEY_ADDRESS_LOWERCASED);
    });

    it('registers the trigger as a method action', () => {
      const { service, messenger } = createService();

      expect(messenger.registerMethodActionHandlers).toHaveBeenCalledWith(
        service,
        ['triggerUpgrade'],
      );
    });

    it('skips when the bootstrap was never scheduled', async () => {
      const { service, upgradeAccount } = createService({ isEnabled: false });
      await flushPromises();

      service.triggerUpgrade();
      await flushPromises();

      expect(upgradeAccount).not.toHaveBeenCalled();
      expect(jest.mocked(captureException)).not.toHaveBeenCalled();
    });

    it('re-arms a failed bootstrap off the trigger and then upgrades', async () => {
      const init = jest
        .fn()
        .mockRejectedValueOnce(new Error('CHOMP outage'))
        .mockResolvedValue(undefined);
      const { service, upgradeAccount } = createService({ init });
      await flushPromises();
      expect(init).toHaveBeenCalledTimes(1);

      service.triggerUpgrade();
      await flushPromises();

      expect(init).toHaveBeenCalledTimes(2);
      expect(upgradeAccount).toHaveBeenCalledWith(MONEY_ADDRESS_LOWERCASED);
    });

    it('dedupes triggers while a run is in flight', async () => {
      let resolveRun: () => void = () => undefined;
      jest.mocked(upgradeAccountWithRetry).mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveRun = resolve;
          }),
      );
      const { service } = createService();
      await flushPromises();

      service.triggerUpgrade();
      await flushPromises();
      service.triggerUpgrade();
      await flushPromises();

      expect(jest.mocked(upgradeAccountWithRetry)).toHaveBeenCalledTimes(1);

      resolveRun();
      await flushPromises();
      service.triggerUpgrade();
      await flushPromises();

      expect(jest.mocked(upgradeAccountWithRetry)).toHaveBeenCalledTimes(2);
    });

    it('reports a failed run to Sentry and re-arms the next trigger', async () => {
      const error = new Error('terminal');
      jest
        .mocked(upgradeAccountWithRetry)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined);
      const { service } = createService();
      await flushPromises();

      service.triggerUpgrade();
      await flushPromises();

      expect(jest.mocked(captureException)).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: expect.objectContaining({ feature: 'money-account-upgrade' }),
        }),
      );

      service.triggerUpgrade();
      await flushPromises();

      expect(jest.mocked(upgradeAccountWithRetry)).toHaveBeenCalledTimes(2);
    });

    it('caps retried-failure reports at three per run', async () => {
      const retryError = new Error('transient');
      jest
        .mocked(upgradeAccountWithRetry)
        .mockImplementation(async (_upgradeAccount, _address, options) => {
          for (let attempt = 1; attempt <= 5; attempt++) {
            options?.onRetry?.(retryError, attempt);
          }
        });
      const { service } = createService();
      await flushPromises();

      service.triggerUpgrade();
      await flushPromises();

      expect(jest.mocked(captureException)).toHaveBeenCalledTimes(3);
    });
  });
});
