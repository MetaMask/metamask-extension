import type { AccountTreeControllerState } from '@metamask/account-tree-controller';
import { TrxAccountType, TrxScope } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { TRON_WALLET_SNAP_ID } from '../../../../../shared/lib/accounts/tron-wallet-snap';
import { getCleanAppState } from '../../../helpers';
import {
  BASE_ACCOUNT_SYNC_INTERVAL,
  BASE_ACCOUNT_SYNC_TIMEOUT,
} from '../../../tests/identity/account-syncing/helpers';
import HomePage from './homepage';
import TokensTab from './tokens-tab';

/**
 * Home account overview when a non-EVM account (Solana, Bitcoin, Tron, etc.)
 * is selected.
 *
 * Screen: `#/` (DEFAULT_ROUTE) with a non-EVM account active.
 * Owns: non-EVM token balance checks (delegates to `TokensTab`); Tron BIP44
 * stage-2 account-ready wait; Tron native token-list wait; inherits Send /
 * Receive and other home actions from `HomePage`.
 * Boundaries: EVM-specific overview and tab content stay on `HomePage` /
 * the tab page objects. Token-list import/sort/hide belong to `TokensTab`.
 * Related: `HomePage` (base), `TokensTab` (`checkExpectedTokenBalanceIsDisplayed`).
 *
 * @see ui/components/multichain/account-overview/account-overview-non-evm.tsx
 */
class NonEvmHomepage extends HomePage {
  async checkExpectedTokenBalanceIsDisplayed(
    expectedTokenBalance: string,
    symbol: string,
  ): Promise<void> {
    const tokensTab = new TokensTab(this.driver);
    await tokensTab.checkExpectedTokenBalanceIsDisplayed(
      expectedTokenBalance,
      symbol,
    );
  }

  /**
   * Waits for BIP44 stage-2 alignment to finish creating the selected account
   * group's Tron account. Account-tree backup sync flags do not represent this
   * runtime alignment, so readiness is derived from the entropy wallet status
   * and the selected group's internal accounts instead.
   */
  async waitForTronAccountToBeReady(): Promise<void> {
    console.log('Wait for the selected account group Tron account to be ready');
    await this.driver.waitUntil(
      async () => {
        const uiState = await getCleanAppState(this.driver);
        const selectedAccountGroup = uiState?.metamask?.selectedAccountGroup;
        const wallets = uiState?.metamask?.accountTree?.wallets as
          | AccountTreeControllerState['accountTree']['wallets']
          | undefined;
        const internalAccounts = uiState?.metamask?.internalAccounts
          ?.accounts as Record<string, InternalAccount> | undefined;

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
        interval: BASE_ACCOUNT_SYNC_INTERVAL,
        timeout: BASE_ACCOUNT_SYNC_TIMEOUT,
      },
    );
  }

  /**
   * Waits until the native Tron token row is present in the asset list. The
   * Tron Snap only starts its balance fetch when the network is switched while
   * the Snap is fully ready; this wait is the deterministic signal that fetch
   * actually ran.
   *
   * @param timeout - Max ms to wait for the token name cell.
   */
  async waitForTronNativeTokenToBeListed(timeout = 15_000): Promise<void> {
    console.log('Wait for the Tron native token to appear in the token list');
    const tokensTab = new TokensTab(this.driver);
    await tokensTab.checkTokenExistsInList('Tron', undefined, { timeout });
  }

  // Receive is clicked via the inherited HomePage.clickOnReceiveButton
  // (matches the visible "Receive" button label). A previous override matched
  // `[data-testid="coin-overview-receive"]`, which no longer exists on current
  // main: when Receive is the only enabled overflow action (typical for
  // non-EVM accounts) CoinButtons renders it as `coin-overview-default`.
}

export default NonEvmHomepage;
