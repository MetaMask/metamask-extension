import { WebElement } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';
import { Anvil } from '../../../seeder/anvil';
import HeaderNavbar from '../header-navbar';
import { getCleanAppState, regularDelayMs } from '../../../helpers';
import { HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS } from '../../../constants';
import {
  BASE_ACCOUNT_SYNC_INTERVAL,
  BASE_ACCOUNT_SYNC_TIMEOUT,
  POST_UNLOCK_DELAY,
} from '../../../tests/identity/account-syncing/helpers';

export type CheckExpectedBalanceOptions = {
  expectedBalance?: string;
  symbol?: string;
  expectFundYourWalletBanner?: boolean;
  timeout?: number;
};

// TODO: Remove this widened wait once #43958 globalizes the Solana discovery
// mocks. The Solana snap calls 15 discovery RPC methods but
// `setupDefaultNonEvmDiscoveryMocks` only mocks `getSignaturesForAddress`; the
// rest fall through to the empty-200 catch-all and drive a retry storm that
// delays the Solana icon past the default 10s wait.
const NON_EVM_ICON_TIMEOUT = 20_000;

class HomePage {
  protected driver: Driver;

  public headerNavbar: HeaderNavbar;

  protected readonly activityTab = {
    testId: 'account-overview__activity-tab',
  };

  private readonly backupRemindMeLaterButton = {
    tag: 'button',
    text: 'Remind me later',
  };

  private readonly backupSecretRecoveryPhraseButton = {
    text: 'Back up now',
    css: '.home-notification__accept-button',
  };

  private readonly backupSecretRecoveryPhraseNotification = {
    text: 'Back up your Secret Recovery Phrase to keep your wallet and funds secure.',
    css: '.home-notification__text',
  };

  // Matches both the EVM (`eth-overview__primary-currency`) and non-EVM
  // (`coin-overview__primary-currency`) balance containers.
  protected readonly balance: string =
    '[data-testid$="overview__primary-currency"]';

  private readonly basicFunctionalityOffWarningMessage = {
    text: 'Basic functionality is off',
    css: '.mm-banner-base',
  };

  private readonly bitcoinAccountIcon = 'img[src="./images/bitcoin-logo.svg"]';

  protected readonly bridgeButton: string =
    '[data-testid="eth-overview-bridge"]';

  protected readonly buySellButton = { css: 'button', text: 'Buy' };

  private readonly closeSurveyToastBannerButton =
    '[data-testid="survey-toast-banner-base"] [aria-label="Close"] span';

  private readonly closeUseNetworkNotificationModalButton = {
    text: 'Got it',
    tag: 'h6',
  };

  private readonly connectionsRemovedModal =
    '[data-testid="connections-removed-modal"]';

  private readonly copyAddressButton = '[data-testid="app-header-copy-button"]';

  private readonly defaultAddressContainer =
    '[data-testid="default-address-container"]';

  protected readonly defiTab = {
    testId: 'account-overview__defi-tab',
  };

  private readonly emptyBalance =
    '[data-testid="coin-overview-balance-empty-state"]';

  private readonly fundYourWalletBanner = {
    text: 'Fund your wallet',
  };

  private readonly loadingOverlay = {
    text: 'Connecting to Localhost 8545',
  };

  protected readonly nftTab = {
    testId: 'account-overview__nfts-tab',
  };

  private readonly overviewBalanceSection = '.wallet-overview__balance';

  private readonly popoverBackground = '.popover-bg';

  private readonly portfolioLink = '[data-testid="portfolio-link"]';

  private readonly privacyBalanceToggle = {
    testId: 'account-value-and-suffix',
  };

  protected readonly receiveButton = { css: 'button', text: 'Receive' };

  private readonly revealSrpPasswordInput = '[data-testid="input-password"]';

  protected readonly sendButton = { css: 'button', text: 'Send' };

  private readonly shieldEntryModal = '[data-testid="shield-entry-modal"]';

  private readonly shieldEntryModalGetStarted =
    '[data-testid="shield-entry-modal-get-started-button"]';

  private readonly shieldEntryModalSkip =
    '[data-testid="shield-entry-modal-close-button"]';

  private readonly solanaAccountIcon = 'img[src="./images/solana-logo.svg"]';

  private readonly srpAddedToast = '[data-testid="new-srp-added-toast"]';

  private readonly srpAddedToastCloseButton =
    '.toast-container button[aria-label="Close"]';

  private readonly storageErrorToast = '[data-testid="storage-error-toast"]';

  private readonly storageErrorToastBackupButton = {
    text: 'Back up Secret Recovery Phrase',
    tag: 'span',
  };

