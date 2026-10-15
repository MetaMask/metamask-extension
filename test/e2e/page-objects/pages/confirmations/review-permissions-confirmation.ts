import { Driver } from '../../../webdriver/driver';

/**
 * Review permissions dialog for dapp-initiated permission requests (e.g. a
 * `wallet_switchEthereumChain` request for a chain the dapp is not yet
 * permitted to use).
 *
 * Screen: "Review permissions" confirmation dialog.
 * Owns: "Review permissions" title, enabled-networks messaging, network
 * presence checks, and page-container confirm/cancel.
 * Boundaries: initial dapp connect is `ConnectAccountConfirmation`.
 * Related: `ConnectAccountConfirmation`.
 */
class ReviewPermissionsConfirmation {
  private readonly cancelReviewPermissionsButton =
    '[data-testid="page-container-footer-cancel"]';

  private readonly confirmReviewPermissionsButton =
    '[data-testid="page-container-footer-next"]';

  driver: Driver;

  private readonly reviewPermissionsConfirmationTitle = {
    text: 'Review permissions',
    tag: 'h3',
  };

  private readonly useEnabledNetworksMessage = {
    text: 'Use your enabled networks',
    tag: 'p',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkNetworkIsDisplayed(networkName: string): Promise<void> {
    console.log(
      `Check network ${networkName} is displayed on review permissions confirmation page`,
    );
    await this.driver.waitForSelector({
      text: networkName,
      tag: 'p',
    });
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(
        this.reviewPermissionsConfirmationTitle,
      );
    } catch (e) {
      console.log(
        'Timeout while waiting for Review permissions confirmation page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Review permissions confirmation page is loaded');
  }

  async checkUseEnabledNetworksMessageIsDisplayed(): Promise<void> {
    console.log('Check use enabled networks message is displayed');
    await this.driver.waitForSelector(this.useEnabledNetworksMessage);
  }

  async clickCancelReviewPermissionsButton(): Promise<void> {
    console.log('Click cancel review permissions button');
    await this.driver.clickElement(this.cancelReviewPermissionsButton);
  }

  async clickConfirmReviewPermissionsButton(): Promise<void> {
    console.log('Click confirm review permissions button');
    await this.driver.clickElement(this.confirmReviewPermissionsButton);
  }

  async clickConfirmReviewPermissionsButtonWithWaitForWindowToClose(): Promise<void> {
    console.log('Click confirm review permissions button');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmReviewPermissionsButton,
    );
  }

  async confirmReviewPermissions(): Promise<void> {
    console.log('Confirm review permissions');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmReviewPermissionsButton,
    );
  }
}

export default ReviewPermissionsConfirmation;
