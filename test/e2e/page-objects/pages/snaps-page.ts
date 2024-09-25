import { Driver } from '../../webdriver/driver';

export default class SnapsPage {
  private driver: Driver;

  private toggleButton: string;
  private removeSnapButton: string;
  private continueButton: { text: string; tag: string };
  private removeSnapConfirmationInput: string;
  private removeSnapConfirmButton: { text: string; tag: string };
  private noSnapsInstalledMessage: { css: string; text: string; tag: string };

  constructor(driver: Driver) {
    this.driver = driver;
    this.toggleButton = '.toggle-button > div';
    this.removeSnapButton = '[data-testid="remove-snap-button"]';
    this.continueButton = { text: 'Continue', tag: 'button' };
    this.removeSnapConfirmationInput = '[data-testid="remove-snap-confirmation-input"]';
    this.removeSnapConfirmButton = { text: 'Remove Snap', tag: 'button' };
    this.noSnapsInstalledMessage = { css: '.mm-box', text: "You don't have any snaps installed.", tag: 'p' };
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
