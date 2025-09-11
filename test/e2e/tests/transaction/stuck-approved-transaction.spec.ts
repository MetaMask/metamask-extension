import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HomePage from '../../page-objects/pages/home/homepage';

describe('Editing Confirm Transaction', function (this: Suite) {
  it('approves a transaction stuck in approved state on boot', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerApprovedTransaction()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        new HomePage(driver).goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.checkCompletedTxNumberDisplayedInActivity();
        await activityList.checkTxAmountInActivity();
      },
    );
  });
});
