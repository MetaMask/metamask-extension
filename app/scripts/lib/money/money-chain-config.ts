import type { Messenger } from '@metamask/messenger';
import type { NetworkControllerGetStateAction } from '@metamask/network-controller';
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
 * Create a function that ensures the Money Account chain is configured in the
 * NetworkController, adding it from the featured networks when missing.
 *
 * Both `MoneyAccountAvailabilityService` (so "available" implies the chain is
 * usable) and the Money Account upgrade bootstrap (whose EIP-7702 step looks
 * the chain up by id) need this, each with its own in-flight dedupe so
 * concurrent callers share one configuration attempt. Failures are not cached;
 * the next call retries.
 *
 * @param messenger - The messenger used to reach the NetworkController and
 * LegacyBackgroundApiService.
 * @returns The configuring function.
 */
export function createMoneyChainConfigurator(
  messenger: MoneyChainConfigMessenger,
): EnsureMoneyChainConfigured {
  let inFlight: Promise<void> | undefined;

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
    if (inFlight) {
      return await inFlight;
    }

    const configuration = configureChain(vaultConfig);
    inFlight = configuration;

    try {
      await configuration;
    } finally {
      if (inFlight === configuration) {
        inFlight = undefined;
      }
    }
  };
}
