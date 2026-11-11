import { Driver } from '../../../../webdriver/driver';

/**
 * Add wallet menu: choose how to add a new wallet or account.
 *
 * Screen: `#/choose-new-wallet-type`, reached from
 * `AccountListPage.clickAddWalletButton`.
 * Owns: the wallet type options (import wallet, import account, hardware
 * wallet, snap account, watch account) and the back button.
 * Boundaries: the menu only. Each option opens its own screen:
 * `ImportSrpPage`, `ImportAccountPage`, `ConnectHardwareWalletPage` or
 * `WatchAccountPage`.
 * Related: `AccountListPage`, `ImportSrpPage`, `ImportAccountPage`,
 * `ConnectHardwareWalletPage`, `WatchAccountPage`.
 *
 * @see ui/pages/multichain-accounts/choose-new-wallet-type/choose-new-wallet-type-page.tsx
 */
class ChooseWalletTypePage {
  private readonly backButton = '[data-testid="back-button"]';

  private readonly chooseWalletTypePage = '.choose-new-wallet-type-page';

  private readonly connectHardwareWalletButton =
    '[data-testid="choose-wallet-type-hardware-wallet"]';

  private readonly driver: Driver;

  private readonly importAccountButton =
    '[data-testid="choose-wallet-type-import-account"]';

  private readonly importWalletButton =
    '[data-testid="choose-wallet-type-import-wallet"]';

  private readonly snapAccountButton =
    '[data-testid="choose-wallet-type-snap-account"]';

  private readonly watchEthereumAccountButton =
    '[data-testid="choose-wallet-type-watch-ethereum-account"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.chooseWalletTypePage,
        this.importWalletButton,
        this.importAccountButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for choose wallet type page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Choose wallet type page is loaded');
  }

  /**
   * Checks whether the add snap account option is displayed.
   *
   * @param shouldDisplay - Whether the option is expected to be displayed.
   */
  async checkSnapAccountOptionIsDisplayed(
    shouldDisplay: boolean = true,
  ): Promise<void> {
    console.log(
      `Check add snap account option is ${shouldDisplay ? '' : 'not '}displayed`,
    );
    if (shouldDisplay) {
      await this.driver.waitForSelector(this.snapAccountButton);
    } else {
      await this.driver.assertElementNotPresent(this.snapAccountButton);
    }
  }

  /**
   * Checks whether the watch Ethereum account option is displayed.
   *
   * @param shouldDisplay - Whether the option is expected to be displayed.
   */
  async checkWatchAccountOptionIsDisplayed(
    shouldDisplay: boolean = true,
  ): Promise<void> {
    console.log(
      `Check watch Ethereum account option is ${shouldDisplay ? '' : 'not '}displayed`,
    );
    if (shouldDisplay) {
      await this.driver.waitForSelector(this.watchEthereumAccountButton);
    } else {
      await this.driver.assertElementNotPresent(
        this.watchEthereumAccountButton,
      );
    }
  }

  async clickConnectHardwareWallet(): Promise<void> {
    console.log('Click connect a hardware wallet option');
    await this.driver.clickElement(this.connectHardwareWalletButton);
  }

  async clickImportAccount(): Promise<void> {
    console.log('Click import an account option');
    await this.driver.clickElement(this.importAccountButton);
  }

  async clickImportWallet(): Promise<void> {
    console.log('Click import a wallet option');
    await this.driver.clickElement(this.importWalletButton);
  }

  async clickWatchEthereumAccount(): Promise<void> {
    console.log('Click watch Ethereum account option');
    await this.driver.clickElement(this.watchEthereumAccountButton);
  }

  async goBack(): Promise<void> {
    console.log('Navigate back from choose wallet type page');
    await this.driver.clickElementAndWaitToDisappear(this.backButton);
  }
}

export default ChooseWalletTypePage;
