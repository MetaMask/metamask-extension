import { Driver } from '../../webdriver/driver';
import { strict as assert } from 'assert';

class AccountCustomNamePage {
  private readonly driver: Driver;

  // Locators
  private readonly accountOptionsMenuButton: string = '[data-testid="account-options-menu-button"]';
  private readonly accountDetailsButton: string = '[data-testid="account-list-menu-details"]';
  private readonly editableLabelButton: string = '[data-testid="editable-label-button"]';
  private readonly accountNameInput: string = 'input[placeholder="Account name"]';
  private readonly saveAccountLabelButton: string = '[data-testid="save-account-label-input"]';
  private readonly closeButton: string = 'button[aria-label="Close"]';
  private readonly accountMenuIcon: string = '[data-testid="account-menu-icon"]';
  private readonly newAccountButton: string = '[data-testid="multichain-account-menu-popover-action-button"]';
  private readonly addAccountButton: string = '[data-testid="multichain-account-menu-popover-add-account"]';
  private readonly newAccountNameInput: string = '[placeholder="Account 2"]';
  private readonly addAccountConfirmButton: string = 'button';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    console.log('Checking if Account Custom Name page is loaded');
    try {
      const selectors = [
        this.accountOptionsMenuButton,
        this.accountMenuIcon,
        this.newAccountButton,
        this.addAccountButton,
      ];

      await this.driver.waitForMultipleSelectors(selectors);

      // Additional checks for interactivity and visibility
      for (const selector of selectors) {
        const element = await this.driver.findElement(selector);
        const isVisible = await element.isDisplayed();
        const isEnabled = await element.isEnabled();
        if (!isVisible || !isEnabled) {
          throw new Error(`Element ${selector} is not visible or not interactive`);
        }
      }

      console.log('Account Custom Name page is loaded successfully');
    } catch (error) {
      console.error('Failed to load Account Custom Name page', error);
      throw new Error(`Account Custom Name page failed to load: ${(error as Error).message}`);
    }
  }

  async changeAccountLabel(newLabel: string): Promise<void> {
    console.log(`Changing account label to: ${newLabel}`);
    try {
      await this.driver.clickElement(this.accountOptionsMenuButton);
      await this.driver.clickElement(this.accountDetailsButton);
      await this.driver.clickElement(this.editableLabelButton);
      await this.driver.fill(this.accountNameInput, newLabel);
      await this.driver.clickElement(this.saveAccountLabelButton);
      await this.driver.clickElement(this.closeButton);

      // Verify the label change
      await this.verifyAccountLabel(newLabel);
      console.log(`Account label changed to: ${newLabel}`);
    } catch (error) {
      console.error(`Failed to change account label to: ${newLabel}`, error);
      throw new Error(`Unable to change account label: ${(error as Error).message}`);
    }
  }

  async addNewAccountWithCustomLabel(customLabel: string): Promise<void> {
    console.log(`Adding new account with custom label: ${customLabel}`);
    try {
      await this.driver.clickElement(this.accountMenuIcon);
      await this.driver.clickElement(this.newAccountButton);
      await this.driver.clickElement(this.addAccountButton);
      await this.driver.fill(this.newAccountNameInput, customLabel);
      await this.driver.clickElementAndWaitToDisappear({
        text: 'Add account',
        tag: this.addAccountConfirmButton,
      });

      // Verify the new account was added
      await this.verifyAccountLabel(customLabel);
      console.log(`New account added with custom label: ${customLabel}`);
    } catch (error) {
      console.error(`Failed to add new account with custom label: ${customLabel}`, error);
      throw new Error(`Unable to add new account with custom label: ${(error as Error).message}`);
    }
  }

  async verifyAccountLabel(expectedLabel: string): Promise<void> {
    console.log(`Verifying account label: ${expectedLabel}`);
    try {
      const element = await this.driver.findElement({
        css: this.accountMenuIcon,
        text: expectedLabel,
      });
      const actualLabel = await element.getText();
      assert.strictEqual(actualLabel, expectedLabel, `Account label mismatch. Expected: ${expectedLabel}, Actual: ${actualLabel}`);
      console.log(`Account label verified: ${expectedLabel}`);
    } catch (error) {
      console.error(`Failed to verify account label: ${expectedLabel}`, error);
      throw new Error(`Account label verification failed: ${(error as Error).message}`);
    }
  }

  async closeAccountMenu(): Promise<void> {
    console.log('Closing account menu');
    try {
      await this.driver.clickElement(this.closeButton);
      console.log('Account menu closed successfully');
    } catch (error) {
      console.error('Failed to close account menu', error);
      throw new Error(`Unable to close account menu: ${(error as Error).message}`);
    }
  }
}

export default AccountCustomNamePage;
