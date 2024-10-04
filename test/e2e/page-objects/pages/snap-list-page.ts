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

  private readonly snapListItem = '.snap-list-item';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async removeSnapByName(snapName: string): Promise<void> {
    console.log('Removing snap on snap list page with name: ', snapName);
    await this.driver.clickElement({ text: snapName, css: this.snapListItem });

    const removeButton = await this.driver.findElement(this.removeSnapButton);
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
