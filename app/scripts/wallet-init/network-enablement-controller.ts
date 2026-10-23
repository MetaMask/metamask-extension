import { selectEvmAutoEnabledNetworksChainIds } from '@metamask/config-registry-controller';
import {
  BtcScope,
  SolAccountType,
  SolScope,
  TrxScope,
} from '@metamask/keyring-api';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import type {
  NetworkEnablementController,
  NetworkEnablementControllerState,
} from '@metamask/network-enablement-controller';
import { isObject, KnownCaipNamespace } from '@metamask/utils';
import type { Json } from '@metamask/utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import type { NetworkEnablementControllerInitMessenger } from './messengers/network-enablement-controller-messenger';

const AUTO_ENABLE_TIMEOUT_MS = 30_000;

type PersistedState = Record<string, Record<string, Json>>;

function hasPersistedEnabledNetworkMap(state: PersistedState): boolean {
  return isObject(state.NetworkEnablementController?.enabledNetworkMap);
}

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
 * Seed the `NetworkEnablementController` state for test builds so that only
 * Localhost is enabled, instead of the package's popular-network defaults.
 * Persisted state (e.g. from e2e fixtures) is left untouched. Networks that
 * are configured but missing from the map are added as disabled by
 * `NetworkEnablementController.init()`.
 *
 * @param state - The persisted extension state.
 * @returns The state to construct the wallet with.
 */
export function withNetworkEnablementControllerTestState(
  state: PersistedState,
): PersistedState {
  if (!process.env.IN_TEST || hasPersistedEnabledNetworkMap(state)) {
    return state;
  }

  const testState: NetworkEnablementControllerState = {
    enabledNetworkMap: {
      [KnownCaipNamespace.Eip155]: { [CHAIN_IDS.LOCALHOST]: true },
    },
    nativeAssetIdentifiers: {},
  };

  return {
    ...state,
    NetworkEnablementController: testState as unknown as Record<string, Json>,
  };
}

/**
 * Finish initializing the wallet-owned `NetworkEnablementController`: enable
 * all popular networks on a fresh (non-test) install, then populate the native
 * asset identifiers.
 *
 * Both steps read `MultichainNetworkController:getState`, which the extension
 * registers after `Wallet.init()` has run, so the controller's own `init()`
 * call from the wallet fails before touching state and must be repeated here.
 *
 * @param args - The arguments.
 * @param args.controller - The wallet-owned `NetworkEnablementController`.
 * @param args.state - The persisted extension state.
 */
export function initializeNetworkEnablementController({
  controller,
  state,
}: {
  controller: NetworkEnablementController;
  state: PersistedState;
}): void {
  if (!process.env.IN_TEST && !hasPersistedEnabledNetworkMap(state)) {
    controller.enableAllPopularNetworks();
  }

  controller.init().catch((error) => console.error(error));
}

/**
 * Subscribe the extension-specific listeners that drive the wallet-owned
 * `NetworkEnablementController`.
 *
 * @param args - The arguments.
 * @param args.controller - The wallet-owned `NetworkEnablementController`.
 * @param args.messenger - The restricted network enablement init messenger.
 */
export function setupNetworkEnablementControllerListeners({
  controller,
  messenger,
}: {
  controller: NetworkEnablementController;
  messenger: NetworkEnablementControllerInitMessenger;
}): void {
  // The controller auto-enables Config Registry networks when they are added.
  // Restore the previous selection so the user's network filter is preserved.
  messenger.subscribe('NetworkController:networkAdded', async ({ chainId }) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const autoEnabledNetworkChainIds = selectEvmAutoEnabledNetworksChainIds(
        messenger.call('ConfigRegistryController:getState'),
      );

      if (!autoEnabledNetworkChainIds.includes(toEvmCaipChainId(chainId))) {
        return;
      }

      const previousEnabledNetworkMap = cloneEnabledNetworkMap(
        controller.state.enabledNetworkMap,
      );

      await Promise.race([
        messenger.waitUntil('NetworkEnablementController:stateChange', {
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
      controller.restoreEnabledNetworkMap(previousEnabledNetworkMap);
    } catch (error) {
      messenger.captureException?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    } finally {
      clearTimeout(timeoutId);
    }
  });

  // TODO: Remove this after BIP-44 rollout.
  messenger.subscribe('AccountsController:selectedAccountChange', (account) => {
    if (account.type === SolAccountType.DataAccount) {
      controller.enableNetworkInNamespace(
        SolScope.Mainnet,
        KnownCaipNamespace.Solana,
      );
    }
  });

  messenger.subscribe(
    'AccountTreeController:selectedAccountGroupChange',
    () => {
      const solAccounts = messenger.call(
        'AccountTreeController:getAccountsFromSelectedAccountGroup',
        { scopes: [SolScope.Mainnet] },
      );
      const btcAccounts = messenger.call(
        'AccountTreeController:getAccountsFromSelectedAccountGroup',
        { scopes: [BtcScope.Mainnet] },
      );
      const trxAccounts = messenger.call(
        'AccountTreeController:getAccountsFromSelectedAccountGroup',
        { scopes: [TrxScope.Mainnet] },
      );

      const allEnabledNetworks = {};

      for (const network of Object.values(controller.state.enabledNetworkMap)) {
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
          controller.enableNetwork('0x1');
        }
      }
    },
  );
}
