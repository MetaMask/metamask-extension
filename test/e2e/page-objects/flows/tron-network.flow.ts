import { TrxAccountType, TrxScope } from '@metamask/keyring-api';
import { Driver } from '../../webdriver/driver';
import { getCleanAppState } from '../../helpers';
import { TRON_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/tron-wallet-snap';
import NetworkFilter from '../pages/networks/network-filter';
import SelectNetworkModal from '../pages/networks/select-network-modal';

/**
 * The subset of the extension state needed to determine whether the Tron
 * snap and the selected account's Tron EOA are ready.
 */
type TronReadinessWallet = {
  status?: string;
  groups?: Record<string, { accounts?: string[] } | undefined>;
};

type TronReadinessState = {
  snaps?: Record<string, { status?: string } | undefined>;
  selectedAccountGroup?: string;
  accountTree?: { wallets?: Record<string, TronReadinessWallet | undefined> };
  internalAccounts?: {
    accounts?: { id: string; type: string; scopes?: string[] }[];
  };
};

type TronUiState = { metamask?: TronReadinessState | undefined };

/**
 * Waits until the Tron snap is running and the selected account group's wallet
 * is ready and contains a Tron EOA internal account scoped to Tron mainnet.
 *
 * This replaces the previous fixed BIP44/Snap ready delays with a real
 * readiness poll; it resolves immediately on repeat calls once ready.
 *
 * @param driver - The WebDriver instance.
 */
export async function waitForTronAccountToBeReady(
  driver: Driver,
): Promise<void> {
  console.log('Waiting for the Tron snap and account to be ready');
  await driver.waitUntil(
    async () => {
      const state = (await getCleanAppState(driver)) as TronUiState | null;
      const metamaskState = state?.metamask;
      if (!metamaskState) {
        return false;
      }

      if (metamaskState.snaps?.[TRON_WALLET_SNAP_ID]?.status !== 'running') {
        return false;
      }

      const { selectedAccountGroup } = metamaskState;
      const wallets = metamaskState.accountTree?.wallets;
      if (!selectedAccountGroup || !wallets) {
        return false;
      }
      const selectedWallet = Object.values(wallets).find((wallet) =>
        Boolean(wallet?.groups?.[selectedAccountGroup]),
      );
      if (!selectedWallet || selectedWallet.status !== 'ready') {
        return false;
      }

      const groupAccountIds: string[] =
        selectedWallet.groups?.[selectedAccountGroup]?.accounts ?? [];
      const internalAccountsById = new Map(
        Object.values(metamaskState.internalAccounts?.accounts ?? {}).map(
          (account) => [account.id, account],
        ),
      );
      return groupAccountIds.some((accountId) => {
        const account = internalAccountsById.get(accountId);
        return (
          account?.type === TrxAccountType.Eoa &&
          account.scopes?.includes(TrxScope.Mainnet)
        );
      });
    },
    { interval: 1_000, timeout: 45_000 },
  );
}

/**
 * Opens the network filter and selects the given network by name.
 *
 * @param driver - The WebDriver instance.
 * @param networkName - The display name of the network to select.
 */
async function selectNetworkFromFilter(
  driver: Driver,
  networkName: string,
): Promise<void> {
  const networkFilter = new NetworkFilter(driver);
  const selectNetworkModal = new SelectNetworkModal(driver);

  await networkFilter.open();
  await selectNetworkModal.checkPageIsLoaded();
  await selectNetworkModal.selectNetworkByName(networkName);
  await selectNetworkModal.closeIfOpen();
}

/**
 * Selects the Tron network from the home network filter.
 *
 * Rationale: AssetsController only fetches Snap balances for newly enabled
 * chains, so the readiness wait — not a delay — guarantees nonzero TRX.
 *
 * @param driver - WebDriver instance
 */
export async function selectTronNetwork(driver: Driver): Promise<void> {
  await waitForTronAccountToBeReady(driver);
  await selectNetworkFromFilter(driver, 'Tron');
}
