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
 * Create a function that ensures the Money Account chain is configured in the
 * NetworkController, adding it from the featured networks when missing.
 *
 * @param messenger - The messenger used to reach the NetworkController and
 * LegacyBackgroundApiService.
 * @returns The configuring function.
 */
export function createMoneyChainConfigurator(
  messenger: MoneyChainConfigMessenger,
): EnsureMoneyChainConfigured {
  let inFlight: Promise<void> | undefined;
  let inFlightChainId: Hex | undefined;

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
    if (inFlight && inFlightChainId === vaultConfig.chainId) {
      return await inFlight;
    }

    // A request for a different chain must not join the in-flight run — it
    // would resolve without its chain ever being added. It must not overlap
    // it either: `addNetwork` temporarily mutates the enabled-network map and
    // restores it afterwards, so two interleaved runs could clobber each
    // other's restore. Queue behind the in-flight run instead.
    const previous = inFlight;
    const configuration = (async () => {
      if (previous) {
        await previous.catch(() => undefined);
      }
      await configureChain(vaultConfig);
    })();
    inFlight = configuration;
    inFlightChainId = vaultConfig.chainId;

    try {
      await configuration;
    } finally {
      if (inFlight === configuration) {
        inFlight = undefined;
        inFlightChainId = undefined;
      }
    }
  };
}
