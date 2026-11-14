import { selectEvmAutoEnabledNetworksChainIds } from '@metamask/config-registry-controller';
import {
  BtcScope,
  SolAccountType,
  SolScope,
  TrxScope,
} from '@metamask/keyring-api';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  Slip44Service,
  type NetworkEnablementController,
  type NetworkEnablementControllerState,
} from '@metamask/network-enablement-controller';
import { KnownCaipNamespace, type Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import type { RootMessenger } from '../lib/messenger';
import type { MessengerClientPersistedState } from '../messenger-client-init/types';
import {
  getNetworkEnablementControllerInitMessenger,
  type NetworkEnablementControllerInitMessengerActions,
  type NetworkEnablementControllerInitMessengerEvents,
} from './messengers/network-enablement-controller-messenger';

const AUTO_ENABLE_TIMEOUT_MS = 30_000;

function cloneEnabledNetworkMap(
  enabledNetworkMap: NetworkEnablementControllerState['enabledNetworkMap'],
): NetworkEnablementControllerState['enabledNetworkMap'] {
  return Object.fromEntries(
    Object.entries(enabledNetworkMap).map(([namespace, networks]) => [
      namespace,
      { ...networks },
    ]),
  ) as NetworkEnablementControllerState['enabledNetworkMap'];
}

/**
 * Wire the extension-side behavior for the wallet-owned
 * `NetworkEnablementController`.
 *
 * `@metamask/wallet` constructs the controller and runs its `init()` during
 * `wallet.init()`, before `MultichainNetworkController` is registered, so that
 * first call fails. This must be called once the messenger clients are
 * initialized (and before the UI opens) to re-run `init()`, apply the
 * first-run network selection, and subscribe to the network and account
 * changes the extension reacts to.
 *
 * @param options - Options bag.
 * @param options.networkEnablementController - The wallet-owned controller.
 * @param options.messenger - The root messenger to delegate from.
 * @param options.persistedState - Persisted state, used to detect a first run.
 */
export function setupNetworkEnablementController({
  networkEnablementController,
  messenger,
  persistedState,
}: {
  networkEnablementController: NetworkEnablementController;
  messenger: RootMessenger<
    NetworkEnablementControllerInitMessengerActions,
    NetworkEnablementControllerInitMessengerEvents
  >;
  persistedState: MessengerClientPersistedState;
}): void {
  const initMessenger = getNetworkEnablementControllerInitMessenger(messenger);

  const canFetchMetadata = () => {
    try {
      return (
        initMessenger.call('OnboardingController:getState')
          .completedOnboarding &&
        initMessenger.call('PreferencesController:getState').useExternalServices
      );
    } catch {
      return false;
    }
  };
  let metadataWasAllowed = canFetchMetadata();
  const refreshMetadata = () => {
    const allowed = canFetchMetadata();
    const becameAllowed = allowed && !metadataWasAllowed;
    metadataWasAllowed = allowed;
    if (becameAllowed) {
      Slip44Service.clearCache();
      const networks = Object.entries(
        initMessenger.call('NetworkController:getState')
          .networkConfigurationsByChainId,
      ).map(([chainId, { nativeCurrency }]) => ({
        chainId: toEvmCaipChainId(chainId as Hex),
        nativeCurrency,
      }));
      networkEnablementController
        .initNativeAssetIdentifiers(networks)
        .catch((error: unknown) => {
          initMessenger.captureException?.(
            error instanceof Error ? error : new Error(String(error)),
          );
        });
    }
  };
  initMessenger.subscribe('OnboardingController:stateChange', refreshMetadata);
  initMessenger.subscribe('PreferencesController:stateChange', refreshMetadata);

  // Adds every configured network missing from the map as disabled, and
  // populates `nativeAssetIdentifiers`. It completes in the background.
  networkEnablementController.init().catch((error) => {
    initMessenger.captureException?.(
      error instanceof Error ? error : new Error(String(error)),
    );
  });

  if (!persistedState.NetworkEnablementController?.enabledNetworkMap) {
    if (process.env.IN_TEST) {
      networkEnablementController.enableNetwork(CHAIN_IDS.LOCALHOST);
    } else {
      networkEnablementController.enableAllPopularNetworks();
    }
  }

  // Adding an auto-enabled Config Registry network enables it, which would
  // change the user's network filter. Restore the previous selection instead.
  initMessenger.subscribe(
    'NetworkController:networkAdded',
    async ({ chainId }) => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      try {
        const autoEnabledNetworkChainIds = selectEvmAutoEnabledNetworksChainIds(
          initMessenger.call('ConfigRegistryController:getState'),
        );

        if (!autoEnabledNetworkChainIds.includes(toEvmCaipChainId(chainId))) {
          return;
        }

        const previousEnabledNetworkMap = cloneEnabledNetworkMap(
          networkEnablementController.state.enabledNetworkMap,
        );

        await Promise.race([
          initMessenger.waitUntil('NetworkEnablementController:stateChange', {
            condition: (state) =>
              state.enabledNetworkMap.eip155?.[chainId] === true,
          }),
          new Promise<never>((_resolve, reject) => {
            timeoutId = setTimeout(
              () =>
                reject(
                  new Error(`Timed out waiting for ${chainId} to be enabled`),
                ),
              AUTO_ENABLE_TIMEOUT_MS,
            );
          }),
        ]);
        networkEnablementController.restoreEnabledNetworkMap(
          previousEnabledNetworkMap,
        );
      } catch (error) {
        initMessenger.captureException?.(
          error instanceof Error ? error : new Error(String(error)),
        );
      } finally {
        clearTimeout(timeoutId);
      }
    },
  );

  // TODO: Remove this after BIP-44 rollout.
  initMessenger.subscribe(
    'AccountsController:selectedAccountChange',
    (account) => {
      if (account.type === SolAccountType.DataAccount) {
        networkEnablementController.enableNetworkInNamespace(
          SolScope.Mainnet,
          KnownCaipNamespace.Solana,
        );
      }
    },
  );

  initMessenger.subscribe(
    'AccountTreeController:selectedAccountGroupChange',
    () => {
      const solAccounts = initMessenger.call(
        'AccountTreeController:getAccountsFromSelectedAccountGroup',
        {
          scopes: [SolScope.Mainnet],
        },
      );
      const btcAccounts = initMessenger.call(
        'AccountTreeController:getAccountsFromSelectedAccountGroup',
        {
          scopes: [BtcScope.Mainnet],
        },
      );
      const trxAccounts = initMessenger.call(
        'AccountTreeController:getAccountsFromSelectedAccountGroup',
        {
          scopes: [TrxScope.Mainnet],
        },
      );

      const allEnabledNetworks = {};

      for (const network of Object.values(
        networkEnablementController.state.enabledNetworkMap,
      )) {
        Object.assign(allEnabledNetworks, network);
      }

      if (Object.keys(allEnabledNetworks).length === 1) {
        const chainId = Object.keys(allEnabledNetworks)[0];

        let shouldEnableMainnetNetworks = false;
        if (chainId === SolScope.Mainnet && solAccounts.length === 0) {
          shouldEnableMainnetNetworks = true;
        }
        if (chainId === BtcScope.Mainnet && btcAccounts.length === 0) {
          shouldEnableMainnetNetworks = true;
        }
        if (chainId === TrxScope.Mainnet && trxAccounts.length === 0) {
          shouldEnableMainnetNetworks = true;
        }
        if (shouldEnableMainnetNetworks) {
          networkEnablementController.enableNetwork('0x1');
        }
      }
    },
  );
}
