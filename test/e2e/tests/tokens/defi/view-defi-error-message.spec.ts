import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import Homepage from '../../../page-objects/pages/home/homepage';
import DeFiTab from '../../../page-objects/pages/defi-tab';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { Driver } from '../../../webdriver/driver';
import { mockDefiPositionsFailure } from '../../confirmations/helpers';

describe('View DeFi error state', function () {
  it('user should be able to view error message', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockDefiPositionsFailure,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await new Homepage(driver).goToDeFiTab();

        const defiTab = new DeFiTab(driver);

        // Error message should be displayed
        await defiTab.checkErrorMessageIsDisplayed();
      },
    );
  });
});
