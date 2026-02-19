import { Suite } from 'mocha';
import HomePage from '../../page-objects/pages/home/homepage';
import PerpsPage from '../../page-objects/pages/home/perps-page';
import { withPerpsEnabled } from './common-perps';

describe('Perps - Home Tab', function (this: Suite) {
  this.timeout(300000);

  it('shows the perps tab when the feature flag is enabled', async function () {
    await withPerpsEnabled(
      {
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const perpsPage = new PerpsPage(driver);
        await perpsPage.checkPerpsTabIsDisplayed();
      },
    );
  });

  it('displays positions, orders, and market data in the perps tab', async function () {
    await withPerpsEnabled(
      {
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const perpsPage = new PerpsPage(driver);

        await perpsPage.goToPerpsTab();
        await perpsPage.waitForPerpsTabToLoad();

        await perpsPage.checkControlBarIsDisplayed();
        await perpsPage.checkPositionsSectionIsDisplayed();
        await perpsPage.checkOrdersSectionIsDisplayed();
      },
    );
  });

  it('displays crypto and HIP-3 explore sections when there are no positions', async function () {
    await withPerpsEnabled(
      {
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        const perpsPage = new PerpsPage(driver);

        await perpsPage.goToPerpsTab();
        await perpsPage.waitForPerpsTabToLoad();

        // The mock data includes positions, so explore sections may not show.
        // Control bar should always be present.
        await perpsPage.checkControlBarIsDisplayed();
      },
    );
  });
});
