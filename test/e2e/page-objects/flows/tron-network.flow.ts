import type { AccountTreeControllerState } from '@metamask/account-tree-controller';
import { TrxAccountType, TrxScope } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { TRON_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/tron-wallet-snap';
import { getCleanAppState } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import NetworkFilter from '../pages/networks/network-filter';
import SelectNetworkModal from '../pages/networks/select-network-modal';
import {
  switchToNetworkFromNetworkSelect,
  waitForNetworkModalBackdropToClear,
} from './network.flow';

const TRON_ACCOUNT_READY_INTERVAL_MS = 1_000;
const TRON_ACCOUNT_READY_TIMEOUT_MS = 45_000;

/**
 * Opens the home network filter and selects a network by display name, then
 * waits for any leftover modal to close so subsequent clicks are not blocked.
 *
 * @param driver - WebDriver instance
 * @param networkName - Display name of the network row, e.g. `Tron`
 */
async function selectNetworkFromFilter(
  driver: Driver,
  networkName: string,
): Promise<void> {
  const networkFilter = new NetworkFilter(driver);
  const selectNetworkModal = new SelectNetworkModal(driver);

  await networkFilter.open();
  await selectNetworkModal.checkPageIsLoaded();
  await selectNetworkModal.selectNetworkByNameWithWait(networkName);
  await selectNetworkModal.closeIfOpen();
}

/**
 * Selects Tron for live-balance flows (send, derivation, assets).
 *
 * Uses {@link switchToNetworkFromNetworkSelect} so the shared Snap-ready delay
 * runs before Tron is enabled. AssetsController only fetches Snap balances for
 * newly enabled chains; a too-early enable leaves the token list at 0 TRX.
 *
 * @param driver - WebDriver instance
 */
export async function selectTronNetwork(driver: Driver): Promise<void> {
  await switchToNetworkFromNetworkSelect(driver, 'Tron');
  await waitForNetworkModalBackdropToClear(driver);
}

/**
 * Selects Tron for mocked activity assertions.
 *
 * Waits until the Tron Snap and BIP44 account exist, then uses the delay-free
 * filter path. Activity tests mock transaction history and do not need the
 * live-balance Snap delay used by {@link selectTronNetwork}.
 *
 * @param driver - WebDriver instance
 */
export async function selectTronNetworkForActivity(
  driver: Driver,
): Promise<void> {
  await waitForTronAccountToBeReady(driver);
  await selectNetworkFromFilter(driver, 'Tron');
}

/**
 * Waits for BIP44 stage-2 alignment to finish creating the selected account
 * group's Tron account. Account-tree backup sync flags do not represent this
 * runtime alignment, so readiness is derived from the entropy wallet status
 * and the selected group's internal accounts instead.
 *
 * @param driver - WebDriver instance
 */
export async function waitForTronAccountToBeReady(
  driver: Driver,
): Promise<void> {
  console.log('Wait for the selected account group Tron account to be ready');
  await driver.waitUntil(
    async () => {
      const uiState = await getCleanAppState(driver);
      const selectedAccountGroup = uiState?.metamask?.selectedAccountGroup;
      const wallets = uiState?.metamask?.accountTree?.wallets as
        | AccountTreeControllerState['accountTree']['wallets']
        | undefined;
      const internalAccounts = uiState?.metamask?.internalAccounts?.accounts as
        | Record<string, InternalAccount>
        | undefined;

      if (!selectedAccountGroup || !wallets || !internalAccounts) {
        return false;
      }

      const tronSnap = uiState?.metamask?.snaps?.[TRON_WALLET_SNAP_ID] as
        | { status?: string }
        | undefined;
      if (tronSnap?.status !== 'running') {
        return false;
      }

      return Object.values(wallets).some((wallet) => {
        const selectedGroup = wallet.groups?.[selectedAccountGroup];
        const hasTronMainnetAccount = selectedGroup?.accounts?.some(
          (accountId) => {
            const account = internalAccounts[accountId];
            return (
              account?.type === TrxAccountType.Eoa &&
              account.scopes?.includes(TrxScope.Mainnet)
            );
          },
        );

        return wallet.status === 'ready' && hasTronMainnetAccount === true;
      });
    },
    {
      interval: TRON_ACCOUNT_READY_INTERVAL_MS,
      timeout: TRON_ACCOUNT_READY_TIMEOUT_MS,
    },
  );
}
