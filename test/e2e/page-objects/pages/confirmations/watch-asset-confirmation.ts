import { Driver } from '../../../webdriver/driver';
import { ClickWaitUntil, RawLocator } from '../../common';

/**
 * Minimal `wallet_watchAsset` confirmation helper: confirm via page-container
 * footer (token or NFT suggested asset).
 *
 * Screen: `#/confirm-add-suggested-token` or `#/confirm-add-suggested-nft`
 * (legacy page-container; not redesigned `#/confirmation`).
 * Owns: clicking the page-container next/confirm footer (optionally waiting
 * for the window to close).
 * Boundaries: title/reject flows for suggested tokens belong to
 * `AddTokenConfirmation`. This object does not assert page content beyond
 * the footer action.
 * Related: `AddTokenConfirmation`.
 *
 * @see ui/pages/confirm-add-suggested-token/confirm-add-suggested-token.js
 * @see ui/pages/confirm-add-suggested-nft/confirm-add-suggested-nft.js
 */
class WatchAssetConfirmation {
  private driver: Driver;

  private footerConfirmButton: RawLocator;

  constructor(driver: Driver) {
    this.driver = driver;

    this.footerConfirmButton = '[data-testid="page-container-footer-next"]';
  }

  /**
   * Click the watch-asset footer confirm button.
   *
   * @param options - Footer click options
   * @param options.button - Only `'confirm'` is supported; this screen has no cancel footer.
   * @param options.waitUntil - Optional wait after click. Omitted uses a plain click.
   */
  async clickFooterButton({
    waitUntil,
  }: {
    button: 'confirm';
    waitUntil?: ClickWaitUntil;
  }): Promise<void> {
    await this.clickFooterButtonAndWait(this.footerConfirmButton, waitUntil);
  }

  private async clickFooterButtonAndWait(
    locator: RawLocator,
    waitUntil?: ClickWaitUntil,
  ): Promise<void> {
    switch (waitUntil) {
      case 'windowClose':
        await this.driver.clickElementAndWaitForWindowToClose(locator);
        return;
      case 'disappear':
        await this.driver.clickElementAndWaitToDisappear(locator);
        return;
      default:
        await this.driver.clickElement(locator);
    }
  }
}

export default WatchAssetConfirmation;
