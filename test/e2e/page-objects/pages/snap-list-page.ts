import { Driver } from '../../webdriver/driver';

class SnapListPage {
  private readonly driver: Driver;

  private readonly closeModalButton = 'button[aria-label="Close"]';

  private readonly continueRemoveSnapButton = {
    tag: 'button',
    text: 'Continue',
  };

  private readonly continueRemoveSnapModalMessage = {
    tag: 'p',
    text: 'Removing this Snap removes these accounts from MetaMask',
  };

  private readonly noSnapInstalledMessage = {
    tag: 'p',
    text: "You don't have any snaps installed.",
  };

  private readonly removeSnapButton = '[data-testid="remove-snap-button"]';

  private readonly removeSnapConfirmationInput =
    '[data-testid="remove-snap-confirmation-input"]';

  private readonly removeSnapConfirmButton = {
    tag: 'button',
    text: 'Remove Snap',
  };

  // this selector needs to be combined with snap name to be unique.
  private readonly snapListItem = '.snap-list-item';

  constructor(driver: Driver) {
    this.driver = driver;
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

  async check_noSnapInstalledMessageIsDisplayed(): Promise<void> {
    console.log('Verifying no snaps is installed for current account');
    await this.driver.waitForSelector(this.noSnapInstalledMessage);
  }
}

export default SnapListPage;
