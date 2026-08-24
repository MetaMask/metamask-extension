import type { AccountTreeControllerState } from '@metamask/account-tree-controller';
import { TrxAccountType, TrxScope } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { TRON_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/tron-wallet-snap';
import { getCleanAppState } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import NetworkFilter from '../pages/networks/network-filter';
import SelectNetworkModal from '../pages/networks/select-network-modal';

const TRON_ACCOUNT_READY_INTERVAL_MS = 1_000;
const TRON_ACCOUNT_READY_TIMEOUT_MS = 45_000;

// The clickable network row's own visibility (Selenium's isDisplayed, not just
// DOM presence) can occasionally lag a beat right after an account switch,
// independent of waitForTronAccountToBeReady's backend readiness signal —
// e.g. while the modal's per-account network set is still settling. When that
// happens, the click's own findClickableElement wait times out with the modal
// stuck open and nothing selected; nothing inside a stuck modal is reliably
// clickable, so recovery reloads the page rather than trying to close it.
const NETWORK_FILTER_SELECT_MAX_ATTEMPTS = 3;

/**
 * Opens the home network filter and selects a network by display name, then
 * waits for any leftover modal to close so subsequent clicks are not blocked.
 * Retries the open-and-select sequence a few times, reloading the page
 * between attempts, to absorb the rare race described above instead of
 * failing outright.
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

  for (
    let attempt = 1;
    attempt <= NETWORK_FILTER_SELECT_MAX_ATTEMPTS;
    attempt++
  ) {
    try {
      await networkFilter.open();
      await selectNetworkModal.checkPageIsLoaded();
      await selectNetworkModal.selectNetworkByNameWithWait(networkName);
      await selectNetworkModal.closeIfOpen();
      return;
    } catch (error) {
      if (attempt === NETWORK_FILTER_SELECT_MAX_ATTEMPTS) {
        throw error;
      }
      console.log(
        `Network filter selection for "${networkName}" failed on attempt ${attempt}/${NETWORK_FILTER_SELECT_MAX_ATTEMPTS}, reloading and retrying:`,
        error,
      );
      // Best-effort recovery only: a stuck modal can leave every element in
      // it (including its own close button) failing visibility checks, so
      // reload the page instead of trying to interact with it again. Swallow
      // any failure here so it cannot mask the original error above.
      await driver.navigate().catch(() => undefined);
    }
  }
}

/**
 * Selects Tron for live-balance flows (send, derivation, assets).
 *
 * Waits until the Tron Snap is running and the BIP44 account exists via
 * {@link waitForTronAccountToBeReady}, then enables Tron through the
 * delay-free filter path. AssetsController only fetches Snap balances for
 * newly enabled chains, so this readiness wait — not a fixed delay — is what
 * guarantees the Snap is ready before Tron is enabled; a too-early enable
 * leaves the token list at 0 TRX. The wait resolves immediately on repeat
 * calls within a session once the Snap is already ready, so calling this on
 * every account switch is cheap.
 *
 * @param driver - WebDriver instance
 */
export async function selectTronNetwork(driver: Driver): Promise<void> {
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
