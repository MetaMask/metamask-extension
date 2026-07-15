import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import HomePage from '../../page-objects/pages/home/homepage';

describe('Editing Confirm Transaction', function (this: Suite) {
  it('approves a transaction stuck in approved state on boot', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withTransactionControllerApprovedTransaction()
          .build(),
        localNodeOptions: { hardfork: 'london' },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        new HomePage(driver).goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkCompletedTxNumberDisplayedInActivity();
        await activityTab.checkTxAmountInActivity();
      },
    );
  });
});
