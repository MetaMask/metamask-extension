import { tEn } from '../../../../lib/i18n-helpers';
import { Driver } from '../../../webdriver/driver';

/**
 * Page object for the Perps Withdraw confirmation flow.
 *
 * @see ui/pages/confirmations/components/confirm/info/perps-withdraw-info/perps-withdraw-info.tsx
 */
export class PerpsWithdrawConfirmation {
  private readonly driver: Driver;

  private readonly amountInput = { testId: 'custom-amount-input' };

  private readonly bridgeTimeRow = { testId: 'bridge-time-row' };

  private readonly confirmButton = { testId: 'confirm-footer-button' };

  private readonly customAmountInfo = { testId: 'custom-amount-info' };

  private readonly customAmountInfoText = (text: string) => ({
    testId: 'custom-amount-info',
    text,
  });

  private readonly headerBackButton = {
    testId: 'wallet-initiated-header-back-button',
  };

  private readonly headerTitle = {
    xpath: `//*[@data-testid='wallet-initiated-header-back-button']/following-sibling::*[normalize-space(.)='${tEn(
      'perpsWithdrawFundsTitle',
    )}']`,
  };

  private readonly payWithRow = { testId: 'pay-with-row' };

  private readonly payWithSymbol = { testId: 'pay-with-symbol' };

  private readonly receiveRow = { testId: 'receive-row' };

  private readonly successToast = {
    testId: 'perps-withdraw-success-toast',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async assertConfirmDisabled(): Promise<void> {
    await this.driver.waitForSelector(this.confirmButton, {
      state: 'disabled',
    });
  }

  async checkAvailableBalance(expectedBalance: string): Promise<void> {
    await this.driver.waitForSelector(
      this.customAmountInfoText(
        `${tEn('perpsAvailableBalance')}${expectedBalance}`,
      ),
    );
  }

  async checkConfirmButtonText(expectedText: string): Promise<void> {
    await this.driver.waitForSelector({
      ...this.confirmButton,
      text: expectedText,
    });
  }

  async checkDestinationToken(symbol: string): Promise<void> {
    await this.driver.waitForSelector({
      ...this.payWithRow,
      text: tEn('withdrawTo'),
    });
    await this.driver.waitForSelector({
      ...this.payWithSymbol,
      text: symbol,
    });
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.headerBackButton,
      this.headerTitle,
      this.customAmountInfo,
      this.amountInput,
      this.confirmButton,
    ]);
  }

  async checkWithdrawButtonDisabled(): Promise<void> {
    await this.checkConfirmButtonText(tEn('perpsWithdraw'));
    await this.assertConfirmDisabled();
  }

  async checkWithdrawButtonEnabled(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.bridgeTimeRow,
      this.receiveRow,
    ]);
    await this.checkConfirmButtonText(tEn('perpsWithdraw'));
    await this.driver.waitForSelector(this.confirmButton, {
      state: 'enabled',
    });
  }

  async clickWithdraw(): Promise<void> {
    await this.driver.clickElement(this.confirmButton);
  }

  async fillAmount(amount: string): Promise<void> {
    await this.driver.waitForSelector(this.amountInput, { state: 'enabled' });
    await this.driver.fill(this.amountInput, amount, { retries: 1 });
  }

  async waitForBlockingReason(reason: string): Promise<void> {
    await this.driver.waitForSelector({
      ...this.confirmButton,
      text: reason,
    });
    await this.assertConfirmDisabled();
  }

  async waitForInsufficientFundsReason(): Promise<void> {
    await this.waitForBlockingReason(tEn('alertInsufficientPayTokenBalance'));
  }

  async waitForSuccessToast(): Promise<void> {
    await this.driver.waitForSelector({
      ...this.successToast,
      text: tEn('perpsWithdrawPostQuoteToastSuccessTitle'),
    });
  }
}
