import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import type { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';
import {
  loginAndOpenMoneyHome,
  openMoneyAccountDeposit,
} from '../../page-objects/flows/money-account-deposit.flow';
import {
  getMoneyAccountDepositConfig,
  PREFILL_ETH_PAY_TOKENS_FLAG,
} from './money-account-deposit-fixture-config';

/**
 * Port of mobile
 * `tests/smoke-appium/confirmations/pay/money-account-deposit-payment-methods.spec.ts`.
 *
 * Only the crypto payment-method scenarios apply to the extension: there is
 * no fiat (debit / credit card) deposit path and no "Add money" sheet, so the
 * mobile "Deposit funds" and "Add mUSD" entry points have no equivalent here.
 */
describe('Money Account Deposit - Payment Methods', function (this: Suite) {
  this.timeout(180_000);

  it('defaults to the no-fee Mainnet USDC pay token', async function () {
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

        await confirmation.checkPayWithToken('USDC');
      },
    );
  });

  it('prefills the preferred pay token from confirmations_pay_tokens', async function () {
    await withFixtures(
      getMoneyAccountDepositConfig({
        title: this.test?.fullTitle(),
        remoteFlagOverrides: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          confirmations_pay_tokens: PREFILL_ETH_PAY_TOKENS_FLAG,
        },
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

        await confirmation.checkPayWithToken('ETH');
      },
    );
  });
});
