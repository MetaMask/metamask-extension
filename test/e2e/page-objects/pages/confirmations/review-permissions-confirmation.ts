import { Driver } from '../../../webdriver/driver';

/**
 * Review permissions page for connected-site network/account permissions.
 *
 * Screen: permissions review UI reached from a connected site (not a
 * `#/confirmation` redesign route).
 * Owns: "Review permissions" title, enabled-networks messaging, network
 * presence checks, connect-more-chains, and page-container confirm/cancel.
 * Boundaries: initial dapp connect is `ConnectAccountConfirmation`. Editing
 * the chain set after "connect more chains" moves into the edit-networks
 * page/modal.
 * Related: `ConnectAccountConfirmation`.
 *
 * @see ui/components/multichain-accounts/permissions/permission-review-page/multichain-review-permissions-page.tsx
 * @see ui/components/multichain-accounts/permissions/multichain-edit-networks-page/multichain-edit-networks-page.tsx
 */
class ReviewPermissionsConfirmation {
  private readonly cancelReviewPermissionsButton =
    '[data-testid="page-container-footer-cancel"]';

  private readonly confirmReviewPermissionsButton =
    '[data-testid="page-container-footer-next"]';

  private readonly connectMoreChainsButton =
    '[data-testid="connect-more-chains-button"]';

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

  async confirmReviewPermissions(): Promise<void> {
    console.log('Confirm review permissions');
    await this.driver.clickElementAndWaitForWindowToClose(
      this.confirmReviewPermissionsButton,
    );
  }
}

export default ReviewPermissionsConfirmation;
