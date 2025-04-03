import { Suite } from 'mocha';
import { Driver } from '../../../webdriver/driver';
import { WINDOW_TITLES, withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import Eip7702AndSendCalls from '../../../page-objects/pages/confirmations/redesign/batch-confirmation';
import HomePage from '../../../page-objects/pages/home/homepage';
import TestDapp from '../../../page-objects/pages/test-dapp';
import { mockEip7702FeatureFlag } from '../helpers';

describe('Upgrade Account', function (this: Suite) {
  it('an EOA account can be upgraded when triggering a batch tx from a dapp in an odd chain id', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
            options: {
              hardfork: 'prague',
              loadState:
                './test/e2e/seeder/network-states/eip7702-state/withDelegatorContracts.json',
            },
          },
        ],
        testSpecificMock: mockEip7702FeatureFlag,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.clickSendCalls();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const upgradeAndBatchTxConfirmation = new Eip7702AndSendCalls(driver);

        await upgradeAndBatchTxConfirmation.check_expectedTxTypeIsDisplayed(
          'Smart account',
        );
        await upgradeAndBatchTxConfirmation.check_expectedInteractingWithIsDisplayed(
          'Account 1',
        );

        // Open Settings and very tx details
        await upgradeAndBatchTxConfirmation.clickAdvancedDetailsButton();
        await upgradeAndBatchTxConfirmation.check_batchTxListIsPresent();

        // Confirm upgrade and batch tx
        await upgradeAndBatchTxConfirmation.tickUpgradeCheckbox();
        await upgradeAndBatchTxConfirmation.confirmUpgradeAndBatchTx();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Check the batch transaction has been successfully performed
        // which included x2 simple sends of 0.001ETH, so the ETH balance should also be updated
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        await activityList.check_confirmedTxNumberDisplayedInActivity(1);
        await homePage.check_expectedBalanceIsDisplayed('24.9998', 'ETH');
      },
    );
  });
});
