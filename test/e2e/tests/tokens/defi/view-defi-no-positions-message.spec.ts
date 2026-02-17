import { withFixtures } from '../../../helpers';

import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import HomePage from '../../../page-objects/pages/home/homepage';

import DeFiTab from '../../../page-objects/pages/defi-tab';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { Driver } from '../../../webdriver/driver';
import { mockNoDeFiPositionFeatureFlag } from '../../confirmations/helpers';

import { switchToNetworkFromNetworkSelect } from '../../../page-objects/flows/network.flow';

describe('Check DeFi empty state when no defi positions', function () {
  it('user should be able to view empty', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockNoDeFiPositionFeatureFlag,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.goToDeFiTab();

        const defiTab = new DeFiTab(driver);

        // Empty state
        await defiTab.checkNoPositionsMessageIsDisplayed();

        // switch network
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Ethereum');

        await defiTab.checkNoPositionsMessageIsDisplayed();
      },
    );
  });
});
