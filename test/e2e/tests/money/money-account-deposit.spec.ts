import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import type { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';
import {
  loginAndOpenMoneyHome,
  openMoneyAccountDeposit,
  selectDepositPayToken,
  verifyMoneyDepositConverted,
} from '../../page-objects/flows/money-account-deposit.flow';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getMoneyAccountDepositConfig } from './helpers';

/**
 * Port of mobile `tests/smoke-appium/confirmations/pay/money-account-deposit.spec.ts`.
 *
 * The wallet holds 100 USDC + 25 ETH on Mainnet (Anvil). Percentage buttons
 * are driven by the selected pay token's USD balance, so with USDC selected
 * 25% is $25 and 50% is $50.
 */
describe('Money Account Deposit', function (this: Suite) {
  this.timeout(180_000);

  it('deposits USDC from Mainnet using percentage buttons and a custom amount', async function () {
    await withFixtures(
      getMoneyAccountDepositConfig({ title: this.test?.fullTitle() }),
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
        await confirmation.checkPercentageButtonsDisplayed();

        // Pay with USDC on Mainnet, picked explicitly from the asset list.
        await selectDepositPayToken(
          driver,
          confirmation,
          CHAIN_IDS.MAINNET,
          'USDC',
        );

        await confirmation.clickPercentage(25);
        await confirmation.checkAmount('25');

        await confirmation.clearAmount();
        await confirmation.clickPercentage(50);
        await confirmation.checkAmount('50');

        await confirmation.fillAmount('50');
        await confirmation.checkQuoteIsReady();

        await confirmation.clickConfirm();

        await verifyMoneyDepositConverted(driver, '+$50.00');
      },
    );
  });
});
