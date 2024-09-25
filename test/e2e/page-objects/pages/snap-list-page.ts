import { Driver } from '../../webdriver/driver';

export default class SnapListPage {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async selectSnapByName(name: string): Promise<void> {
    await this.driver.clickElement({ text: name, tag: 'p' });
  }

  async toggleSnapStatus(): Promise<void> {
    await this.driver.clickElement('.toggle-button > div');
  }

  async removeSnap(): Promise<void> {
    const removeButton = await this.driver.findElement('[data-testid="remove-snap-button"]');
    await this.driver.scrollToElement(removeButton);
    await this.driver.clickElement('[data-testid="remove-snap-button"]');
  }

  async confirmRemoval(text: string): Promise<void> {
    await this.driver.clickElement({ text: 'Continue', tag: 'button' });
    await this.driver.fill('[data-testid="remove-snap-confirmation-input"]', text);
    await this.driver.clickElement({ text: 'Remove Snap', tag: 'button' });
  }

  async verifySnapRemovalMessage(message: string): Promise<void> {
    await this.driver.findVisibleElement({ text: message, tag: 'p' });
  }

  async verifyNoSnapsInstalled(): Promise<void> {
    await this.driver.findElement({ css: '.mm-box', text: "You don't have any snaps installed.", tag: 'p' });
  }
}
