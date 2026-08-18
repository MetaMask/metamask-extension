import { WebElement } from 'selenium-webdriver';
import { ACTIVITY_ROUTE } from '../../../../../ui/helpers/constants/routes';
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

// TODO: Remove this widened wait once #43958 completes the Solana discovery
// mocks; until then the unmocked discovery RPCs retry-storm the Solana icon
// past the default 10s wait.
const NON_EVM_ICON_TIMEOUT = 20_000;

/**
 * Wallet home / account overview: balance, primary CTAs, and tab navigation.
 *
 * Screen: `#/` (DEFAULT_ROUTE), after unlock / onboarding.
 * Owns: balance and empty-state checks, Send / Swap / Bridge / Receive,
 * navigating to Tokens / NFTs / DeFi / Activity tabs, home notifications,
 * shield entry modal, survey and SRP toasts, and page-ready waits.
 * Boundaries: tab content belongs to `TokensTab`, `NftsTab`, `DeFiTab`,
 * `ActivityTab`, and `PerpsTab`. The promotional carousel belongs to
 * `CarouselPage`. Non-EVM account-specific helpers live on `NonEvmHomepage`.
 * Related: `HeaderNavbar`, `TokensTab` / `NftsTab` / `DeFiTab` /
 * `ActivityTab` / `PerpsTab` / `CarouselPage` / `NonEvmHomepage`.
 *
 * @see ui/pages/home/home.tsx
 */
class HomePage {
  protected readonly activityTab = {
    testId: 'account-overview__activity-tab',
  };

  private readonly backupRemindMeLaterButton = {
    tag: 'button',
    text: 'Remind me later',
  };

  private readonly backupSecretRecoveryPhraseButton =
    '[data-testid="backup-srp-toast"] button';

  private readonly backupSecretRecoveryPhraseNotification =
    '[data-testid="backup-srp-toast"]';

  // Matches both the EVM (`eth-overview__primary-currency`) and non-EVM
  // (`coin-overview__primary-currency`) balance containers.
  protected readonly balance: string =
    '[data-testid$="overview__primary-currency"]';

  private readonly basicFunctionalityOffWarningMessage = {
    text: 'Basic functionality is off',
    css: '.mm-banner-base',
  };

  private readonly bitcoinAccountIcon = 'img[src="./images/bitcoin-logo.svg"]';

  private readonly bottomNavActivityButton =
    '[data-testid="bottom-nav-activity"]';

  private readonly bottomNavHomeButton = '[data-testid="bottom-nav-home"]';

  protected readonly bridgeButton: string =
    '[data-testid="eth-overview-bridge"]';

  protected readonly buySellButton = { css: 'button', text: 'Buy' };

  private readonly closeSurveyToastBannerButton =
    '.toast-container button[aria-label="Close"]';

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

  protected driver: Driver;

  private readonly emptyBalance =
    '[data-testid="coin-overview-balance-empty-state"]';

  private readonly fundYourWalletBanner = {
    text: 'Fund your wallet',
  };

  public headerNavbar: HeaderNavbar;

  private readonly loadingLogo = '.loading-logo';

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

  async checkNoErrorToastIsDisplayed(): Promise<void> {
    console.log('Check no blocking error toast is displayed on homepage');
    await this.driver.assertElementNotPresent(this.storageErrorToast, {
      waitAtLeastGuard: regularDelayMs,
      timeout: 5000,
    });
    await this.driver.assertElementNotPresent(this.surveyToast, {
      waitAtLeastGuard: regularDelayMs,
      timeout: 5000,
    });
    await this.driver.assertElementNotPresent(
      {
        css: '.toast-container',
        text: 'cryptocurrencies',
      },
      {
        waitAtLeastGuard: regularDelayMs,
        timeout: 5000,
      },
    );
    await this.driver.assertElementNotPresent(
      {
        css: '.toast-container',
        text: 'unsupported',
      },
      {
        waitAtLeastGuard: regularDelayMs,
        timeout: 5000,
      },
    );
  }

  async checkNoShieldEntryModalIsDisplayed(): Promise<void> {
    console.log('Check no shield entry modal is displayed on homepage');
    await this.driver.assertElementNotPresent(this.shieldEntryModal, {
      waitAtLeastGuard: regularDelayMs,
    });
  }

  async checkNoSurveyToastIsDisplayed(): Promise<void> {
    console.log('Check no survey toast is displayed on homepage');
    await this.driver.assertElementNotPresent(this.surveyToast, {
      timeout: 5000,
    });
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.overviewBalanceSection,
        this.tokensTab,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for home page to be loaded', e);
      throw e;
    }
    console.log('Home page is loaded');
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

  async checkPortfolioLinkIsDisplayed(): Promise<void> {
    console.log('Check if portfolio link is displayed on homepage');
    await this.driver.waitForSelector(this.portfolioLink);
  }

  async checkSendButtonIsClickable(clickable: boolean = true): Promise<void> {
    console.log(`Check Send button is ${clickable ? 'enabled' : 'disabled'}`);
    await this.driver.waitForSelector(this.sendButton, {
      state: clickable ? 'enabled' : 'disabled',
    });
  }