  private readonly surveyToast = '[data-testid="survey-toast"]';

  protected readonly swapButton = { css: 'button', text: 'Swap' };

  protected readonly tokensTab = {
    testId: 'account-overview__asset-tab',
  };

  constructor(driver: Driver) {
    this.driver = driver;
    this.headerNavbar = new HeaderNavbar(driver);
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.activityTab,
        this.overviewBalanceSection,
        this.tokensTab,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for home page to be loaded', e);
      throw e;
    }
    console.log('Home page is loaded');
  }

  async waitForNetworkAndDOMReady(): Promise<void> {
    console.log(
      'Waiting for network idle, DOM loaded, page completed, and Redux state ready',
    );
    try {
      // Wait for DOM to be ready
      await this.driver.executeScript(`
        return new Promise((resolve) => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', () => resolve(), { once: true });
          }
        });
      `);

      // Wait for Redux state to be ready
      await this.driver.executeAsyncScript(`
        const callback = arguments[arguments.length - 1];
        const maxAttempts = 50;
        let attempts = 0;

        const checkReduxReady = () => {
          attempts++;

          if (window.stateHooks?.getCleanAppState) {
            try {
              const state = window.stateHooks.getCleanAppState();

              if (state && typeof state === 'object') {
                if (state.metamask && typeof state.metamask === 'object') {
                  console.log('Redux state is ready');
                  callback();
                  return;
                }
              }
            } catch (e) {
              console.log('Redux state not ready yet, attempt ' + attempts);
            }
          }

          if (attempts >= maxAttempts) {
            console.log('Redux state check timeout, continuing anyway');
            callback();
            return;
          }
          setTimeout(checkReduxReady, 100);
        };
        checkReduxReady();
      `);

      console.log(
        'Network idle, DOM loaded, page completed, and Redux state ready',
      );
    } catch (e) {
      console.log('Error waiting for network, DOM, and Redux ready', e);
    }
  }

  async waitForNonEvmAccountsLoaded(): Promise<void> {
    console.log('Waiting for Non EVM account icons to be visible');
    // See the removal TODO on `NON_EVM_ICON_TIMEOUT`. Still polled: returns
    // as soon as the icons render.
    await this.driver.waitForSelector(this.solanaAccountIcon, {
      timeout: NON_EVM_ICON_TIMEOUT,
    });
    await this.driver.waitForSelector(this.bitcoinAccountIcon, {
      timeout: NON_EVM_ICON_TIMEOUT,
    });
  }

  async checkPageIsNotLoaded(): Promise<void> {
    console.log('Check home page is not loaded');
    await this.driver.assertElementNotPresent(this.activityTab, {
      waitAtLeastGuard: 500,
    });
    await this.driver.assertElementNotPresent(this.tokensTab, {
      waitAtLeastGuard: 500,
    });
  }

  async clickBackupRemindMeLaterButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(
      this.backupRemindMeLaterButton,
    );
  }

  async closeSurveyToast(surveyName: string): Promise<void> {
    console.log(`Close survey toast for ${surveyName}`);
    await this.driver.waitForSelector({
      css: this.surveyToast,
      text: surveyName,
    });
    await this.driver.clickElement(this.closeSurveyToastBannerButton);
  }

  /**
   * Checks if the storage error toast is displayed.
   * This toast appears when storage.local.set() operations fail.
   */
  async checkStorageErrorToastIsDisplayed(): Promise<void> {
    console.log('Check storage error toast is displayed on homepage');
    await this.driver.waitForSelector(this.storageErrorToast);
  }

  /**
   * Clicks the "Back up Secret Recovery Phrase" button on the storage error toast
   * and verifies navigation to the reveal SRP page.
   */
  async clickStorageErrorToastBackupButton(): Promise<void> {
    console.log(
      'Click backup button on storage error toast to navigate to reveal SRP page',
    );
    await this.driver.clickElement(this.storageErrorToastBackupButton);
    await this.driver.waitForSelector(this.revealSrpPasswordInput);
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
  async checkAddNetworkMessageIsDisplayed(networkName: string): Promise<void> {
    console.log(
      `Check the toaster message for adding network ${networkName} is displayed on homepage`,
    );
    await this.driver.waitForSelector({
      tag: 'h6',
      text: `“${networkName}” was successfully added!`,
    });
  }

  async checkBackupReminderIsNotDisplayed(): Promise<void> {
    console.log('Check backup reminder is not displayed on homepage');
    await this.driver.assertElementNotPresent(
      this.backupSecretRecoveryPhraseNotification,
    );
  }

  /**
   * Checks that balance is displayed with ETH symbol.
   * We verify the element contains "ETH" rather than exact values since gas fees vary.
   */
  async checkBalanceIsDisplayed(): Promise<void> {
    console.log('Check balance element is displayed on homepage');
    await this.driver.waitForSelector({
      css: this.balance,
      text: 'ETH',
    });
    console.log('Balance is displayed in correct format');
  }

  async checkBasicFunctionalityOffWarnigMessageIsDisplayed(): Promise<void> {
    console.log(
      'Check if basic functionality off warning message is displayed on homepage',
    );
    await this.driver.waitForSelector(this.basicFunctionalityOffWarningMessage);
  }

  async checkDisabledButtonTooltip(tooltipText: string): Promise<void> {
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
  async checkEditNetworkMessageIsDisplayed(networkName: string): Promise<void> {
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
   * @param expectedBalanceOrOptions - Expected balance string, or an options object.
   * @param symbol - The symbol of the currency or token. Defaults to 'ETH'.
   * @param expectFundYourWalletBanner - When the balance is '0', whether to assert the
   * "Fund your wallet" banner (EVM behavior).
   * @param timeout - Max ms to wait for the balance; defaults to `driver.timeout` (10s unless the test overrides `Driver` construction).
   */
  async checkExpectedBalanceIsDisplayed(
    expectedBalanceOrOptions: string | CheckExpectedBalanceOptions = '25',
    symbol: string = 'ETH',
    expectFundYourWalletBanner: boolean = true,
    timeout: number = this.driver.timeout,
  ): Promise<void> {
    const {
      expectedBalance,
      symbol: resolvedSymbol,
      expectFundYourWalletBanner: resolvedExpectFundYourWalletBanner,
      timeout: resolvedTimeout,
    } = typeof expectedBalanceOrOptions === 'string'
      ? {
          expectedBalance: expectedBalanceOrOptions,
          symbol,
          expectFundYourWalletBanner,
          timeout,
        }
      : {
          expectedBalance: expectedBalanceOrOptions.expectedBalance ?? '25',
          symbol: expectedBalanceOrOptions.symbol ?? 'ETH',
          expectFundYourWalletBanner:
            expectedBalanceOrOptions.expectFundYourWalletBanner ?? true,
          timeout: expectedBalanceOrOptions.timeout ?? this.driver.timeout,
        };

    if (expectedBalance === '0' && resolvedExpectFundYourWalletBanner) {
      await this.driver.waitForSelector(this.fundYourWalletBanner, {
        timeout: resolvedTimeout,
      });
      return;
    }
    try {
      await this.driver.waitForSelector(
        { css: this.balance, text: expectedBalance },
        { timeout: resolvedTimeout },
      );
    } catch (e) {
      const balance = await this.driver.waitForSelector(this.balance, {
        timeout: resolvedTimeout,
      });
      const currentBalance = parseFloat(await balance.getText());
      const errorMessage = `Expected balance ${expectedBalance} ${resolvedSymbol}, got balance ${currentBalance} ${resolvedSymbol}`;
      console.log(errorMessage, e);
      throw e;
    }
    console.log(
      `Expected balance ${expectedBalance} ${resolvedSymbol} is displayed on homepage`,
    );
  }

  /**
   * Checks if the balance empty state is displayed on homepage.
   * Criteria:
   * - The account group has a zero balance across all aggregated mainnet networks.
   * - The account group is not on a test network
   * - The account group is not in a cached state
   * Not a replacement for checkExpectedBalanceIsDisplayed('0') this is still valid in certain cases.
   */
  async checkBalanceEmptyStateIsDisplayed(): Promise<void> {
    console.log('Check balance empty state is displayed on homepage');
    await this.driver.waitForSelector(this.emptyBalance);
  }

  /**
   * This function checks if account syncing has been successfully completed at least once.
   * Includes a delay before checking to give Firefox more time to initialize (reduces flakiness).
   */
  async checkHasAccountSyncingSyncedAtLeastOnce(): Promise<void> {
    console.log(
      `Waiting ${POST_UNLOCK_DELAY}ms before checking account sync state (Firefox timing fix)`,
    );
    await this.driver.delay(POST_UNLOCK_DELAY);
    console.log('Check if account syncing has synced at least once');
    await this.driver.waitUntil(
      async () => {
        const uiState = await getCleanAppState(this.driver);
        // Check for nullish, as the state we might seems to be `null` sometimes.
        return (
          uiState?.metamask?.hasAccountTreeSyncingSyncedAtLeastOnce === true
        );
      },
      {
        interval: BASE_ACCOUNT_SYNC_INTERVAL,
        timeout: BASE_ACCOUNT_SYNC_TIMEOUT, // Syncing can take some time so adding a longer timeout to reduce flakes
      },
    );
  }

  async checkSendButtonIsClickable(clickable: boolean = true): Promise<void> {
    console.log(`Check Send button is ${clickable ? 'enabled' : 'disabled'}`);
    await this.driver.waitForSelector(this.sendButton, {
      state: clickable ? 'enabled' : 'disabled',
    });
  }

  async checkSwapButtonIsClickable(clickable: boolean = true): Promise<void> {
    console.log(`Check Swap button is ${clickable ? 'enabled' : 'disabled'}`);
    await this.driver.waitForSelector(this.swapButton, {
      state: clickable ? 'enabled' : 'disabled',
    });
  }

  async checkLocalNodeBalanceIsDisplayed(
    localNode?: Anvil,
    address = null,
  ): Promise<void> {
    let expectedBalance: string;
    if (localNode) {
      const balance = await localNode.getBalance(address);
      expectedBalance = balance.toFixed(3);
      expectedBalance = Number(expectedBalance).toString();
    } else {
      expectedBalance = '25';
    }
    await this.checkExpectedBalanceIsDisplayed({
      expectedBalance,
      timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
    });
  }

  async checkNewSrpAddedToastIsDisplayed(srpNumber = 2): Promise<void> {
    await this.driver.waitForSelector({
      css: this.srpAddedToast,
      text: `Wallet ${srpNumber} imported`,
    });
  }

  async dismissSrpAddedToast(): Promise<void> {
    console.log('Dismiss SRP added toast');
    // The toast can take some time to appear
    await this.driver.clickElementSafe(this.srpAddedToastCloseButton, 15_000);
  }

  async checkNoSurveyToastIsDisplayed(): Promise<void> {
    console.log('Check no survey toast is displayed on homepage');
    await this.driver.assertElementNotPresent(this.surveyToast, {
      timeout: 5000,
    });
  }

  async checkPortfolioLinkIsDisplayed(): Promise<void> {
    console.log('Check if portfolio link is displayed on homepage');
    await this.driver.waitForSelector(this.portfolioLink);
  }

  /**
   * Check if the expected warning message is displayed on homepage.
   *
   * @param message - The message to be displayed.
   */
  async checkWarningMessageIsDisplayed(message: string): Promise<void> {
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

  async checkConnectionsRemovedModalIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.connectionsRemovedModal);
  }

  async checkDefaultAddressIsDisplayed(): Promise<void> {
    console.log('Check default address is displayed in header on homepage');
    await this.driver.waitForSelector(this.defaultAddressContainer);
  }

  async checkDefaultAddressIsNotDisplayed(): Promise<void> {
    console.log('Check default address is not displayed in header on homepage');
    await this.driver.assertElementNotPresent(this.defaultAddressContainer);
  }

  async checkShieldEntryModalIsDisplayed(): Promise<void> {
    console.log('Check shield entry modal is displayed on homepage');
    await this.driver.waitForSelector(this.shieldEntryModal);
  }

  async clickOnReceiveButton(): Promise<void> {
    await this.driver.waitForSelector(this.receiveButton);
    await this.driver.clickElement(this.receiveButton);
  }

  async clickOnSendButton(): Promise<void> {
    await this.driver.waitForSelector(this.sendButton);
    await this.driver.clickElement(this.sendButton);
  }

  async clickOnShieldEntryModalGetStarted(): Promise<void> {
    console.log('Click on shield entry modal get started');
    await this.driver.clickElement(this.shieldEntryModalGetStarted);
  }

  async clickOnShieldEntryModalSkip(): Promise<void> {
    console.log('Click on shield entry modal skip');
    await this.driver.clickElement(this.shieldEntryModalSkip);
  }

  async clickOnSwapButton(): Promise<void> {
    await this.driver.waitForSelector(this.swapButton);
    await this.driver.clickElement(this.swapButton);
  }

  async checkNoShieldEntryModalIsDisplayed(): Promise<void> {
    console.log('Check no shield entry modal is displayed on homepage');
    await this.driver.assertElementNotPresent(this.shieldEntryModal, {
      waitAtLeastGuard: regularDelayMs,
    });
  }

  async checkShieldEntryModalNotPresent(): Promise<void> {
    console.log('Check shield entry modal is not present on homepage');
    await this.driver.assertElementNotPresent(this.shieldEntryModal, {
      waitAtLeastGuard: regularDelayMs,
      timeout: 2000,
    });
  }
}

export default HomePage;
