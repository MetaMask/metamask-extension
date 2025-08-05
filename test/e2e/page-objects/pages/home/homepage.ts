import { Driver } from '../../../webdriver/driver';
import { Ganache } from '../../../seeder/ganache';
import { Anvil } from '../../../seeder/anvil';
import { getCleanAppState } from '../../../helpers';
import HeaderNavbar from '../header-navbar';

class HomePage {
  protected driver: Driver;

  public headerNavbar: HeaderNavbar;

  private readonly activityTab = {
    testId: 'account-overview__activity-tab',
  };

  private readonly backupSecretRecoveryPhraseButton = {
    text: 'Back up now',
    css: '.home-notification__accept-button',
  };

  private readonly backupSecretRecoveryPhraseNotification = {
    text: 'Back up your Secret Recovery Phrase to keep your wallet and funds secure.',
    css: '.home-notification__text',
  };

  protected readonly balance: string =
    '[data-testid="eth-overview__primary-currency"]';

  private readonly basicFunctionalityOffWarningMessage = {
    text: 'Basic functionality is off',
    css: '.mm-banner-base',
  };

  protected readonly bridgeButton: string =
    '[data-testid="eth-overview-bridge"]';

  private readonly closeUseNetworkNotificationModalButton = {
    text: 'Got it',
    tag: 'h6',
  };

  private readonly erc20TokenDropdown = {
    testId: 'asset-list-control-bar-action-button',
  };

  private readonly loadingOverlay = {
    text: 'Connecting to Localhost 8545',
  };

  private readonly nftTab = {
    testId: 'account-overview__nfts-tab',
  };

  private readonly defiTab = {
    testId: 'account-overview__defi-tab',
  };

  private readonly popoverBackground = '.popover-bg';

  private readonly portfolioLink = '[data-testid="portfolio-link"]';

  private readonly privacyBalanceToggle = {
    testId: 'sensitive-toggle',
  };

  protected readonly sendButton: string = '[data-testid="eth-overview-send"]';

  protected readonly swapButton: string =
    '[data-testid="token-overview-button-swap"]';

  private readonly refreshErc20Tokens = {
    testId: 'refreshList',
  };

  private readonly surveyToast = '[data-testid="survey-toast"]';

  private readonly tokensTab = {
    testId: 'account-overview__asset-tab',
  };

  private readonly closeSurveyToastBannerButton =
    '[data-testid="survey-toast-banner-base"] [aria-label="Close"] span';

  private readonly copyAddressButton = '[data-testid="app-header-copy-button"]';

  private readonly connectionsRemovedModal =
    '[data-testid="connections-removed-modal"]';

