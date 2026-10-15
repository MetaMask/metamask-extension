import type { Messenger } from '@metamask/messenger';
import type { NetworkControllerGetStateAction } from '@metamask/network-controller';
import type { Hex } from '@metamask/utils';
import { FEATURED_RPCS } from '../../../../shared/constants/network';
import type { MoneyAccountVaultConfig } from '../../../../shared/lib/money/vault-config';
import type { LegacyBackgroundApiServiceAddNetworkAction } from '../../services/legacy-background-api-service-method-action-types';

export type MoneyChainConfigMessenger = Messenger<
  string,
  NetworkControllerGetStateAction | LegacyBackgroundApiServiceAddNetworkAction,
  never
>;

/**
 * Ensures the configured Money Account chain exists in the NetworkController.
 *
 * @param vaultConfig - The Money Account vault config carrying the chain id.
 */
export type EnsureMoneyChainConfigured = (
  vaultConfig: MoneyAccountVaultConfig,
) => Promise<void>;

/**
 * The in-flight state shared by every configurator by default, so
 * configurators owned by different services (availability and upgrade) still
 * dedupe and serialize their `addNetwork` calls against each other.
 */
export type MoneyChainConfigLock = {
  inFlight?: Promise<void>;
  inFlightChainId?: Hex;
};

const sharedLock: MoneyChainConfigLock = {};

/**
 * Create a function that ensures the Money Account chain is configured in the
 * NetworkController, adding it from the featured networks when missing.
 *
 * @param messenger - The messenger used to reach the NetworkController and
 * LegacyBackgroundApiService.
 * @param lock - The in-flight state to coordinate through. Defaults to a
 * process-wide lock shared by all configurators; tests may pass their own.
 * @returns The configuring function.
 */
export function createMoneyChainConfigurator(
  messenger: MoneyChainConfigMessenger,
  lock: MoneyChainConfigLock = sharedLock,
): EnsureMoneyChainConfigured {
  const configureChain = async (
    vaultConfig: MoneyAccountVaultConfig,
  ): Promise<void> => {
    const { networkConfigurationsByChainId } = messenger.call(
      'NetworkController:getState',
    );
    if (networkConfigurationsByChainId[vaultConfig.chainId]) {
      return;
    }

    const networkConfiguration = FEATURED_RPCS.find(
      ({ chainId }) => chainId === vaultConfig.chainId,
    );
    if (!networkConfiguration) {
      throw new Error(
        `Money Account chain ${vaultConfig.chainId} is not a featured network`,
      );
    }

    await messenger.call(
      'LegacyBackgroundApiService:addNetwork',
      networkConfiguration,
      { setActive: false },
    );
  };

  return async function ensureMoneyChainConfigured(
    vaultConfig: MoneyAccountVaultConfig,
  ): Promise<void> {
    if (lock.inFlight && lock.inFlightChainId === vaultConfig.chainId) {
      return await lock.inFlight;
    }

    // A request for a different chain must not join the in-flight run — it
    // would resolve without its chain ever being added. It must not overlap
    // it either: `addNetwork` temporarily mutates the enabled-network map and
    // restores it afterwards, so two interleaved runs could clobber each
    // other's restore. Queue behind the in-flight run instead.
    const previous = lock.inFlight;
    const configuration = (async () => {
      if (previous) {
        await previous.catch(() => undefined);
      }
      await configureChain(vaultConfig);
    })();
    lock.inFlight = configuration;
    lock.inFlightChainId = vaultConfig.chainId;

    try {
      await configuration;
    } finally {
      if (lock.inFlight === configuration) {
        lock.inFlight = undefined;
        lock.inFlightChainId = undefined;
      }
    }
  };
}
