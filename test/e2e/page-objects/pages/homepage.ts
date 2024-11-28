import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';
import { Ganache } from '../../seeder/ganache';
import { getCleanAppState } from '../../helpers';
import HeaderNavbar from './header-navbar';

class HomePage {
  private driver: Driver;

  public headerNavbar: HeaderNavbar;

  private readonly activityTab =
    '[data-testid="account-overview__activity-tab"]';

  private readonly balance = '[data-testid="eth-overview__primary-currency"]';

  private readonly basicFunctionalityOffWarningMessage = {
    text: 'Basic functionality is off',
    css: '.mm-banner-alert',
  };

  private readonly closeUseNetworkNotificationModalButton = {
    text: 'Got it',
    tag: 'h6',
  };

  private readonly completedTransactions = '[data-testid="activity-list-item"]';

  private readonly confirmedTransactions = {
    text: 'Confirmed',
    css: '.transaction-status-label--confirmed',
  };

  private readonly failedTransactions = {
    text: 'Failed',
    css: '.transaction-status-label--failed',
  };

  private readonly popoverBackground = '.popover-bg';

  private readonly sendButton = '[data-testid="eth-overview-send"]';

  private readonly tokensTab = '[data-testid="account-overview__asset-tab"]';

  private readonly transactionAmountsInActivity =
    '[data-testid="transaction-list-item-primary-currency"]';

  // Token tab selectors
  private readonly assetOptionsButton = '[data-testid="asset-options__button"]';

  private readonly confirmImportTokenButton =
    '[data-testid="import-tokens-modal-import-button"]';

  private readonly confirmImportTokenMessage = {
    text: 'Would you like to import this token?',
    tag: 'p',
  };

  private readonly hideTokenButton = '[data-testid="asset-options__hide"]';

  private readonly hideTokenConfirmationButton =
    '[data-testid="hide-token-confirmation__hide"]';

  private readonly hideTokenConfirmationModalTitle = {
    text: 'Hide token',
    css: '.hide-token-confirmation__title',
  };

  private readonly importTokenModalTitle = { text: 'Import tokens', tag: 'h4' };

  private readonly importTokensButton = '[data-testid="importTokens"]';

  private readonly importTokensNextButton =
    '[data-testid="import-tokens-button-next"]';

  private readonly tokenAmountValue =
    '[data-testid="multichain-token-list-item-value"]';

  private readonly tokenLisiItem =
    '[data-testid="multichain-token-list-button"]';

  private readonly tokenOptionsButton = '[data-testid="import-token-button"]';

  private readonly tokenSearchInput = 'input[placeholder="Search tokens"]';

  // NFT selectors
  private readonly confirmImportNftButton =
    '[data-testid="import-nfts-modal-import-button"]';

  private readonly importNftAddressInput = '#address';

  private readonly importNftButton = '[data-testid="import-nft-button"]';

  private readonly importNftModalTitle = { text: 'Import NFT', tag: 'header' };

  private readonly importNftTokenIdInput = '#token-id';

  private readonly nftIconOnActivityList = '[data-testid="nft-item"]';

  private readonly nftTab = '[data-testid="account-overview__nfts-tab"]';

  private readonly popoverCloseButton = '[data-testid="popover-close"]';

  private readonly successImportNftMessage = {
    text: 'NFT was successfully added!',
    tag: 'h6',
  };

