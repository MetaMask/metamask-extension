import { Driver } from '../../../webdriver/driver';
import { Ganache } from '../../../seeder/ganache';
import { getCleanAppState } from '../../../helpers';
import HeaderNavbar from '../header-navbar';

class HomePage {
  protected driver: Driver;

  public headerNavbar: HeaderNavbar;

  private readonly activityTab = {
    testId: 'account-overview__activity-tab',
  };

  protected readonly balance: string =
    '[data-testid="eth-overview__primary-currency"]';

  private readonly basicFunctionalityOffWarningMessage = {
    text: 'Basic functionality is off',
    css: '.mm-banner-alert',
  };

  protected readonly bridgeButton: string =
    '[data-testid="eth-overview-bridge"]';

  private readonly closeUseNetworkNotificationModalButton = {
    text: 'Got it',
    tag: 'h6',
  };

  private readonly erc20TokenDropdown = {
    testId: 'import-token-button',
  };

  private readonly nftTab = {
    testId: 'account-overview__nfts-tab',
  };

  private readonly popoverBackground = '.popover-bg';

  private readonly popoverCloseButton = {
    testId: 'popover-close',
  };

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

  private readonly tokensTab = {
    testId: 'account-overview__asset-tab',
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

  async togglePrivacyBalance(): Promise<void> {
    await this.driver.clickElement(this.privacyBalanceToggle);
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
   * This function checks if account syncing has been successfully completed at least once.
   */
  async check_hasAccountSyncingSyncedAtLeastOnce(): Promise<void> {
    console.log('Check if account syncing has synced at least once');
    await this.driver.wait(async () => {
      const uiState = await getCleanAppState(this.driver);
      return uiState.metamask.hasAccountSyncingSyncedAtLeastOnce === true;
    }, 10000);
  }

  async check_ifBridgeButtonIsClickable(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.bridgeButton, 1000);
    } catch (e) {
      console.log('Bridge button not clickable', e);
      return false;
    }
    console.log('Bridge button is clickable');
    return true;
  }

  async check_ifSendButtonIsClickable(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.sendButton, 1000);
    } catch (e) {
      console.log('Send button not clickable', e);
      return false;
    }
    console.log('Send button is clickable');
    return true;
  }

  async check_ifSwapButtonIsClickable(): Promise<boolean> {
    try {
      await this.driver.findClickableElement(this.swapButton, 1000);
    } catch (e) {
      console.log('Swap button not clickable', e);
      return false;
    }
    console.log('Swap button is clickable');
    return true;
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
}

export default HomePage;
