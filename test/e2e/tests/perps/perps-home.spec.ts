import assert from 'node:assert/strict';
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { getConfig } from './helpers';

/**
 * Perps E2E tests.
 *
 * Positions and orders come from mock PerpsStreamManager (ui/providers/perps/PerpsStreamManager/index.mock.ts).
 * When real PerpsController is integrated, WebSocket/HTTP mocks can be used (websocket-perps-mocks, mock-e2e).
 */
describe('Perps', function (this: Suite) {

  it('shows list of open positions', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();

        const positionCount = await perpsHomePage.getPositionCardsCount();
        assert.ok(
          positionCount >= 1,
          `Expected at least 1 open position, got ${positionCount}`,
        );

        await perpsHomePage.waitForPositionCard('ETH');
      },
    );
  });
});
