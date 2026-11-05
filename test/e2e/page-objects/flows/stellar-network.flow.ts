import { XlmAccountType, XlmScope } from '@metamask/keyring-api';
import { Driver } from '../../webdriver/driver';
import { getCleanAppState } from '../../helpers';
import { STELLAR_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/stellar-wallet-snap';
import { STELLAR_NETWORK_NAME } from '../../tests/stellar/mocks/common-stellar';
import { switchToNetworkFromNetworkSelect } from './network.flow';

/**
 * Subset of extension state needed to determine whether the Stellar snap and
 * the selected account's Stellar account are ready.
 */
type StellarReadinessWallet = {
  status?: string;
  groups?: Record<string, { accounts?: string[] } | undefined>;
};

type StellarReadinessState = {
  snaps?: Record<string, { status?: string } | undefined>;
  selectedAccountGroup?: string;
  accountTree?: {
    wallets?: Record<string, StellarReadinessWallet | undefined>;
  };
  internalAccounts?: {
    accounts?: { id: string; type: string; scopes?: string[] }[];
  };
};

type StellarUiState = { metamask?: StellarReadinessState | undefined };

/**
 * Waits until the Stellar snap is running and the selected account group's
 * wallet is ready and contains a Stellar internal account scoped to pubnet.
 *
 * @param driver - The WebDriver instance.
 */
export async function waitForStellarAccountToBeReady(
  driver: Driver,
): Promise<void> {
  console.log('Waiting for the Stellar snap and account to be ready');
  await driver.waitUntil(
    async () => {
      const state = (await getCleanAppState(driver)) as StellarUiState | null;
      const metamaskState = state?.metamask;
      if (!metamaskState) {
        return false;
      }

      if (metamaskState.snaps?.[STELLAR_WALLET_SNAP_ID]?.status !== 'running') {
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
          account?.type === XlmAccountType.Account &&
          account.scopes?.includes(XlmScope.Pubnet)
        );
      });
    },
    { interval: 1_000, timeout: 45_000 },
  );
}

/**
 * Selects the Stellar network from the home network filter after the snap and
 * account are ready. `selectNetworkByNameWithWait` scrolls the row into view
 * first — after onboarding Stellar sits below the fold in the popular list.
 *
 * @param driver - WebDriver instance.
 */
export async function selectStellarNetwork(driver: Driver): Promise<void> {
  await waitForStellarAccountToBeReady(driver);
  await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);
}
