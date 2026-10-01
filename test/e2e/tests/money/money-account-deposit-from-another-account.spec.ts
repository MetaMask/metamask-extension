import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import type { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';
import { ACCOUNT_2 } from '../../constants';
import {
  loginAndOpenMoneyHome,
  openMoneyAccountDeposit,
  selectDepositFundingAccount,
  selectDepositPayToken,
  verifyMoneyDepositConverted,
} from '../../page-objects/flows/money-account-deposit.flow';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getMoneyAccountDepositConfig } from './helpers';

/**
 * Port of mobile
 * `tests/smoke-appium/confirmations/pay/money-account-deposit-from-another-account.spec.ts`.
 *
 * The wallet restores two HD accounts; the deposit is funded from Account 2
 * via the from-account pill on the confirmation.
 */
describe('Money Account Deposit - From Another Account', function (this: Suite) {
  this.timeout(180_000);

  it('deposits USDC funded from a different wallet account', async function () {
    await withFixtures(
      getMoneyAccountDepositConfig({
        title: this.test?.fullTitle(),
        withAccount2: true,
      }),
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: Anvil[];
      }) => {
        const moneyHomePage = await loginAndOpenMoneyHome(
          driver,
          localNodes[0],
        );
        const confirmation = await openMoneyAccountDeposit(
          driver,
          moneyHomePage,
        );

        await confirmation.checkFromAccount('Account 1');
        await selectDepositFundingAccount(
          driver,
          confirmation,
          ACCOUNT_2,
          'Account 2',
        );

        await selectDepositPayToken(
          driver,
          confirmation,
          CHAIN_IDS.MAINNET,
          'USDC',
        );

        await confirmation.fillAmount('50');
        await confirmation.checkQuoteIsReady();

        await confirmation.clickConfirm();

        await verifyMoneyDepositConverted(driver, '+$50.00');
      },
    );
  });
});
