import { Driver } from '../../../webdriver/driver';

/**
 * Bitcoin snap send review: amount, fee, and confirm/cancel footer.
 *
 * Screen: snap confirmation dialog with "Transaction request" header after
 * Bitcoin send Continue (not redesigned MetaMask `#/confirmation`).
 * Owns: send amount / network fee / total display checks and confirm.
 * Boundaries: review and footer only. The send form is `SendPage`; other snap
 * sign/send confirmations use the `confirmations/` snap page objects.
 * Related: `SendPage`, `flows/bitcoin-send.flow.ts`.
 *
 * @see ui/components/app/snaps/snap-ui-footer-button/snap-ui-footer-button.tsx
 * @see ui/components/app/snaps/snap-ui-renderer/components/footer.ts
 * @see test/e2e/page-objects/flows/bitcoin-send.flow.ts
 */
class BitcoinReviewTxPage {
  private readonly cancelButton =
    '[data-testid="confirmation-cancel-snap-footer-button"]';

  private readonly confirmButton =
    '[data-testid="confirmation-confirm-snap-footer-button"]';

  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkNetworkFeeIsDisplayed(fee: string): Promise<void> {
    console.log(
      `Check if network fee ${fee} is displayed on bitcoin review tx page`,
    );
    await this.driver.waitForSelector({
      text: `${fee} BTC`,
      tag: 'p',
    });
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.cancelButton,
        this.confirmButton,
      ]);
      await this.driver.waitForSelector({
        text: 'Transaction request',
        tag: 'h2',
      });
    } catch (e) {
      console.log(
        'Timeout while waiting for bitcoin review tx page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Bitcoin review tx page is loaded');
  }

  async checkSendAmountIsDisplayed(amount: string): Promise<void> {
    console.log(
      `Check if send amount ${amount} is displayed on bitcoin review tx page`,
    );
    await this.driver.waitForSelector({
      text: `-${amount} BTC`,
      tag: 'p',
    });
  }

  async checkTotalAmountIsDisplayed(total: string): Promise<void> {
    console.log(
      `Check if total amount ${total} is displayed on bitcoin review tx page`,
    );
    await this.driver.waitForSelector({
      text: `${total} USD`,
      tag: 'p',
    });
  }

  async clickConfirmButton() {
    console.log('Click confirm button on bitcoin review tx page');
    await this.driver.clickElementAndWaitToDisappear(this.confirmButton);
  }
}

export default BitcoinReviewTxPage;