  constructor(driver: Driver) {
    this.driver = driver;
    this.headerNavbar = new HeaderNavbar(driver);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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

  async closeSurveyToast(surveyName: string): Promise<void> {
    console.log(`Close survey toast for ${surveyName}`);
    await this.driver.waitForSelector({
      css: this.surveyToast,
      text: surveyName,
    });
    await this.driver.clickElement(this.closeSurveyToastBannerButton);
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

  async goToBackupSRPPage(): Promise<void> {
    console.log(`Go to backup secret recovery phrase on homepage`);
    await this.driver.waitForSelector(
      this.backupSecretRecoveryPhraseNotification,
    );
    await this.driver.clickElement(this.backupSecretRecoveryPhraseButton);
  }

  async goToNftTab(): Promise<void> {
    console.log(`Go to NFT tab on homepage`);
    await this.driver.clickElement(this.nftTab);
  }

  async goToDeFiTab(): Promise<void> {
    console.log(`Go to DeFi tab on homepage`);
    await this.driver.clickElement(this.defiTab);
  }

  async goToTokensTab(): Promise<void> {
    console.log(`Go to tokens tab on homepage`);
    await this.driver.clickElement(this.tokensTab);
  }

  async openPortfolioPage(): Promise<void> {
    console.log(`Open portfolio page on homepage`);
    await this.driver.clickElement(this.portfolioLink);
  }

  async refreshErc20TokenList(): Promise<void> {
    console.log(`Refresh the ERC20 token list`);
    await this.driver.clickElement(this.erc20TokenDropdown);
    await this.driver.clickElement(this.refreshErc20Tokens);
  }

  async startSendFlow(): Promise<void> {
    await this.driver.clickElement(this.sendButton);
  }

  async startSwapFlow(): Promise<void> {
    await this.driver.clickElement(this.swapButton);
  }

  async startBridgeFlow(): Promise<void> {
    await this.driver.clickElement(this.bridgeButton);
  }

  async togglePrivacyBalance(): Promise<void> {
    await this.driver.clickElement(this.privacyBalanceToggle);
  }

  async waitForLoadingOverlayToDisappear(): Promise<void> {
    console.log(`Wait for loading overlay to disappear`);
    await this.driver.assertElementNotPresent(this.loadingOverlay, {
      waitAtLeastGuard: 1000,
      timeout: 10000,
    });
  }

  /**
   * Checks if the toaster message for adding a network is displayed on the homepage.
   *
   * @param networkName - The name of the network that was added.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_addNetworkMessageIsDisplayed(networkName: string): Promise<void> {
    console.log(
      `Check the toaster message for adding network ${networkName} is displayed on homepage`,
    );
    await this.driver.waitForSelector({
      tag: 'h6',
      text: `“${networkName}” was successfully added!`,
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_backupReminderIsNotDisplayed(): Promise<void> {
    console.log('Check backup reminder is not displayed on homepage');
    await this.driver.assertElementNotPresent(
      this.backupSecretRecoveryPhraseNotification,
    );
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_basicFunctionalityOffWarnigMessageIsDisplayed(): Promise<void> {
    console.log(
      'Check if basic functionality off warning message is displayed on homepage',
    );
    await this.driver.waitForSelector(this.basicFunctionalityOffWarningMessage);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_disabledButtonTooltip(tooltipText: string): Promise<void> {
    console.log(`Check if disabled button tooltip is displayed on homepage`);
    await this.driver.waitForSelector(
      `.icon-button--disabled [data-tooltipped][data-original-title="${tooltipText}"]`,
    );
  }

  /**
   * Checks if the toaster message for editing a network is displayed on the homepage.
   *
   * @param networkName - The name of the network that was edited.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
   * @param expectedBalance - The expected balance to be displayed. Defaults to '25'.
   * @param symbol - The symbol of the currency or token. Defaults to 'ETH'.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_expectedBalanceIsDisplayed(
    expectedBalance: string = '25',
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
   * Checks if the expected token balance is displayed on homepage.
   *
   * @param expectedTokenBalance - The expected balance to be displayed.
   * @param symbol - The symbol of the currency or token.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_expectedTokenBalanceIsDisplayed(
    expectedTokenBalance: string,
    symbol: string,
  ): Promise<void> {
    await this.driver.waitForSelector({
      css: '[data-testid="multichain-token-list-item-value"]',
      text: `${expectedTokenBalance} ${symbol}`,
    });
  }

  /**
   * This function checks if account syncing has been successfully completed at least once.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_hasAccountSyncingSyncedAtLeastOnce(): Promise<void> {
    console.log('Check if account syncing has synced at least once');
    await this.driver.wait(async () => {
      const uiState = await getCleanAppState(this.driver);
      return uiState.metamask.hasAccountSyncingSyncedAtLeastOnce === true;
    }, 30000); // Syncing can take some time so adding a longer timeout to reduce flakes
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_ifBridgeButtonIsClickable(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.bridgeButton, {
        timeout: 1000,
      });
    } catch (e) {
      console.log('Bridge button not clickable', e);
      return false;
    }
    console.log('Bridge button is clickable');
    return true;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_ifSendButtonIsClickable(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.sendButton, {
        timeout: 1000,
      });
    } catch (e) {
      console.log('Send button not clickable', e);
      return false;
    }
    console.log('Send button is clickable');
    return true;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_ifSwapButtonIsClickable(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.swapButton, {
        timeout: 1000,
      });
    } catch (e) {
      console.log('Swap button not clickable', e);
      return false;
    }
    console.log('Swap button is clickable');
    return true;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_localNodeBalanceIsDisplayed(
    localNode?: Ganache | Anvil,
    address = null,
  ): Promise<void> {
    let expectedBalance: string;
    if (localNode) {
      expectedBalance = (await localNode.getBalance(address)).toString();
    } else {
      expectedBalance = '25';
    }
    await this.check_expectedBalanceIsDisplayed(expectedBalance);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_newSrpAddedToastIsDisplayed(
    srpNumber: number = 2,
  ): Promise<void> {
    await this.driver.waitForSelector({
      text: `Secret Recovery Phrase ${srpNumber} imported`,
    });
  }

  async checkNoSurveyToastIsDisplayed(): Promise<void> {
    console.log('Check no survey toast is displayed on homepage');
    await this.driver.assertElementNotPresent(this.surveyToast, {
      timeout: 5000,
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_portfolioLinkIsDisplayed(): Promise<void> {
    console.log('Check if portfolio link is displayed on homepage');
    await this.driver.waitForSelector(this.portfolioLink);
  }

  /**
   * Check if the expected warning message is displayed on homepage.
   *
   * @param message - The message to be displayed.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_warningMessageIsDisplayed(message: string): Promise<void> {
    console.log(`Check if warning message ${message} is displayed on homepage`);
    await this.driver.waitForSelector({
      text: message,
      tag: 'p',
    });
  }

  /**
   * Clicks the copy address button.
   */
  async getAccountAddress(): Promise<string> {
    const accountAddress = await this.driver.findElement(
      this.copyAddressButton,
    );
    return accountAddress.getText();
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_connectionsRemovedModalIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.connectionsRemovedModal);
  }
}

export default HomePage;
