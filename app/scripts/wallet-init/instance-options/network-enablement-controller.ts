import { selectEvmAutoEnabledNetworksChainIds } from '@metamask/config-registry-controller';
import {
  BtcScope,
  SolAccountType,
  SolScope,
  TrxScope,
} from '@metamask/keyring-api';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  NetworkEnablementController,
  NetworkEnablementControllerMessenger,
  NetworkEnablementControllerState,
} from '@metamask/network-enablement-controller';
import { KnownCaipNamespace } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { NetworkEnablementControllerInitMessenger } from '../../messenger-client-init/messengers/assets/network-enablement-controller-messenger';
import { MessengerClientPersistedState } from '../../messenger-client-init/types';

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

type SetupNetworkEnablementControllerRequest = {
  networkEnablementController: NetworkEnablementController;
  initMessenger: NetworkEnablementControllerInitMessenger;
  persistedState: MessengerClientPersistedState;
};

/**
 * Extension-only NetworkEnablementController behavior.
 *
 * `@metamask/wallet` constructs the controller. `wallet.init()` runs before
 * MultichainNetworkController exists, so that first `init()` fails. Call this
 * after MultichainNetworkController and before TokenRatesController.
 *
 * @param request - The wallet instance, init messenger, and persisted state.
 * @param request.networkEnablementController - The wallet-owned controller.
 * @param request.initMessenger - Messenger for account-switch subscriptions.
 * @param request.persistedState - Persisted state used to detect a first run.
 */
export function setupNetworkEnablementController({
  networkEnablementController,
  initMessenger,
  persistedState,
}: SetupNetworkEnablementControllerRequest): void {
  // `messenger` is protected on BaseController. The wallet instance owns the
  // messenger that already delegates network and config-registry actions.
  const controllerMessenger = (
    networkEnablementController as NetworkEnablementController & {
      messenger: NetworkEnablementControllerMessenger;
    }
  ).messenger;
  const hasPersistedEnabledNetworkMap = Boolean(
    persistedState.NetworkEnablementController?.enabledNetworkMap,
  );

  // Initialize native asset identifiers from network configurations.
  // This reads from NetworkController and MultichainNetworkController.
  // We intentionally don't await this - it will complete in the background.
  // A fresh controller has an empty map until `init()` copies configured
  // networks in as disabled, preserving any persisted selection.
  networkEnablementController.init();

  if (!hasPersistedEnabledNetworkMap) {
    if (process.env.IN_TEST) {
      networkEnablementController.enableNetwork(CHAIN_IDS.LOCALHOST);
    } else {
      networkEnablementController.enableAllPopularNetworks();
    }
  }

  controllerMessenger.subscribe(
    'NetworkController:networkAdded',
    async ({ chainId }) => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      try {
        const autoEnabledNetworkChainIds = selectEvmAutoEnabledNetworksChainIds(
          controllerMessenger.call('ConfigRegistryController:getState'),
        );

        if (!autoEnabledNetworkChainIds.includes(toEvmCaipChainId(chainId))) {
          return;
        }

        const previousEnabledNetworkMap = cloneEnabledNetworkMap(
          networkEnablementController.state.enabledNetworkMap,
        );

        await Promise.race([
          controllerMessenger.waitUntil(
            'NetworkEnablementController:stateChange',
            {
              condition: (state) =>
                state.enabledNetworkMap.eip155?.[chainId] === true,
            },
          ),
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
        controllerMessenger.captureException?.(
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
