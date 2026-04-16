import { Driver } from '../../webdriver/driver';

class SnapListPage {
  private readonly driver: Driver;

  private readonly backButton = 'button[aria-label="Back"]';

  private readonly closeModalButton = 'button[aria-label="Close"]';

  private readonly continueRemoveSnapButton = {
    tag: 'button',
    text: 'Continue',
  };

  private readonly continueRemoveSnapModalMessage = {
    tag: 'p',
    text: 'Removing this Snap removes these accounts from MetaMask',
  };

  private readonly descriptionWebpack = {
    text: 'Description from Webpack Plugin Example Snap',
    tag: 'p',
  };

  private readonly homePageSnap = {
    text: 'Home Page Example Snap',
    tag: 'p',
  };

  private readonly homePageTitle = {
    text: 'Welcome to my Snap home page!',
    tag: 'p',
  };

  private readonly noSnapInstalledMessage = {
    tag: 'p',
    text: "You don't have any snaps installed.",
  };

  private readonly noSnapsInstalledContainer = '.mm-box';

  private readonly popoverRemoveSnapButton = '#popoverRemoveSnapButton';

  private readonly removeSnapButton = '[data-testid="remove-snap-button"]';

  private readonly removeSnapConfirmationInput =
    '[data-testid="remove-snap-confirmation-input"]';

  private readonly removeSnapConfirmButton = {
    tag: 'button',
    text: 'Remove Snap',
  };

  private readonly revokePermissionOption = {
    text: 'Revoke permission',
    tag: 'p',
  };

  private readonly snapEnabledToggle = '.toggle-button > div';

  // this selector needs to be combined with snap name to be unique.
  private readonly snapListItem = '.snap-list-item';

  private readonly updateSnapButton = {
    css: '.mm-button-link',
    text: 'Update',
    tag: 'button',
  };

  private readonly webpackPluginSnap = {
    text: 'Webpack Plugin Example Snap',
    tag: 'p',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkHomePageTitle(): Promise<void> {
    console.log('Checking title of snap list page');
    await this.driver.waitForSelector(this.homePageTitle);
  }

  async checkNoSnapInstalledMessageIsDisplayed(): Promise<void> {
    console.log('Verifying no snaps is installed for current account');
    await this.driver.waitForSelector(this.noSnapInstalledMessage);
  }

  async checkNoSnapsInstalledMessage(): Promise<void> {
    console.log('Checking no snaps installed message');
    await this.driver.waitForSelector({
      css: this.noSnapsInstalledContainer,
      text: "You don't have any snaps installed.",
      tag: 'p',
    });
  }

  async checkUpdateLinkIsNotDisplayed(): Promise<void> {
    await this.driver.assertElementNotPresent(this.updateSnapButton, {
      // make sure the Snap page has loaded
      findElementGuard: this.descriptionWebpack,
    });
  }

  async clickBackButton(): Promise<void> {
    console.log('Clicking back button');
    await this.driver.clickElement(this.backButton);
  }

  async clickHomePageSnap(): Promise<void> {
    console.log('Clicking default snap');
    await this.driver.waitForSelector(this.homePageSnap);
    await this.driver.clickElement(this.homePageSnap);
  }

  async clickPermissionOptionsMenu(permissionTestId: string): Promise<void> {
    console.log(`Clicking permission options menu: ${permissionTestId}`);
    await this.driver.clickElement(`[data-testid="${permissionTestId}"]`);
  }

  async clickRevokePermission(): Promise<void> {
    console.log('Clicking Revoke permission');
    await this.driver.clickElement(this.revokePermissionOption);
  }

  async clickUpdateSnapButton(): Promise<void> {
    console.log('Clicking update snap button');
    await this.driver.clickElement(this.updateSnapButton);
  }

  async clickWebpackPluginSnap(): Promise<void> {
    console.log('Clicking webpack plugin snap');
    await this.driver.clickElement(this.webpackPluginSnap);
  }

  async openSnapByName(snapName: string): Promise<void> {
    console.log(`Opening snap: ${snapName}`);
    await this.driver.waitForSelector({ text: snapName, tag: 'p' });
    await this.driver.clickElement({ text: snapName, tag: 'p' });
  }

  /**
   * Removes a snap by its name from the snap list.
   *
   * @param snapName - The name of the snap to be removed.
   */
  async removeSnapByName(snapName: string): Promise<void> {
    console.log('Removing snap on snap list page with name: ', snapName);
    await this.driver.clickElement({ text: snapName, css: this.snapListItem });

    const removeButton = await this.driver.findElement(this.removeSnapButton);
    // The need to scroll to the element before clicking it is due to a bug in the Snap test dapp page.
    // This bug has been fixed in the Snap test dapp page (PR here: https://github.com/MetaMask/snaps/pull/2782), which should mitigate the flaky issue of scrolling and clicking elements in the Snap test dapp.
    // TODO: Once the Snaps team releases the new version with the fix, we'll be able to remove these scrolling steps and just use clickElement (which already handles scrolling).
    await this.driver.scrollToElement(removeButton);
    await this.driver.clickElement(this.removeSnapButton);

    await this.driver.waitForSelector(this.continueRemoveSnapModalMessage);
    await this.driver.clickElement(this.continueRemoveSnapButton);

    console.log(`Fill confirmation input to confirm snap removal`);
    await this.driver.waitForSelector(this.removeSnapConfirmationInput);
    await this.driver.fill(this.removeSnapConfirmationInput, snapName);
    await this.driver.clickElementAndWaitToDisappear(
      this.removeSnapConfirmButton,
    );

    console.log(`Check snap removal success message is displayed`);
    await this.driver.waitForSelector({
      text: `${snapName} removed`,
      tag: 'p',
    });
    await this.driver.clickElementAndWaitToDisappear(this.closeModalButton);
  }

  async removeSnapViaPopover(snapName: string): Promise<void> {
    console.log('Removing snap via popover');
    await this.driver.clickElement({
      text: `Remove ${snapName}`,
      tag: 'p',
    });
    await this.driver.clickElement(this.popoverRemoveSnapButton);
  }

  async toggleSnapEnabled(): Promise<void> {
    console.log('Toggling snap enabled');
    await this.driver.clickElement(this.snapEnabledToggle);
  }
}

export default SnapListPage;
