import { Driver } from '../../../../webdriver/driver';

/**
 * Account watcher Snap: watch an Ethereum address (watch-only account).
 *
 * Screen: `#/snaps/view/:snapId` for the account watcher Snap, reached from
 * `ChooseWalletTypePage.clickWatchEthereumAccount`. Not mapped in the route
 * registry, because every Snap shares that route.
 * Owns: the address input, the watch account button and the error messages
 * rendered by the Snap.
 * Boundaries: the watch form only. On success the app returns home with the
 * watched account selected, which belongs to `HomePage`.
 * Related: `ChooseWalletTypePage`, `HomePage`.
 *
 * @see ui/pages/multichain-accounts/choose-new-wallet-type/choose-new-wallet-type-page.tsx
 */
class WatchAccountPage {
  private readonly addressInput = 'input#address-input[type="text"]';

  private readonly driver: Driver;

  private readonly errorMessage = (message: string) => ({
    css: '.snap-ui-renderer__text',
    text: message,
  });

  private readonly title = {
    text: 'Watch any Ethereum account',
    tag: 'h4',
  };

  private readonly watchAccountButton = {
    text: 'Watch account',
    tag: 'button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.title,
        this.addressInput,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for watch account page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Watch account page is loaded');
  }

  /**
   * Watch an EOA (externally owned account).
   *
   * @param address - The address to watch.
   * @param expectedErrorMessage - Expected error message if the address is
   * invalid. The page stays open when watching fails.
   */
  async watchAccount(
    address: string,
    expectedErrorMessage?: string,
  ): Promise<void> {
    console.log(`Watch EOA account with address ${address}`);
    await this.driver.fill(this.addressInput, address);
    if (expectedErrorMessage) {
      await this.driver.clickElement(this.watchAccountButton);
      console.log(
        `Check if error message is displayed: ${expectedErrorMessage}`,
      );
      await this.driver.waitForSelector(
        this.errorMessage(expectedErrorMessage),
      );
    } else {
      await this.driver.clickElementAndWaitToDisappear(this.watchAccountButton);
    }
  }
}

export default WatchAccountPage;