  async checkShieldEntryModalIsDisplayed(): Promise<void> {
    console.log('Check shield entry modal is displayed on homepage');
    await this.driver.waitForSelector(this.shieldEntryModal);
  }

  async checkShieldEntryModalNotPresent(): Promise<void> {
    console.log('Check shield entry modal is not present on homepage');
    await this.driver.assertElementNotPresent(this.shieldEntryModal, {
      waitAtLeastGuard: regularDelayMs,
      timeout: 2000,
    });
  }

  /**
   * Checks if the storage error toast is displayed.
   * This toast appears when storage.local.set() operations fail.
   */
  async checkStorageErrorToastIsDisplayed(): Promise<void> {
    console.log('Check storage error toast is displayed on homepage');
    await this.driver.waitForSelector(this.storageErrorToast);
  }

  async checkSwapButtonIsClickable(clickable: boolean = true): Promise<void> {
    console.log(`Check Swap button is ${clickable ? 'enabled' : 'disabled'}`);
    await this.driver.waitForSelector(this.swapButton, {
      state: clickable ? 'enabled' : 'disabled',
    });
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

  async clickBackupRemindMeLaterButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(
      this.backupRemindMeLaterButton,
    );
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

  async dismissSrpAddedToast(): Promise<void> {
    console.log('Dismiss SRP added toast');
    // The toast can take some time to appear
    await this.driver.clickElementSafe(this.srpAddedToastCloseButton, 15_000);
  }

  /**
   * Ensures the home page is rendered and idle (loaded + loading overlay gone).
   */
  async ensurePageIsReady(): Promise<void> {
    await this.checkPageIsLoaded();
    await this.waitForLoadingOverlayToDisappear();
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

  async goToActivityList(): Promise<void> {
    console.log(`Open activity tab on homepage`);
    const isBottomNav = await this.driver.isElementPresentAndVisible(
      this.bottomNavActivityButton,
      3000,
    );
    if (isBottomNav) {
      await this.driver.clickElement(this.bottomNavActivityButton);
      await this.driver.waitForUrl({
        url: `${this.driver.extensionUrl}/home.html#${ACTIVITY_ROUTE}`,
      });
    } else {
      await this.checkPageIsLoaded();
      await this.driver.clickElement(this.activityTab);
    }
  }

  async goToBackupSRPPage(): Promise<void> {
    console.log(`Go to backup secret recovery phrase on homepage`);
    await this.driver.waitForSelector(
      this.backupSecretRecoveryPhraseNotification,
    );
    await this.driver.clickElement(this.backupSecretRecoveryPhraseButton);
  }

  async goToDeFiTab(): Promise<void> {
    console.log(`Go to DeFi tab on homepage`);
    await this.driver.clickElement(this.defiTab);
  }

  async goToHomePage(): Promise<void> {
    console.log('Go to home page');
    const alreadyOnHome = await this.driver.isElementPresentAndVisible(
      this.balance,
      1000,
    );
    if (alreadyOnHome) {
      return;
    }
    const isBottomNav = await this.driver.isElementPresentAndVisible(
      this.bottomNavHomeButton,
      1000,
    );
    if (isBottomNav) {
      await this.driver.clickElement(this.bottomNavHomeButton);
      await this.checkPageIsLoaded();
    }
  }

  async goToNftTab(): Promise<void> {
    console.log(`Go to NFT tab on homepage`);
    const isBottomNav = await this.driver.isElementPresentAndVisible(
      this.bottomNavHomeButton,
      3000,
    );
    if (isBottomNav) {
      await this.driver.clickElement(this.bottomNavHomeButton);
      await this.checkPageIsLoaded();
    }
    await this.driver.clickElement(this.nftTab);
  }

  async goToTokensTab(): Promise<void> {
    console.log(`Go to tokens tab on homepage`);
    // With the bottom nav bar, activity is its own route instead of a home
    // tab, so the tab strip is absent and we have to return home first.
    const currentUrl = await this.driver.getCurrentUrl();
    if (currentUrl.includes(`#${ACTIVITY_ROUTE}`)) {
      await this.driver.clickElement(this.bottomNavHomeButton);
    }
    await this.driver.clickElement(this.tokensTab);
  }

  async openPortfolioPage(): Promise<void> {
    console.log(`Open portfolio page on homepage`);
    await this.driver.clickElement(this.portfolioLink);
  }

  async startBridgeFlow(): Promise<void> {
    await this.driver.clickElement(this.bridgeButton);
  }

  async startSendFlow(): Promise<void> {
    await this.driver.clickElement(this.sendButton);
  }

  async startSwapFlow(): Promise<void> {
    await this.driver.clickElement(this.swapButton);
  }

  async togglePrivacyBalance(): Promise<void> {
    await this.driver.clickElement(this.privacyBalanceToggle);
  }

  async waitForLoadingLogoToDisappear(): Promise<void> {
    console.log('Wait for loading logo to disappear');
    await this.driver.assertElementNotPresent(this.loadingLogo, {
      timeout: 10000,
    });
  }

  async waitForLoadingOverlayToDisappear(): Promise<void> {
    console.log(`Wait for loading overlay to disappear`);
    await this.driver.assertElementNotPresent(this.loadingOverlay, {
      waitAtLeastGuard: 1000,
      timeout: 10000,
    });
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
}

export default HomePage;
