import { tEn } from '../../../../../lib/i18n-helpers';
import { Driver } from '../../../../webdriver/driver';
import { RawLocator } from '../../../common';
import TransactionConfirmation from './transaction-confirmation';

class TokenTransferTransactionConfirmation extends TransactionConfirmation {
  private networkParagraph: RawLocator;

  private interactingWithParagraph: RawLocator;

  private networkFeeParagraph: RawLocator;

  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;

    this.networkParagraph = {
      css: 'p',
      text: tEn('transactionFlowNetwork') as string,
    };
    this.interactingWithParagraph = {
      css: 'p',
      text: tEn('interactingWith') as string,
    };
    this.networkFeeParagraph = {
      css: 'p',
      text: tEn('networkFee') as string,
    };
  }

  async check_networkParagraph() {
    await this.driver.waitForSelector(this.networkParagraph);
  }

  async check_interactingWithParagraph() {
    await this.driver.waitForSelector(this.interactingWithParagraph);
  }

  async check_networkFeeParagraph() {
    await this.driver.waitForSelector(this.networkFeeParagraph);
  }
}

export default TokenTransferTransactionConfirmation;
