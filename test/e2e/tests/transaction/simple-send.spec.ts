import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures, defaultGanacheOptions } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { sendTransaction } from '../../page-objects/flows/send-transaction.flow';

describe('Simple send eth', function (this: Suite) {
  it('can send a simple transaction from one account to another', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        driver.navigate();
        const homePage = await loginWithBalanceValidation(driver);
        await sendTransaction(
          homePage,
          '0x985c30949c92df7a0bd42e0f3e3d539ece98db24',
          '1',
          '0.000042',
          '1.000042',
        );
        await homePage.check_confirmedTxNumberDisplayedInActivity();
        await homePage.check_txAmountInActivity();
      },
    );
  });
});
