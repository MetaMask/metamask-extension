import { strict as assert } from 'assert';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { createInternalTransaction } from '../../page-objects/flows/transaction';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import GasFeeModal from '../../page-objects/pages/confirmations/redesign/gas-fee-modal';
import SendTokenConfirmPage from '../../page-objects/pages/send/send-token-confirmation-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';

const PREFERENCES_STATE_MOCK = {
  preferences: {
    showFiatInTestnets: true,
  },
  // Enables advanced details due to migration 123
  useNonceField: true,
};

describe('Editing Confirm Transaction', function () {
  it('goes back from confirm page to edit eth value, gas price and gas limit', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController(PREFERENCES_STATE_MOCK)
          .withConversionRateDisabled()
          .build(),
        localNodeOptions: { hardfork: 'muirGlacier' },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await createInternalTransaction(driver);

        const sendTokenConfirmPage = new SendTokenConfirmPage(driver);
        const gasFeeModal = new GasFeeModal(driver);
        const activityListPage = new ActivityListPage(driver);

        await driver.findElement({
          css: 'h2',
          text: '1 ETH',
        });

        await sendTokenConfirmPage.checkFirstGasFee('0');
        await sendTokenConfirmPage.checkNativeCurrency('$0.07');

        await driver.clickElement(
          '[data-testid="wallet-initiated-header-back-button"]',
        );

        const inputAmount = await driver.findElement('input[placeholder="0"]');

        await inputAmount.press(driver.Key.BACK_SPACE);
        await inputAmount.press('2');
        await inputAmount.press('.');
        await inputAmount.press('2');

        await driver.clickElement({ text: 'Continue', tag: 'button' });

        // Open gas fee modal and set custom legacy gas values
        await sendTokenConfirmPage.clickEditGasFeeIcon();
        await gasFeeModal.setCustomLegacyGasFee({
          gasPrice: '8',
          gasLimit: '100000',
        });

        // has correct updated value on the confirm screen the transaction
        await sendTokenConfirmPage.checkFirstGasFee('0.0002');
        await sendTokenConfirmPage.checkNativeCurrency('$0.29');

        // confirms the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await activityListPage.openActivityTab();
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-status-label--confirmed',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        const txValues = await driver.findElements(
          '[data-testid="transaction-list-item-primary-currency"]',
        );
        assert.equal(txValues.length, 1);
        assert.ok(/-2.2\s*ETH/u.test(await txValues[0].getText()));
      },
    );
  });

  it('goes back from confirm page to edit eth value, baseFee, priorityFee and gas limit - 1559 V2', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withConversionRateDisabled()
          .withPreferencesController(PREFERENCES_STATE_MOCK)
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await createInternalTransaction(driver);

        const sendTokenConfirmPage = new SendTokenConfirmPage(driver);
        const gasFeeModal = new GasFeeModal(driver);
        const activityListPage = new ActivityListPage(driver);

        await driver.findElement({
          css: 'h2',
          text: '1 ETH',
        });

        await sendTokenConfirmPage.checkFirstGasFee('0.0004');
        await sendTokenConfirmPage.checkNativeCurrency('$0.75');

        await driver.clickElement(
          '[data-testid="wallet-initiated-header-back-button"]',
        );

        const inputAmount = await driver.findElement('input[placeholder="0"]');

        await inputAmount.press(driver.Key.BACK_SPACE);
        await inputAmount.press('2');
        await inputAmount.press('.');
        await inputAmount.press('2');

        await driver.clickElement({ text: 'Continue', tag: 'button' });

        // Open gas fee modal and set custom EIP-1559 gas values
        await sendTokenConfirmPage.clickEditGasFeeIcon();
        await gasFeeModal.setCustomEIP1559GasFee({
          maxBaseFee: '8',
          priorityFee: '8',
          gasLimit: '100000',
        });

        // has correct updated value on the confirm screen the transaction
        await sendTokenConfirmPage.checkFirstGasFee('0.0002');
        await sendTokenConfirmPage.checkNativeCurrency('$0.29');

        // confirms the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await activityListPage.openActivityTab();
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-status-label--confirmed',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        const txValues = await driver.findElements(
          '[data-testid="transaction-list-item-primary-currency"]',
        );
        assert.equal(txValues.length, 1);
        assert.ok(/-2.2\s*ETH/u.test(await txValues[0].getText()));
      },
    );
  });
});
