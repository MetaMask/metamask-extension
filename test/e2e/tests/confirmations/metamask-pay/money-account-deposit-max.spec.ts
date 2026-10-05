import { Suite } from 'mocha';
import { withFixtures } from '../../../helpers';
import type { Anvil } from '../../../seeder/anvil';
import { Driver } from '../../../webdriver/driver';
import {
  loginAndOpenMoneyHome,
  openMoneyAccountDeposit,
  verifyMoneyDepositConverted,
} from '../../../page-objects/flows/money-account-deposit.flow';
import { selectPayToken } from '../../../page-objects/flows/metamask-pay.flow';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { USDC_BALANCE_HUMAN } from './constants';
import { getMoneyAccountDepositConfig } from './helpers';

/**
 * Port of mobile `tests/smoke-appium/confirmations/pay/money-account-deposit-max.spec.ts`.
 *
 * Mainnet USDC → Monad mUSD is a fixed-spread ("No fee") route, so the
 * percentage row offers Max (100%) instead of 90% and the whole 100 USDC
 * balance can be deposited.
 */
describe('Money Account Deposit - Max', function (this: Suite) {
  this.timeout(180_000);

  it('deposits the full USDC balance via the Max button', async function () {
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

        await selectPayToken(driver, confirmation, CHAIN_IDS.MAINNET, 'USDC');

        await confirmation.clickMax();
        await confirmation.checkAmount(String(USDC_BALANCE_HUMAN));
        await confirmation.checkQuoteIsReady();

        await confirmation.clickConfirm();

        await verifyMoneyDepositConverted(driver, `+$${USDC_BALANCE_HUMAN}.00`);
      },
    );
  });
});
