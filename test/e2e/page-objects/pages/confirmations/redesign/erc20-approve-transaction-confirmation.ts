import { tEn } from '../../../../../lib/i18n-helpers';
import { Driver } from '../../../../webdriver/driver';
import TransactionConfirmation from './transaction-confirmation';

class ERC20ApproveTransactionConfirmation extends TransactionConfirmation {
  private readonly spendingCapRequestTitle = {
    css: 'h2',
    text: tEn('confirmTitlePermitTokens') as string,
  };

  private readonly spendingCapPermissionDescription = {
    css: 'p',
    text: tEn('confirmTitleDescERC20ApproveTransaction') as string,
  };

  private readonly estimatedChangesSection = {
    css: 'p',
    text: tEn('simulationDetailsTitle') as string,
  };

  private readonly spendingCapSection = {
    css: 'p',
    text: tEn('spendingCap') as string,
  };

  private readonly spenderSection = {
    css: 'p',
    text: tEn('spender') as string,
  };

  private readonly requestFromSection = {
    css: 'p',
    text: tEn('requestFrom') as string,
  };

  private readonly interactingWithSection = {
    css: 'p',
    text: tEn('interactingWith') as string,
  };

  private readonly methodSection = {
    css: 'p',
    text: tEn('methodData') as string,
  };

  constructor(driver: Driver) {
    super(driver);
  }

  async checkSpendingCapRequestTitle(): Promise<void> {
    console.log('Verify spending cap request title is displayed');
    await this.driver.waitForSelector(this.spendingCapRequestTitle);
  }

  async checkSpendingCapPermissionDescription(): Promise<void> {
    console.log('Verify spending cap permission description is displayed');
    await this.driver.waitForSelector(this.spendingCapPermissionDescription);
  }

  async checkEstimatedChangesSection(): Promise<void> {
    console.log('Verify estimated changes section is displayed');
    await this.driver.waitForSelector(this.estimatedChangesSection);
  }

  async checkSpendingCapSection(): Promise<void> {
    console.log('Verify spending cap section is displayed');
    await this.driver.waitForSelector(this.spendingCapSection);
  }

  async checkSpendingCapAmount(expectedAmount: string): Promise<void> {
    console.log(`Verify spending cap amount ${expectedAmount} is displayed`);
    await this.driver.waitForSelector({
      css: 'p',
      text: expectedAmount,
    });
  }

  async checkSpenderSection(): Promise<void> {
    console.log('Verify spender section is displayed');
    await this.driver.waitForSelector(this.spenderSection);
  }

  async checkRequestFromSection(): Promise<void> {
    console.log('Verify request from section is displayed');
    await this.driver.waitForSelector(this.requestFromSection);
  }

  async checkInteractingWithSection(): Promise<void> {
    console.log('Verify interacting with section is displayed');
    await this.driver.waitForSelector(this.interactingWithSection);
  }

  async checkMethodSection(): Promise<void> {
    console.log('Verify method section is displayed');
    await this.driver.waitForSelector(this.methodSection);
  }

  async checkAdvancedDetailsSections(): Promise<void> {
    console.log('Verify all advanced details sections are displayed');
    await this.checkSpenderSection();
    await this.checkRequestFromSection();
    await this.checkInteractingWithSection();
    await this.checkMethodSection();
  }
}

export default ERC20ApproveTransactionConfirmation;
