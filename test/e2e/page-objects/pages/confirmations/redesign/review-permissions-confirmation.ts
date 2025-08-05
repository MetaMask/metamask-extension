import { Driver } from '../../../../webdriver/driver';

class ReviewPermissionsConfirmation {
  driver: Driver;

  private readonly cancelReviewPermissionsButton =
    '[data-testid="page-container-footer-cancel"]';

  private readonly confirmReviewPermissionsButton =
    '[data-testid="page-container-footer-next"]';

  private readonly connectMoreChainsButton =
    '[data-testid="connect-more-chains-button"]';

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

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
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

  async clickCancelReviewPermissionsButton(): Promise<void> {
    console.log('Click cancel review permissions button');
    await this.driver.clickElement(this.cancelReviewPermissionsButton);
  }

  async clickConfirmReviewPermissionsButton(): Promise<void> {
    console.log('Click confirm review permissions button');
    await this.driver.clickElement(this.confirmReviewPermissionsButton);
  }

  async confirmReviewPermissions(): Promise<void> {
    console.log('Confirm review permissions');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmReviewPermissionsButton,
    );
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_networkIsDisplayed(networkName: string): Promise<void> {
    console.log(
      `Check network ${networkName} is displayed on review permissions confirmation page`,
    );
    await this.driver.waitForSelector({
      text: networkName,
      tag: 'p',
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_useEnabledNetworksMessageIsDisplayed(): Promise<void> {
    console.log('Check use enabled networks message is displayed');
    await this.driver.waitForSelector(this.useEnabledNetworksMessage);
  }

  async clickConnectMoreChainsButton(): Promise<void> {
    console.log('Click connect more chains button');
    await this.driver.clickElement(this.connectMoreChainsButton);
  }

  async clickDisconnectNetwork(networkName: string): Promise<void> {
    console.log(`Click to disconnect network: ${networkName}`);
    await this.driver.clickElement({
      text: networkName,
      tag: 'p',
    });
  }
}

export default ReviewPermissionsConfirmation;
