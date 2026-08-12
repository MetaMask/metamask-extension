import { tEn } from '../../../../lib/i18n-helpers';
import { Driver } from '../../../webdriver/driver';

// Settling the post-quote CTA (fetching the relay quote, rendering the
// fee/receive rows and enabling the Withdraw button) and the post-submit
// success toast can take longer than the default 10s wait on slower CI
// browsers (e.g. Firefox), so give those quote/submit-dependent waits more room.
const QUOTE_READY_TIMEOUT = 30_000;

/**
 * The Perps Withdraw confirmation: quote-backed amount, fees, and confirm.
 *
 * Screen: wallet-initiated confirmation layered after
 * `PerpsWithdrawPage` submit (not a `#/perps/*` route of its own).
 * Owns: available balance and amount input, pay-with / receive / bridge-time
 * rows, confirm button enabled/disabled and label, and header back.
 * Boundaries: the withdraw form before confirmation belongs to
 * `PerpsWithdrawPage`. This object starts once the confirmation header is
 * shown and the quote can settle.
 * Related: `PerpsWithdrawPage` (how tests get here).
 *
 * @see ui/pages/confirmations/components/confirm/info/perps-withdraw-info/perps-withdraw-info.tsx
 */
export class PerpsWithdrawConfirmation {
  private readonly amountInput = { testId: 'custom-amount-input' };

  private readonly bridgeTimeRow = { testId: 'bridge-time-row' };

  private readonly confirmButton = { testId: 'confirm-footer-button' };

  private readonly customAmountInfo = { testId: 'custom-amount-info' };

  private readonly customAmountInfoText = (text: string) => ({
    testId: 'custom-amount-info',
    text,
  });

  private readonly driver: Driver;

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

  async checkConfirmButtonText(
    expectedText: string,
    timeout?: number,
  ): Promise<void> {
    await this.driver.waitForSelector(
      {
        ...this.confirmButton,
        text: expectedText,
      },
      timeout === undefined ? {} : { timeout },
    );
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
    await this.driver.waitForMultipleSelectors(
      [this.bridgeTimeRow, this.receiveRow],
      { timeout: QUOTE_READY_TIMEOUT },
    );
    await this.checkConfirmButtonText(
      tEn('perpsWithdraw'),
      QUOTE_READY_TIMEOUT,
    );
    await this.driver.waitForSelector(this.confirmButton, {
      state: 'enabled',
      timeout: QUOTE_READY_TIMEOUT,
    });
  }

  async clickWithdraw(): Promise<void> {
    // Firefox WebDriver often reports a successful element.click() here without
    // firing the React handler, leaving the confirmation unapproved.
    await this.driver.clickElementUsingMouseMove(this.confirmButton);
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
    await this.driver.waitForSelector(
      { text: tEn('perpsWithdrawPostQuoteToastSuccessTitle') },
      { timeout: QUOTE_READY_TIMEOUT },
    );
  }
}
