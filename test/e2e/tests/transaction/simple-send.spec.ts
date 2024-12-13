import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { Ganache } from '../../seeder/ganache';
import {
  withFixtures,
  defaultGanacheOptions,
  tempToggleSettingRedesignedTransactionConfirmations,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { sendTransactionToAddress } from '../../page-objects/flows/send-transaction.flow';
import HomePage from '../../page-objects/pages/homepage';

describe('Simple send eth', function (this: Suite) {
  it('can send a simple transaction from one account to another', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
      }) => {
        await loginWithBalanceValidation(driver, ganacheServer);

        await tempToggleSettingRedesignedTransactionConfirmations(driver);

        await sendTransactionToAddress({
          driver,
          recipientAddress: '0x985c30949c92df7a0bd42e0f3e3d539ece98db24',
          amount: '1',
          gasFee: '0.000042',
          totalFee: '1.000042',
        });
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_confirmedTxNumberDisplayedInActivity();
        await homePage.check_txAmountInActivity();
      },
    );
  });
});
