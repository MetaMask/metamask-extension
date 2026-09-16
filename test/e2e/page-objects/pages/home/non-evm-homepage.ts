import HomePage from './homepage';
import TokensTab from './tokens-tab';

/**
 * Home account overview when a non-EVM account (Solana, Bitcoin, etc.) is
 * selected.
 *
 * Screen: `#/` (DEFAULT_ROUTE) with a non-EVM account active.
 * Owns: non-EVM token balance checks (delegates to `TokensTab`); inherits
 * Send / Receive and other home actions from `HomePage`.
 * Boundaries: EVM-specific overview and tab content stay on `HomePage` /
 * the tab page objects. Token-list import/sort/hide belong to `TokensTab`.
 * Related: `HomePage` (base), `TokensTab` (`checkExpectedTokenBalanceIsDisplayed`).
 *
 * @see ui/components/multichain/account-overview/account-overview-non-evm.tsx
 */
class NonEvmHomepage extends HomePage {
  private readonly nonEvmPage = {
    testId: 'parent-selector-non-evm-home',
  };

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

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.nonEvmPage);
    console.log('Non-EVM home page is loaded');
  }
}

export default NonEvmHomepage;
