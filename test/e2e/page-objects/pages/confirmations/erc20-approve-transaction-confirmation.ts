import { tEn } from '../../../../lib/i18n-helpers';
import TransactionConfirmation from './transaction-confirmation';

class ERC20ApproveTransactionConfirmation extends TransactionConfirmation {
  private readonly estimatedChangesSection = {
    css: 'p',
    text: tEn('simulationDetailsTitle'),
  };

  private readonly interactingWithSection = {
    css: 'p',
    text: tEn('interactingWith'),
  };

  private readonly methodSection = {
    css: 'p',
    text: tEn('methodData'),
  };

  private readonly requestFromSection = {
    css: 'p',
    text: tEn('requestFrom'),
  };

  private readonly spenderSection = {
    css: 'p',
    text: tEn('spender'),
  };

  private readonly spendingCapPermissionDescription = {
    css: 'p',
    text: tEn('confirmTitleDescERC20ApproveTransaction'),
  };

  private readonly spendingCapRequestTitle = {
    css: 'h2',
    text: tEn('confirmTitlePermitTokens'),
  };

  private readonly spendingCapSection = {
    css: 'p',
    text: tEn('spendingCap'),
  };

  async checkAdvancedDetailsSections(): Promise<void> {
    console.log('Verify all advanced details sections are displayed');
    await this.checkInteractingWithSection();
    await this.checkMethodSection();
    await this.checkRequestFromSection();
    await this.checkSpenderSection();
  }

  async checkEstimatedChangesSection(): Promise<void> {
    console.log('Verify estimated changes section is displayed');
    await this.driver.waitForSelector(this.estimatedChangesSection);
  }

  async checkInteractingWithSection(): Promise<void> {
    console.log('Verify interacting with section is displayed');
    await this.driver.waitForSelector(this.interactingWithSection);
  }

  async checkMethodSection(): Promise<void> {
    console.log('Verify method section is displayed');
    await this.driver.waitForSelector(this.methodSection);
  }

  async checkRequestFromSection(): Promise<void> {
    console.log('Verify request from section is displayed');
    await this.driver.waitForSelector(this.requestFromSection);
  }

  async checkSpenderSection(): Promise<void> {
    console.log('Verify spender section is displayed');
    await this.driver.waitForSelector(this.spenderSection);
  }

  async checkSpendingCapAmount(expectedAmount: string): Promise<void> {
    console.log(`Verify spending cap amount ${expectedAmount} is displayed`);
    await this.driver.waitForSelector({
      css: 'p',
      text: expectedAmount,
    });
  }

  async checkSpendingCapPermissionDescription(): Promise<void> {
    console.log('Verify spending cap permission description is displayed');
    await this.driver.waitForSelector(this.spendingCapPermissionDescription);
  }

  async checkSpendingCapRequestTitle(): Promise<void> {
    console.log('Verify spending cap request title is displayed');
    await this.driver.waitForSelector(this.spendingCapRequestTitle);
  }

  async checkSpendingCapSection(): Promise<void> {
    console.log('Verify spending cap section is displayed');
    await this.driver.waitForSelector(this.spendingCapSection);
  }
}

export default ERC20ApproveTransactionConfirmation;
