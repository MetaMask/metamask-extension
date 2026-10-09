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
 * Ensures a featured chain exists in the NetworkController.
 *
 * @param chainId - The chain to configure.
 */
export type EnsureFeaturedChainConfigured = (chainId: Hex) => Promise<void>;

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
  const ensureChainConfigured = createFeaturedChainConfigurator(
    messenger,
    lock,
    (chainId) => `Money Account chain ${chainId} is not a featured network`,
  );

  return async function ensureMoneyChainConfigured(
    vaultConfig: MoneyAccountVaultConfig,
  ): Promise<void> {
    await ensureChainConfigured(vaultConfig.chainId);
  };
}

/**
 * Create a function that ensures a featured chain is configured in the
 * NetworkController, adding it from the featured networks when missing.
 *
 * @param messenger - The messenger used to reach the NetworkController and
 * LegacyBackgroundApiService.
 * @param lock - The in-flight state to coordinate through. Defaults to a
 * process-wide lock shared by all configurators; tests may pass their own.
 * @param getNotFeaturedMessage - Builds the error message for a chain that
 * isn't a featured network.
 * @returns The configuring function.
 */
export function createFeaturedChainConfigurator(
  messenger: MoneyChainConfigMessenger,
  lock: MoneyChainConfigLock = sharedLock,
  getNotFeaturedMessage: (chainId: Hex) => string = (chainId) =>
    `Chain ${chainId} is not a featured network`,
): EnsureFeaturedChainConfigured {
  const configureChain = async (chainId: Hex): Promise<void> => {
    const { networkConfigurationsByChainId } = messenger.call(
      'NetworkController:getState',
    );
    if (networkConfigurationsByChainId[chainId]) {
      return;
    }

    const networkConfiguration = FEATURED_RPCS.find(
      (featured) => featured.chainId === chainId,
    );
    if (!networkConfiguration) {
      throw new Error(getNotFeaturedMessage(chainId));
    }

    await messenger.call(
      'LegacyBackgroundApiService:addNetwork',
      networkConfiguration,
      { setActive: false },
    );
  };

  return async function ensureFeaturedChainConfigured(
    chainId: Hex,
  ): Promise<void> {
    if (lock.inFlight && lock.inFlightChainId === chainId) {
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
      await configureChain(chainId);
    })();
    lock.inFlight = configuration;
    lock.inFlightChainId = chainId;

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