  constructor(driver: Driver) {
    this.driver = driver;
    this.headerNavbar = new HeaderNavbar(driver);
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.sendButton,
        this.activityTab,
        this.tokensTab,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for home page to be loaded', e);
      throw e;
    }
    console.log('Home page is loaded');
  }

  async clickNFTIconOnActivityList() {
    await this.driver.clickElement(this.nftIconOnActivityList);
  }

  async closePopover(): Promise<void> {
    console.log('Closing popover');
    await this.driver.clickElement(this.popoverCloseButton);
  }

  async closeUseNetworkNotificationModal(): Promise<void> {
    // We need to use clickElementSafe + assertElementNotPresent as sometimes the network dialog doesn't appear, as per this issue (#25788)
    // TODO: change the 2 actions for clickElementAndWaitToDisappear, once the issue is fixed
    await this.driver.assertElementNotPresent(this.popoverBackground);
    await this.driver.clickElementSafe(
      this.closeUseNetworkNotificationModalButton,
    );
    await this.driver.assertElementNotPresent(
      this.closeUseNetworkNotificationModalButton,
    );
  }

  async goToActivityList(): Promise<void> {
    console.log(`Open activity tab on homepage`);
    await this.driver.clickElement(this.activityTab);
  }

  async goToNftTab(): Promise<void> {
    console.log(`Go to NFT tab on homepage`);
    await this.driver.clickElement(this.nftTab);
  }

  /**
   * Hides a token by clicking on the token name, and confirming the hide modal.
   *
   * @param tokenName - The name of the token to hide.
   */
  async hideToken(tokenName: string): Promise<void> {
    console.log(`Hide token ${tokenName} on homepage`);
    await this.driver.clickElement({ text: tokenName, tag: 'span' });
    await this.driver.clickElement(this.assetOptionsButton);
    await this.driver.clickElement(this.hideTokenButton);
    await this.driver.waitForSelector(this.hideTokenConfirmationModalTitle);
    await this.driver.clickElementAndWaitToDisappear(
      this.hideTokenConfirmationButton,
    );
  }

  async startSendFlow(): Promise<void> {
    await this.driver.clickElement(this.sendButton);
  }

  /**
   * Imports an NFT by entering the NFT contract address and token ID
   *
   * @param nftContractAddress - The address of the NFT contract to import
   * @param id - The ID of the NFT to import
   * @param expectedErrorMessage - Expected error message if the import should fail
   */
  async importNft(
    nftContractAddress: string,
    id: string,
    expectedErrorMessage?: string,
  ) {
    await this.driver.clickElement(this.importNftButton);
    await this.driver.waitForSelector(this.importNftModalTitle);
    await this.driver.fill(this.importNftAddressInput, nftContractAddress);
    await this.driver.fill(this.importNftTokenIdInput, id);
    if (expectedErrorMessage) {
      await this.driver.clickElement(this.confirmImportNftButton);
      await this.driver.waitForSelector({
        tag: 'p',
        text: expectedErrorMessage,
      });
    } else {
      await this.driver.clickElementAndWaitToDisappear(
        this.confirmImportNftButton,
      );
    }
  }

  async importTokenBySearch(tokenName: string) {
    console.log(`Import token ${tokenName} on homepage by search`);
    await this.driver.clickElement(this.tokenOptionsButton);
    await this.driver.clickElement(this.importTokensButton);
    await this.driver.waitForSelector(this.importTokenModalTitle);
    await this.driver.fill(this.tokenSearchInput, tokenName);
    await this.driver.clickElement({ text: tokenName, tag: 'p' });
    await this.driver.clickElement(this.importTokensNextButton);
    await this.driver.waitForSelector(this.confirmImportTokenMessage);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmImportTokenButton,
    );
  }

  /**
   * Checks if the toaster message for adding a network is displayed on the homepage.
   *
   * @param networkName - The name of the network that was added.
   */
  async check_addNetworkMessageIsDisplayed(networkName: string): Promise<void> {
    console.log(
      `Check the toaster message for adding network ${networkName} is displayed on homepage`,
    );
    await this.driver.waitForSelector({
      tag: 'h6',
      text: `“${networkName}” was successfully added!`,
    });
  }

  async check_basicFunctionalityOffWarnigMessageIsDisplayed(): Promise<void> {
    console.log(
      'Check if basic functionality off warning message is displayed on homepage',
    );
    await this.driver.waitForSelector(this.basicFunctionalityOffWarningMessage);
  }

  /**
   * This function checks the specified number of completed transactions are displayed in the activity list on the homepage.
   * It waits up to 10 seconds for the expected number of completed transactions to be visible.
   *
   * @param expectedNumber - The number of completed transactions expected to be displayed in the activity list. Defaults to 1.
   * @returns A promise that resolves if the expected number of completed transactions is displayed within the timeout period.
   */
  async check_completedTxNumberDisplayedInActivity(
    expectedNumber: number = 1,
  ): Promise<void> {
    console.log(
      `Wait for ${expectedNumber} completed transactions to be displayed in activity list`,
    );
    await this.driver.wait(async () => {
      const completedTxs = await this.driver.findElements(
        this.completedTransactions,
      );
      return completedTxs.length === expectedNumber;
    }, 10000);
    console.log(
      `${expectedNumber} completed transactions found in activity list on homepage`,
    );
  }

  /**
   * This function checks if the specified number of confirmed transactions are displayed in the activity list on homepage.
   * It waits up to 10 seconds for the expected number of confirmed transactions to be visible.
   *
   * @param expectedNumber - The number of confirmed transactions expected to be displayed in activity list. Defaults to 1.
   * @returns A promise that resolves if the expected number of confirmed transactions is displayed within the timeout period.
   */
  async check_confirmedTxNumberDisplayedInActivity(
    expectedNumber: number = 1,
  ): Promise<void> {
    console.log(
      `Wait for ${expectedNumber} confirmed transactions to be displayed in activity list`,
    );
    await this.driver.wait(async () => {
      const confirmedTxs = await this.driver.findElements(
        this.confirmedTransactions,
      );
      return confirmedTxs.length === expectedNumber;
    }, 10000);
    console.log(
      `${expectedNumber} confirmed transactions found in activity list on homepage`,
    );
  }

  async check_nftImageIsDisplayed(): Promise<void> {
    console.log('Check that NFT image is displayed in NFT tab on homepage');
    await this.driver.waitForSelector(this.nftIconOnActivityList);
  }

  /**
   * Checks if the toaster message for editing a network is displayed on the homepage.
   *
   * @param networkName - The name of the network that was edited.
   */
  async check_editNetworkMessageIsDisplayed(
    networkName: string,
  ): Promise<void> {
    console.log(
      `Check the toaster message for editing network ${networkName} is displayed on homepage`,
    );
    await this.driver.waitForSelector({
      tag: 'h6',
      text: `“${networkName}” was successfully edited!`,
    });
  }

  /**
   * Checks if the expected balance is displayed on homepage.
   *
   * @param expectedBalance - The expected balance to be displayed. Defaults to '0'.
   * @param symbol - The symbol of the currency or token. Defaults to 'ETH'.
   */
  async check_expectedBalanceIsDisplayed(
    expectedBalance: string = '0',
    symbol: string = 'ETH',
  ): Promise<void> {
    try {
      await this.driver.waitForSelector({
        css: this.balance,
        text: expectedBalance,
      });
    } catch (e) {
      const balance = await this.driver.waitForSelector(this.balance);
      const currentBalance = parseFloat(await balance.getText());
      const errorMessage = `Expected balance ${expectedBalance} ${symbol}, got balance ${currentBalance} ${symbol}`;
      console.log(errorMessage, e);
      throw e;
    }
    console.log(
      `Expected balance ${expectedBalance} ${symbol} is displayed on homepage`,
    );
  }

  /**
   * This function checks if the specified number of failed transactions are displayed in the activity list on homepage.
   * It waits up to 10 seconds for the expected number of failed transactions to be visible.
   *
   * @param expectedNumber - The number of failed transactions expected to be displayed in activity list. Defaults to 1.
   * @returns A promise that resolves if the expected number of failed transactions is displayed within the timeout period.
   */
  async check_failedTxNumberDisplayedInActivity(
    expectedNumber: number = 1,
  ): Promise<void> {
    console.log(
      `Wait for ${expectedNumber} failed transactions to be displayed in activity list`,
    );
    await this.driver.wait(async () => {
      const failedTxs = await this.driver.findElements(this.failedTransactions);
      return failedTxs.length === expectedNumber;
    }, 10000);
    console.log(
      `${expectedNumber} failed transactions found in activity list on homepage`,
    );
  }

  async check_localBlockchainBalanceIsDisplayed(
    localBlockchainServer?: Ganache,
    address = null,
  ): Promise<void> {
    let expectedBalance: string;
    if (localBlockchainServer) {
      expectedBalance = (
        await localBlockchainServer.getBalance(address)
      ).toString();
    } else {
      expectedBalance = '0';
    }
    await this.check_expectedBalanceIsDisplayed(expectedBalance);
  }

  /**
   * Checks if the NFT item with the specified name is displayed in the homepage nft tab.
   *
   * @param nftName - The name of the NFT to check for.
   */
  async check_nftNameIsDisplayed(nftName: string): Promise<void> {
    console.log(
      `Check that NFT item ${nftName} is displayed in NFT tab on homepage`,
    );
    await this.driver.waitForSelector({
      tag: 'h5',
      text: nftName,
    });
  }

  async check_successImportNftMessageIsDisplayed(): Promise<void> {
    console.log(
      'Check that success imported NFT message is displayed on homepage',
    );
    await this.driver.waitForSelector(this.successImportNftMessage);
  }

  /**
   * Checks if the specified token amount is displayed in the token list.
   *
   * @param tokenAmount - The token amount to be checked for.
   */
  async check_tokenAmountIsDisplayed(tokenAmount: string): Promise<void> {
    console.log(`Waiting for token amount ${tokenAmount} to be displayed`);
    await this.driver.waitForSelector({
      css: this.tokenAmountValue,
      text: tokenAmount,
    });
  }

  /**
   * Checks if the specified token amount is displayed in the token details modal.
   *
   * @param tokenName - The name of the token to check for.
   * @param tokenAmount - The token amount to be checked for.
   */
  async check_tokenAmountInTokenDetailsModal(
    tokenName: string,
    tokenAmount: string,
  ): Promise<void> {
    console.log(
      `Check that token amount ${tokenAmount} is displayed in token details modal for token ${tokenName}`,
    );
    await this.driver.clickElement({
      tag: 'span',
      text: tokenName,
    });
    await this.driver.waitForSelector({
      css: this.tokenAmountValue,
      text: tokenAmount,
    });
  }

  /**
   * This function checks if the specified number of token items is displayed in the token list.
   *
   * @param expectedNumber - The number of token items expected to be displayed. Defaults to 1.
   * @returns A promise that resolves if the expected number of token items is displayed.
   */
  async check_tokenItemNumber(expectedNumber: number = 1): Promise<void> {
    console.log(`Waiting for ${expectedNumber} token items to be displayed`);
    await this.driver.wait(async () => {
      const tokenItems = await this.driver.findElements(this.tokenLisiItem);
      return tokenItems.length === expectedNumber;
    }, 10000);
    console.log(
      `Expected number of token items ${expectedNumber} is displayed.`,
    );
  }

  /**
   * This function checks if a specified transaction amount at the specified index matches the expected one.
   *
   * @param expectedAmount - The expected transaction amount to be displayed. Defaults to '-1 ETH'.
   * @param expectedNumber - The 1-based index of the transaction in the activity list whose amount is to be checked.
   * Defaults to 1, indicating the first transaction in the list.
   * @returns A promise that resolves if the transaction amount at the specified index matches the expected amount.
   * The promise is rejected if the amounts do not match or if an error occurs during the process.
   * @example
   * // To check if the third transaction in the activity list displays an amount of '2 ETH'
   * await check_txAmountInActivity('2 ETH', 3);
   */
  async check_txAmountInActivity(
    expectedAmount: string = '-1 ETH',
    expectedNumber: number = 1,
  ): Promise<void> {
    const transactionAmounts = await this.driver.findElements(
      this.transactionAmountsInActivity,
    );
    const transactionAmountsText = await transactionAmounts[
      expectedNumber - 1
    ].getText();
    assert.equal(
      transactionAmountsText,
      expectedAmount,
      `${transactionAmountsText} is displayed as transaction amount instead of ${expectedAmount} for transaction ${expectedNumber}`,
    );
    console.log(
      `Amount for transaction ${expectedNumber} is displayed as ${expectedAmount}`,
    );
  }

  /**
   * This function checks if account syncing has been successfully completed at least once.
   */
  async check_hasAccountSyncingSyncedAtLeastOnce(): Promise<void> {
    console.log('Check if account syncing has synced at least once');
    await this.driver.wait(async () => {
      const uiState = await getCleanAppState(this.driver);
      return uiState.metamask.hasAccountSyncingSyncedAtLeastOnce === true;
    }, 10000);
  }
}

export default HomePage;
