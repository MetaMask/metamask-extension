import { Driver } from '../../../../webdriver/driver';
import { RawLocator } from '../../../common';
import TransactionConfirmation from './transaction-confirmation';

class ERC20ApproveTransactionConfirmation extends TransactionConfirmation {
  private spendingCapRequestTitle: RawLocator;

  private spendingCapPermissionDescription: RawLocator;

  private estimatedChangesSection: RawLocator;

  private spendingCapSection: RawLocator;

  private spendingCapAmount: RawLocator;

  private spenderSection: RawLocator;

  private requestFromSection: RawLocator;

  private interactingWithSection: RawLocator;

  private methodSection: RawLocator;

  private headerAdvancedDetailsButton: string;

  constructor(driver: Driver) {
    super(driver);

    // Main title and description
    this.spendingCapRequestTitle = {
      css: 'h2',
      text: 'Spending cap request',
    };

    this.spendingCapPermissionDescription = {
      css: 'p',
      text: 'This site wants permission to withdraw your tokens',
    };

    // Main sections
    this.estimatedChangesSection = {
      css: 'p',
      text: 'Estimated changes',
    };

    this.spendingCapSection = {
      css: 'p',
      text: 'Spending cap',
    };

    this.spendingCapAmount = {
      css: 'p',
      text: '7',
    };

    // Advanced details sections
    this.spenderSection = {
      css: 'p',
      text: 'Spender',
    };

    this.requestFromSection = {
      css: 'p',
      text: 'Request from',
    };

    this.interactingWithSection = {
      css: 'p',
      text: 'Interacting with',
    };

    this.methodSection = {
      css: 'p',
      text: 'Method',
    };

    this.headerAdvancedDetailsButton =
      '[data-testid="header-advanced-details-button"]';
  }

  /**
   * Verifies that the spending cap request page is loaded with the correct title
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_spendingCapRequestTitle(): Promise<void> {
    console.log('Verify spending cap request title is displayed');
    await this.driver.waitForSelector(this.spendingCapRequestTitle);
  }

  /**
   * Verifies the permission description is displayed
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_spendingCapPermissionDescription(): Promise<void> {
    console.log('Verify spending cap permission description is displayed');
    await this.driver.waitForSelector(this.spendingCapPermissionDescription);
  }

  /**
   * Verifies the estimated changes section is displayed
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_estimatedChangesSection(): Promise<void> {
    console.log('Verify estimated changes section is displayed');
    await this.driver.waitForSelector(this.estimatedChangesSection);
  }

  /**
   * Verifies the spending cap section is displayed
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_spendingCapSection(): Promise<void> {
    console.log('Verify spending cap section is displayed');
    await this.driver.waitForSelector(this.spendingCapSection);
  }

  /**
   * Verifies the spending cap amount is displayed
   *
   * @param expectedAmount - The expected spending cap amount to verify
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_spendingCapAmount(expectedAmount: string): Promise<void> {
    console.log(`Verify spending cap amount ${expectedAmount} is displayed`);
    await this.driver.waitForSelector({
      css: 'p',
      text: expectedAmount,
    });
  }

  /**
   * Verifies all basic approve transaction details are displayed
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_approveTransactionDetails(): Promise<void> {
    console.log('Verify all basic approve transaction details');
    await this.check_spendingCapRequestTitle();
    await this.check_spendingCapPermissionDescription();
    await this.check_estimatedChangesSection();
    await this.check_spendingCapSection();
    await this.check_spendingCapAmount('7');
  }

  /**
   * Verify advanced details sections are displayed after expanding
   *
   * This method checks for the presence of all key advanced detail sections
   * that should be visible after expanding the advanced details section.
   */
  async verifyAdvancedDetailsSections(): Promise<void> {
    console.log('Verify all advanced details sections are displayed');
    await this.driver.waitForSelector(this.spenderSection);
    await this.driver.waitForSelector(this.requestFromSection);
    await this.driver.waitForSelector(this.interactingWithSection);
    await this.driver.waitForSelector(this.methodSection);
    await this.driver.waitForSelector(this.spendingCapSection);
  }

  /**
   * Complete flow to expand advanced details and verify all sections
   */
  async expandAndVerifyAdvancedDetails(): Promise<void> {
    console.log('Expanding advanced details and verifying all sections');

    // Wait for the advanced details button to be ready
    await this.driver.waitForSelector(this.headerAdvancedDetailsButton);
    await this.driver.delay(1000); // TODO: Scroll button not shown in Firefox if advanced details enabled too fast

    // Expand the advanced details section
    await this.driver.clickElement(this.headerAdvancedDetailsButton);

    // Verify all sections are displayed
    await this.verifyAdvancedDetailsSections();
  }

  /**
   * Verifies the page is loaded and all basic details are present
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    console.log('Verify ERC20 approve confirmation page is loaded');
    await super.check_pageIsLoaded();
    await this.check_spendingCapRequestTitle();
  }
}

export default ERC20ApproveTransactionConfirmation;
