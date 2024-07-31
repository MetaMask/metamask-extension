import { Suite } from 'mocha';
import { withFixtures, generateGanacheOptions } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/homepage';

describe('Editing Confirm Transaction', function (this: Suite) {
  it('approves a transaction stuck in approved state on boot', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerApprovedTransaction()
          .build(),
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        await homePage.check_completedTxNumberDisplayedInActivity();
        await homePage.check_txAmountInActivity();
      },
    );
  });
});
