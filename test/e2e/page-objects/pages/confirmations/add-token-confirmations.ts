import { Driver } from '../../../webdriver/driver';

/**
 * Add suggested tokens confirmation (`wallet_watchAsset` for ERC-20).
 *
 * Screen: `#/confirm-add-suggested-token` (legacy page-container, not
 * redesigned `#/confirmation`).
 * Owns: "Add suggested tokens" title and page-container confirm/reject
 * footer.
 * Boundaries: NFT / suggested-asset confirm with only a next footer may use
 * `WatchAssetConfirmation`. Redesigned token transfer confirmations are
 * `TokenTransferTransactionConfirmation`.
 * Related: `WatchAssetConfirmation`.
 *
 * @see ui/pages/confirm-add-suggested-token/confirm-add-suggested-token.js
 */
class AddTokenConfirmation {
  private readonly addTokenConfirmationTitle = {
    css: '.page-container__title',
    text: 'Add suggested tokens',
  };

  private readonly confirmAddTokenButton =
    '[data-testid="page-container-footer-next"]';

  driver: Driver;

  private readonly parentSelector = {
    testId: 'parent-selector-add-token-confirmation',
  };

  private readonly rejectAddTokenButton =
    '[data-testid="page-container-footer-cancel"]';

  private readonly suggestedTokenBalance =
    '[data-testid="confirm-add-suggested-token-balance"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.parentSelector,
        this.addTokenConfirmationTitle,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Add token confirmation page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Add token confirmation page is loaded');
  }

  /**
   * Waits for the suggested token row to show the given balance. The balance is
   * read from the chain the dapp requested the token on, not the chain selected
   * in the wallet UI.
   *
   * @param balance - Expected balance including the symbol, e.g. `10 TST`.
   */
  async checkSuggestedTokenBalanceIsDisplayed(balance: string): Promise<void> {
    console.log(`Check suggested token balance is ${balance}`);
    await this.driver.waitForSelector({
      css: this.suggestedTokenBalance,
      text: balance,
    });
  }

  async confirmAddToken(): Promise<void> {
    console.log('Confirm add token');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmAddTokenButton,
    );
  }

  async rejectAddToken(): Promise<void> {
    console.log('Reject add token');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.rejectAddTokenButton,
    );
  }
}

export default AddTokenConfirmation;
