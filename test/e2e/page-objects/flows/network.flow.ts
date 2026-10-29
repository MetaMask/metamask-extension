import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { BtcScope, SolScope, TrxScope } from '@metamask/keyring-api';
import { Driver } from '../../webdriver/driver';
import { getCleanAppState } from '../../helpers';
import { BITCOIN_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/bitcoin-wallet-snap';
import { SOLANA_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/solana-wallet-snap';
import { TRON_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/tron-wallet-snap';
import NetworkFilter from '../pages/networks/network-filter';
import SelectNetworkModal from '../pages/networks/select-network-modal';
import NetworksPage from '../pages/networks/networks-page';

/**
 * Non-EVM snap networks and the snap id / CAIP scope backing them. These
 * snaps install and fetch balances asynchronously, so switching to one of
 * these networks waits for the snap and a scoped account of the selected
 * group to be ready first. For seeded accounts (e.g. Solana in the fixtures
 * vault) this resolves almost immediately.
 */
const SNAP_NETWORKS: Record<string, { snapId: string; scope: string }> = {
  Tron: { snapId: TRON_WALLET_SNAP_ID, scope: TrxScope.Mainnet },
  Bitcoin: { snapId: BITCOIN_WALLET_SNAP_ID, scope: BtcScope.Mainnet },
  Solana: { snapId: SOLANA_WALLET_SNAP_ID, scope: SolScope.Mainnet },
};

/**
 * The subset of the extension state needed to determine whether a snap is
 * running and the selected account group's wallet is ready and contains an
 * internal account scoped to the snap's network.
 */
type SnapReadinessWallet = {
  status?: string;
  groups?: Record<string, { accounts?: string[] } | undefined>;
};

type SnapReadinessState = {
  snaps?: Record<string, { status?: string } | undefined>;
  selectedAccountGroup?: string;
  accountTree?: { wallets?: Record<string, SnapReadinessWallet | undefined> };
  internalAccounts?: {
    accounts?: { id: string; scopes?: string[] }[];
  };
};

type SnapUiState = { metamask?: SnapReadinessState | undefined };

/**
 * Determines whether the given snap is running and the selected account
 * group's wallet is ready and contains an internal account scoped to the
 * given network scope.
 *
 * @param state - The extension UI state.
 * @param snapNetwork - The snap id and CAIP scope to check readiness for.
 * @param snapNetwork.snapId
 * @param snapNetwork.scope
 * @returns True when the snap and a scoped account of the selected group are ready.
 */
export function isSnapAccountReady(
  state: SnapUiState | null | undefined,
  { snapId, scope }: { snapId: string; scope: string },
): boolean {
  const metamaskState = state?.metamask;
  if (!metamaskState) {
    return false;
  }

  if (metamaskState.snaps?.[snapId]?.status !== 'running') {
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
    return account?.scopes?.includes(scope);
  });
}

/**
 * Waits until the given snap is running and the selected account group's
 * wallet is ready and contains an internal account scoped to the given
 * network scope. Resolves immediately on repeat calls once ready.
 *
 * @param driver - The WebDriver instance.
 * @param snapNetwork - The snap id and CAIP scope to wait for.
 * @param snapNetwork.snapId
 * @param snapNetwork.scope
 */
export async function waitForSnapAccountReady(
  driver: Driver,
  { snapId, scope }: { snapId: string; scope: string },
): Promise<void> {
  console.log(`Waiting for snap account to be ready: ${snapId}`);
  await driver.waitUntil(
    async () =>
      isSnapAccountReady(await getCleanAppState(driver), { snapId, scope }),
    { interval: 1_000, timeout: 45_000 },
  );
}

/**
 * Opens the network filter from the asset list and enables every network,
 * widening the asset list to all of them.
 *
 * @param driver - The webdriver instance.
 */
export const selectAllNetworksFromNetworkSelect = async (driver: Driver) => {
  console.log('Selecting all networks');
  const networkFilter = new NetworkFilter(driver);
  const selectNetworkModal = new SelectNetworkModal(driver);

  await networkFilter.open();
  await selectNetworkModal.checkPageIsLoaded();
  await selectNetworkModal.selectAllNetworks();
};

/**
 * Opens the network filter from the asset list, navigates to the networks page
 * and deletes the given network, then returns to the asset list.
 *
 * @param driver - The webdriver instance.
 * @param hexChainId - The hexadecimal chain id of the network to delete.
 */
export const deleteNetworkFromNetworkSelect = async (
  driver: Driver,
  hexChainId: `0x${string}`,
) => {
  console.log(`Deleting network: ${hexChainId}`);
  const networkFilter = new NetworkFilter(driver);
  const selectNetworkModal = new SelectNetworkModal(driver);
  const networksPage = new NetworksPage(driver);

  await networkFilter.open();
  await selectNetworkModal.checkPageIsLoaded();
  await selectNetworkModal.clickManageNetworks();
  await networksPage.checkPageIsLoaded();
  // The networks page keys its list items by CAIP chain id.
  await networksPage.deleteNetwork(toEvmCaipChainId(hexChainId));
  await networksPage.clickCloseButton();
};

/**
 * Opens the network filter from the asset list and enables only the given
 * network, scoping the asset list to it. For snap-backed non-EVM networks
 * (see `SNAP_NETWORKS`), waits for the snap and account to be ready first.
 *
 * @param driver - The webdriver instance.
 * @param network - The display name of the network to switch to, or its CAIP
 * chain id, e.g. `eip155:1`.
 */
export const switchToNetworkFromNetworkSelect = async (
  driver: Driver,
  network: string,
) => {
  console.log(`Switching to network: ${network}`);
  const snapNetwork = SNAP_NETWORKS[network];
  if (snapNetwork) {
    await waitForSnapAccountReady(driver, snapNetwork);
  }

  const networkFilter = new NetworkFilter(driver);
  const selectNetworkModal = new SelectNetworkModal(driver);

  await networkFilter.open();
  await selectNetworkModal.checkPageIsLoaded();
  if (network.startsWith('eip155:')) {
    await selectNetworkModal.selectNetworkByChainId(network);
  } else {
    await selectNetworkModal.selectNetworkByNameWithWait(network);
  }
};

export async function waitForNetworkModalBackdropToClear(
  driver: Driver,
): Promise<void> {
  await driver.assertElementNotPresent('.modal__backdrop');
}
