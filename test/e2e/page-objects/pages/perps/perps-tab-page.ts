import { PERPS_TAB_HASH } from '../../../tests/perps/helpers';
import { PerpsPositionsBase } from './perps-positions-base';

/**
 * Page object for the Perps tab on the account overview (home).
 * Covers the tab that shows positions and orders from the mock PerpsStreamManager.
 *
 * @see ui/components/app/perps/perps-tab-view.tsx
 */
export class PerpsTabPage extends PerpsPositionsBase {
  private readonly accountOverviewAssetTab = {
    testId: 'account-overview__asset-tab',
  };

  /**
   * Opens the Perps tab by setting the window hash to the perps tab query.
   * Uses window.location.hash for SPA navigation without a full page reload.
   */
  async openPerpsTab(): Promise<void> {
    await this.driver.executeScript(
      `window.location.hash = '${PERPS_TAB_HASH}';`,
    );
  }

  /**
   * Waits for the account overview to be loaded (tabs visible).
   */
  async waitForAccountOverviewLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.accountOverviewAssetTab);
  }
}
