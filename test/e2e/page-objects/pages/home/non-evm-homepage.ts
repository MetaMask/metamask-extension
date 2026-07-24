import HomePage from './homepage';
import TokensTab from './tokens-tab';

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

  // Receive is clicked via the inherited HomePage.clickOnReceiveButton
  // (matches the visible "Receive" button label). A previous override matched
  // `[data-testid="coin-overview-receive"]`, which no longer exists on current
  // main: when Receive is the only enabled overflow action (typical for
  // non-EVM accounts) CoinButtons renders it as `coin-overview-default`.
}

export default NonEvmHomepage;
