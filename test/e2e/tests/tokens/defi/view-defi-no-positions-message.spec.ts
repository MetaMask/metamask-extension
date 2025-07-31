import { withFixtures } from '../../../helpers';

import FixtureBuilder from '../../../fixture-builder';
import Homepage from '../../../page-objects/pages/home/homepage';

import DeFiTab from '../../../page-objects/pages/defi-tab';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { Driver } from '../../../webdriver/driver';
import { mockNoDeFiPositionFeatureFlag } from '../../confirmations/helpers';

import { switchToNetworkFromSendFlow } from '../../../page-objects/flows/network.flow';

describe('Check DeFi empty state when no defi positions', function () {
  it('user should be able to view empty', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockNoDeFiPositionFeatureFlag,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await new Homepage(driver).goToDeFiTab();

        const defiTab = new DeFiTab(driver);

        // Empty state
        await defiTab.check_noPositionsMessageIsDisplayed();

        // switch network
        await switchToNetworkFromSendFlow(driver, 'Ethereum');

        await defiTab.check_noPositionsMessageIsDisplayed();
      },
    );
  });
});
