import { WebDriver, By } from 'selenium-webdriver';

export class AccountOptionsMenu {
  private readonly driver: WebDriver;

  constructor(driver: WebDriver) {
    this.driver = driver;
  }

  async clickAccountOptionsMenuButton(): Promise<void> {
    await this.driver.findElement(By.css('[data-testid="account-options-menu-button"]')).click();
  }

  async findLockButton() {
    return await this.driver.findElement(By.css('[data-testid="global-menu-lock"]'));
  }
}
