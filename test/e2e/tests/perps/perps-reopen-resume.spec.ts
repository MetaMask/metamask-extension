/**
 * Perps close/reopen resume E2E test.
 *
 * A reopened popup is a brand new document, so the resume is driven entirely by
 * `AppStateController.lastVisitedRoute` in the background. Closing the popup
 * document and opening `popup-init.html` reproduces that; a same-tab navigation
 * would not, since it keeps the document's history.
 *
 * PREREQUISITE: PERPS_ENABLED=true in the extension build (.metamaskrc) so the
 * background PerpsController is included.
 */
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { PerpsTab } from '../../page-objects/pages/home/perps-tab';
import { PerpsMarketDetailPage } from '../../page-objects/pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../../page-objects/pages/perps/perps-market-list-page';
import { PerpsOrderEntryPage } from '../../page-objects/pages/perps/perps-order-entry-page';
import { getPerpsConfigEligible } from './perps-fixture-config';
import { WS_USER_WITH_FUNDED_ACCOUNT } from './mocks/websocketPositionMocks';

describe('Perps reopen resume', function (this: Suite) {
  it('restores the order screen and the screens beneath it after a close/reopen', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_FUNDED_ACCOUNT,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const walletWindow = await driver.driver.getWindowHandle();

        // Build a real stack in a popup document: market list -> market -> order.
        await driver.openNewPage(`${driver.extensionUrl}/popup.html`);
        const perpsTab = new PerpsTab(driver);
        await perpsTab.navigateToPerpsHome();
        await perpsTab.checkPageIsLoaded();

        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.navigateToMarketList();

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.navigateToMarket('AVAX');
        await marketDetailPage.waitForTradeCtaButtons();
        await marketDetailPage.clickLong();

        const orderEntryPage = new PerpsOrderEntryPage(driver);
        await orderEntryPage.checkPageIsLoaded();

        await driver.driver.close();
        await driver.switchToWindow(walletWindow);
        await driver.openNewPage(`${driver.extensionUrl}/popup-init.html`);

        await orderEntryPage.checkPageIsLoaded();
        await driver.assertElementNotPresent({ testId: 'error-page-title' });

        // Back walks the restored stack instead of dropping straight to home.
        await orderEntryPage.clickBack();
        await marketDetailPage.checkPageIsLoaded();

        await driver.clickElement({
          testId: 'perps-market-detail-back-button',
        });
        await marketListPage.checkPageIsLoaded();

        await marketListPage.clickBack();
        await perpsTab.checkPageIsLoaded();
      },
    );
  });

  it('restores the stack again after a second close/reopen', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_FUNDED_ACCOUNT,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const walletWindow = await driver.driver.getWindowHandle();

        await driver.openNewPage(`${driver.extensionUrl}/popup.html`);
        const perpsTab = new PerpsTab(driver);
        await perpsTab.navigateToPerpsHome();
        await perpsTab.checkPageIsLoaded();

        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.navigateToMarketList();

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.navigateToMarket('AVAX');
        await marketDetailPage.waitForTradeCtaButtons();
        await marketDetailPage.clickLong();

        const orderEntryPage = new PerpsOrderEntryPage(driver);
        await orderEntryPage.checkPageIsLoaded();

        const reopen = async () => {
          await driver.driver.close();
          await driver.switchToWindow(walletWindow);
          await driver.openNewPage(`${driver.extensionUrl}/popup-init.html`);
          await orderEntryPage.checkPageIsLoaded();
        };

        await reopen();

        // Navigating within the restored stack must keep tracking it, so a
        // second close/reopen restores just as much as the first.
        await orderEntryPage.clickBack();
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.waitForTradeCtaButtons();
        await marketDetailPage.clickLong();
        await orderEntryPage.checkPageIsLoaded();

        await reopen();

        await orderEntryPage.clickBack();
        await marketDetailPage.checkPageIsLoaded();
      },
    );
  });
});
