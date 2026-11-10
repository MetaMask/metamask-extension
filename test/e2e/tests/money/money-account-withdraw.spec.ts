import { Suite } from 'mocha';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { withFixtures } from '../../helpers';
import type { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';
import {
  loginAndOpenMoneyHome,
  openMoneyAccountWithdraw,
  selectWithdrawReceiveToken,
  verifyMoneyWithdrawSent,
} from '../../page-objects/flows/money-account-withdraw.flow';
import { getMoneyAccountWithdrawConfig } from './money-account-withdraw-fixture-config';

/**
 * Port of the between-accounts cases in mobile
 * `tests/smoke-appium/confirmations/pay/money-account-withdraw.spec.ts`.
 *
 * The vault holds $500 withdrawable, so 25% is $125. The extension Send
 * action opens this confirmation directly: the mobile transfer sheet, and
 * its Perps and Predict destinations, are not wired up here
 * (`IS_MONEY_TRANSFER_SHEET_ENABLED` is false), so those scenarios have no
 * equivalent.
 */
describe('Money Account Withdraw', function (this: Suite) {
  this.timeout(180_000);

  it('withdraws to Mainnet USDC using a percentage and a custom amount', async function () {
    await withFixtures(
      getMoneyAccountWithdrawConfig({ title: this.test?.fullTitle() }),
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
        const confirmation = await openMoneyAccountWithdraw(
          driver,
          moneyHomePage,
        );
        await confirmation.checkPercentageButtonsDisplayed();

        await selectWithdrawReceiveToken(
          driver,
          confirmation,
          CHAIN_IDS.MAINNET,
          'USDC',
        );

        await confirmation.clickPercentage(25);
        await confirmation.checkAmount('125');

        await confirmation.fillAmount('50');
        await confirmation.checkQuoteIsReady();

        await confirmation.clickConfirm();

        await verifyMoneyWithdrawSent(driver, '-$50.00');
      },
    );
  });

  it('withdraws the full vault balance via the Max button', async function () {
    await withFixtures(
      getMoneyAccountWithdrawConfig({ title: this.test?.fullTitle() }),
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
        const confirmation = await openMoneyAccountWithdraw(
          driver,
          moneyHomePage,
        );

        await selectWithdrawReceiveToken(
          driver,
          confirmation,
          CHAIN_IDS.MAINNET,
          'USDC',
        );

        await confirmation.clickMax();
        await confirmation.checkAmount('500');
        await confirmation.checkQuoteIsReady();

        await confirmation.clickConfirm();

        await verifyMoneyWithdrawSent(driver, '-$500.00');
      },
    );
  });
});
