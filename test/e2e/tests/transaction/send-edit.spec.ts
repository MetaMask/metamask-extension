import {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  generateGanacheOptions,
} from '../../helpers';
import {
  TransactionPage,
  GasFeePage,
} from '../../page-objects/transaction-page';

// Dynamic import for FixtureBuilder
const getFixtureBuilder = async () => {
  const FixtureBuilder = (await import('../../fixture-builder')).default;
  return FixtureBuilder;
};

describe('Editing Confirm Transaction', function () {
  it('goes back from confirm page to edit eth value, gas price and gas limit', async function () {
    const FixtureBuilder = await getFixtureBuilder();
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerTypeOneTransaction()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        const transactionPage = new TransactionPage(driver);
        const gasFeePage = new GasFeePage(driver);

        await unlockWallet(driver);

        await transactionPage.check_transactionAmount('1');
        await transactionPage.check_transactionAmount('0.00025');

        await transactionPage.clickEdit();

        await transactionPage.enterAmount('2.2');
        await transactionPage.clickContinue();
        await transactionPage.clickEdit();

        await gasFeePage.enterBaseFee('8');
        await gasFeePage.enterGasLimit('100000');
        await gasFeePage.clickSave();

        await transactionPage.check_transactionAmount('0.0008');
        await transactionPage.check_transactionAmount('2.2 ETH');

        await transactionPage.clickConfirm();
        await transactionPage.clickActivityTab();

        await transactionPage.check_completedTransactionsCount(1);
        await transactionPage.check_transactionValue('-2.2 ETH');
      },
    );
  });

  it('goes back from confirm page to edit eth value, baseFee, priorityFee and gas limit - 1559 V2', async function () {
    const FixtureBuilder = await getFixtureBuilder();
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerTypeTwoTransaction()
          .build(),
        ganacheOptions: generateGanacheOptions({ hardfork: 'london' }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        const transactionPage = new TransactionPage(driver);
        const gasFeePage = new GasFeePage(driver);

        await unlockWallet(driver);

        await transactionPage.check_transactionAmount('1');
        await transactionPage.check_transactionAmount('0.0000375');

        await transactionPage.clickEdit();

        await transactionPage.enterAmount('2.2');
        await transactionPage.clickContinue();

        await gasFeePage.clickEditGasFee();
        await gasFeePage.selectCustomGasFee();

        await gasFeePage.enterBaseFee('8');
        await gasFeePage.enterPriorityFee('8');
        await gasFeePage.clickAdvancedGasFeeEdit();
        await gasFeePage.enterGasLimit('100000');

        await gasFeePage.toggleSaveAsDefault();
        await gasFeePage.clickSave();

        await transactionPage.check_transactionAmount('0.0008');

        await transactionPage.clickConfirm();
        await transactionPage.clickActivityTab();

        await transactionPage.check_completedTransactionsCount(1);
        await transactionPage.check_transactionValue('-2.2 ETH');
      },
    );
  });
});
