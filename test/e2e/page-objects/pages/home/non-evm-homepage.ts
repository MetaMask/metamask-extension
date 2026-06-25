import HomePage from './homepage';
import TokensTab from './tokens-tab';

class NonEvmHomepage extends HomePage {
  private readonly receiveButtonTestId =
    '[data-testid="coin-overview-receive"]';

  async clickOnReceiveButton(): Promise<void> {
    console.log('Click Receive on non-EVM homepage');
    await this.driver.clickElement(this.receiveButtonTestId);
  }

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
}

export default NonEvmHomepage;
