import { PERPS_TAB_HASH } from '../../../tests/perps/helpers';
import { PerpsPositionsBase } from './perps-positions-base';

/**
 * Page object for the Perps tab on the account overview (wallet home).
 * Use this to open the Perps tab from the account overview; then use PerpsHomePage to interact with the tab content (balance, positions, explore, etc.).
 *
 * @see ui/components/app/perps/perps-tab-view.tsx
 */
export class PerpsTabPage extends PerpsPositionsBase {
  private readonly accountOverviewAssetTab = {
    testId: 'account-overview__asset-tab',
  };

  /**
   * Opens the Perps tab by setting the window hash to the perps tab query.
   * Uses window.location.hash so the SPA router switches tab without a full page reload,
   * which keeps the extension context and avoids re-injecting the extension.
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
