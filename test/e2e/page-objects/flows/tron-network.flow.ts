import { TrxAccountType, TrxScope } from '@metamask/keyring-api';
import { Driver } from '../../webdriver/driver';
import { getCleanAppState } from '../../helpers';
import { TRON_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/tron-wallet-snap';
import HomePage from '../pages/home/homepage';
import { switchToNetworkFromNetworkSelect } from './network.flow';
import { login } from './login.flow';

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
 * Selects the Tron network from the home network filter.
 *
 * Waits for the Tron snap and account to be ready, then reuses the shared
 * network-switching flow (`switchToNetworkFromNetworkSelect`), which relies on
 * the modal's own condition waits instead of fixed delays.
 *
 * @param driver - WebDriver instance
 */
export async function selectTronNetwork(driver: Driver): Promise<void> {
  await waitForTronAccountToBeReady(driver);
  await switchToNetworkFromNetworkSelect(driver, 'Tron');
}

/**
 * Expected homepage native balance for `TRON_CHECK_BALANCE_ACCOUNT`
 * (106072392 SUN ≈ 106.072 TRX).
 */
const TRON_CHECK_BALANCE_HOMEPAGE_BALANCE = '106.072';

/**
 * Logs in, selects the Tron network via the readiness-wait flow, and gates on
 * the loaded homepage showing the seeded native TRX balance.
 *
 * @param driver - The WebDriver instance.
 */
export async function landOnTronHome(driver: Driver): Promise<void> {
  await login(driver, { validateBalance: false });

  await selectTronNetwork(driver);

  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.checkExpectedBalanceIsDisplayed(
    TRON_CHECK_BALANCE_HOMEPAGE_BALANCE,
  );
}
