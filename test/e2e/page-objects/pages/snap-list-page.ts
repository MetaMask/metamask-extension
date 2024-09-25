import { Driver } from '../../webdriver/driver';

export default class SnapListPage {
  private driver: Driver;

  private snapListContainer: string;
  private snapItem: string;
  private snapToggle: string;
  private snapName: string;
  private noSnapsMessage: string;
  private toggleButton: string;
  private removeSnapButton: string;
  private continueButton: { text: string; tag: string };
  private removeSnapConfirmationInput: string;
  private removeSnapConfirmButton: { text: string; tag: string };
  private noSnapsInstalledMessage: { css: string; text: string; tag: string };

  constructor(driver: Driver) {
    this.driver = driver;
    this.snapListContainer = '.snap-list-container';
    this.snapItem = '.snap-item';
    this.snapToggle = '.snap-toggle';
    this.snapName = '.snap-name';
    this.noSnapsMessage = '.no-snaps-message';
    this.toggleButton = '.toggle-button > div';
    this.removeSnapButton = '[data-testid="remove-snap-button"]';
    this.continueButton = { text: 'Continue', tag: 'button' };
    this.removeSnapConfirmationInput = '[data-testid="remove-snap-confirmation-input"]';
    this.removeSnapConfirmButton = { text: 'Remove Snap', tag: 'button' };
    this.noSnapsInstalledMessage = { css: '.mm-box', text: "You don't have any snaps installed.", tag: 'p' };
  }

  async getSnapList(): Promise<any[]> {
    return await this.driver.findElements(this.snapItem);
  }

  async toggleSnap(snapName: string): Promise<void> {
    const snapItems = await this.getSnapList();
    for (const item of snapItems) {
      const name = await item.findElement(this.snapName).getText();
      if (name === snapName) {
        await item.findElement(this.snapToggle).click();
        break;
      }
    }
  }

  async isSnapEnabled(snapName: string): Promise<boolean> {
    const snapItems = await this.getSnapList();
    for (const item of snapItems) {
      const name = await item.findElement(this.snapName).getText();
      if (name === snapName) {
        const toggleClass = await item.findElement(this.snapToggle).getAttribute('class');
        return toggleClass.includes('enabled');
      }
    }
    return false;
  }

  async verifyNoSnapsMessage(): Promise<void> {
    await this.driver.waitForSelector(this.noSnapsMessage);
  }

  async selectSnapByName(name: string): Promise<void> {
    await this.driver.clickElement({ text: name, tag: 'p' });
  }

  async toggleSnapStatus(): Promise<void> {
    await this.driver.clickElement(this.toggleButton);
  }

  async removeSnap(): Promise<void> {
    const removeButton = await this.driver.findElement(this.removeSnapButton);
    await this.driver.scrollToElement(removeButton);
    await this.driver.clickElement(this.removeSnapButton);
  }

  async confirmRemoval(text: string): Promise<void> {
    await this.driver.clickElement(this.continueButton);
    await this.driver.fill(this.removeSnapConfirmationInput, text);
    await this.driver.clickElement(this.removeSnapConfirmButton);
  }

  async verifySnapRemovalMessage(message: string): Promise<void> {
    await this.driver.findVisibleElement({ text: message, tag: 'p' });
  }

  async verifyNoSnapsInstalled(): Promise<void> {
    await this.driver.findElement(this.noSnapsInstalledMessage);
  }
}
