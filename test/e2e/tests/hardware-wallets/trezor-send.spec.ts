import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { Ganache } from '../../seeder/ganache';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HomePage from '../../page-objects/pages/home/homepage';
import { sendRedesignedTransactionToAddress } from '../../page-objects/flows/send-transaction.flow';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';

const RECIPIENT = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

describe('Trezor Hardware', function (this: Suite) {
  it('send ETH', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withTrezorAccount().build(),
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
      }) => {
        // Seed the Trezor account with balance
        await ganacheServer?.setAccountBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          '0x100000000000000000000',
        );
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed('1208925.8196');
        await sendRedesignedTransactionToAddress({
          driver,
          recipientAddress: RECIPIENT,
          amount: '1',
        });
        await homePage.check_pageIsLoaded();
        const activityList = new ActivityListPage(driver);
        await activityList.check_confirmedTxNumberDisplayedInActivity();
        await activityList.check_txAmountInActivity();
      },
    );
  });
});
