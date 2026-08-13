import { Driver } from '../../../webdriver/driver';
import { RawLocator } from '../../common';

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

  async clickFooterConfirmButton() {
    await this.driver.clickElement(this.footerConfirmButton);
  }

  async clickFooterConfirmButtonAndAndWaitForWindowToClose() {
    await this.driver.clickElementAndWaitForWindowToClose(
      this.footerConfirmButton,
    );
  }
}

export default WatchAssetConfirmation;
