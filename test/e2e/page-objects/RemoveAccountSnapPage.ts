import { Driver } from '../webdriver/driver';

export class RemoveAccountSnapPage {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickAccountMenuIcon(): Promise<void> {
    await this.driver.clickElement('[data-testid="account-menu-icon"]');
  }

  async getAccountMenuItems(): Promise<any[]> {
    return await this.driver.findElements('.multichain-account-list-item');
  }

  async closeAccountMenu(): Promise<void> {
    await this.driver.clickElement('.mm-box button[aria-label="Close"]');
  }

  async clickAccountOptionsMenu(): Promise<void> {
    await this.driver.clickElement('[data-testid="account-options-menu-button"]');
  }

  async navigateToSnaps(): Promise<void> {
    await this.driver.clickElement({ text: 'Snaps', tag: 'div' });
  }

  async selectSimpleSnapKeyring(): Promise<void> {
    await this.driver.clickElement({
      text: 'MetaMask Simple Snap Keyring',
      tag: 'p',
    });
  }

  async disableSnap(): Promise<void> {
    await this.driver.clickElement('.toggle-button > div');
  }

  async removeSnap(): Promise<void> {
    const removeButton = await this.driver.findElement(
      '[data-testid="remove-snap-button"]'
    );
    await this.driver.scrollToElement(removeButton);
    await this.driver.clickElement('[data-testid="remove-snap-button"]');
  }

  async confirmRemoval(): Promise<void> {
    await this.driver.clickElement({
      text: 'Continue',
      tag: 'button',
    });
  }

  async fillRemovalConfirmation(text: string): Promise<void> {
    await this.driver.fill(
      '[data-testid="remove-snap-confirmation-input"]',
      text
    );
  }

  async clickRemoveSnapButton(): Promise<void> {
    await this.driver.clickElement({
      text: 'Remove Snap',
      tag: 'button',
    });
  }

  async verifyRemovalMessage(): Promise<void> {
    await this.driver.findVisibleElement({
      text: 'MetaMask Simple Snap Keyring removed',
      tag: 'p',
    });
  }

  async verifyNoSnapsInstalled(): Promise<void> {
    await this.driver.findElement({
      css: '.mm-box',
      text: "You don't have any snaps installed.",
      tag: 'p',
    });
  }
}
