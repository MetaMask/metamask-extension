/**
 * Send - Edit Transaction Tests
 *
 * Tests for editing a send transaction:
 * - Going back from confirm page to edit amount and gas values
 * - Legacy and EIP1559 gas editing
 */

import { login } from '../../page-objects/flows/login.flow';
import { createInternalTransaction } from '../../page-objects/flows/transaction';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import GasFeeModal from '../../page-objects/pages/confirmations/gas-fee-modal';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import SendPage from '../../page-objects/pages/send/send-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';

const PREFERENCES_STATE_MOCK = {
  preferences: {
    showFiatInTestnets: true,
  },
};

describe('Send - Edit Transaction', function () {
  it('edits ETH value and legacy gas from confirm page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPreferencesController(PREFERENCES_STATE_MOCK)
          .build(),
        localNodeOptions: { hardfork: 'muirGlacier' },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        await createInternalTransaction({ driver });

        const transactionConfirmation = new TransactionConfirmation(driver);
        const gasFeeModal = new GasFeeModal(driver);
        const activityListPage = new ActivityListPage(driver);
        const sendPage = new SendPage(driver);

        await transactionConfirmation.checkSendAmount('1 ETH');

        await transactionConfirmation.checkGasFeeFiat('$0.07');

        await transactionConfirmation.clickBackButton();

        await sendPage.editAmountByKeys([driver.Key.BACK_SPACE, '2', '.', '2']);

        await sendPage.pressContinueButton();

        // Open gas fee modal and set custom legacy gas values
        await transactionConfirmation.openGasFeeModal();
        await gasFeeModal.setCustomLegacyGasFee({
          gasPrice: '8',
          gasLimit: '100000',
        });

        // has correct updated value on the confirm screen the transaction
        await transactionConfirmation.checkGasFeeFiat('$0.29');

        // confirms the transaction
        await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();

        await activityListPage.openActivityTab();
        await activityListPage.checkConfirmedTxNumberDisplayedInActivity(1);

        await activityListPage.checkTxAmountInActivity('-2.2 ETH');
      },
    );
  });

  it('edits ETH value and EIP1559 gas from confirm page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPreferencesController(PREFERENCES_STATE_MOCK)
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        await createInternalTransaction({ driver });

        const transactionConfirmation = new TransactionConfirmation(driver);
        const gasFeeModal = new GasFeeModal(driver);
        const activityListPage = new ActivityListPage(driver);
        const sendPage = new SendPage(driver);

        await transactionConfirmation.checkSendAmount('1 ETH');

        await transactionConfirmation.checkGasFeeFiat('$0.75');

        await transactionConfirmation.clickBackButton();

        await sendPage.editAmountByKeys([driver.Key.BACK_SPACE, '2', '.', '2']);

        await sendPage.pressContinueButton();

        // Open gas fee modal and set custom EIP-1559 gas values
        await transactionConfirmation.openGasFeeModal();
        await gasFeeModal.setCustomEIP1559GasFee({
          maxBaseFee: '8',
          priorityFee: '8',
          gasLimit: '100000',
        });

        // has correct updated value on the confirm screen the transaction
        await transactionConfirmation.checkGasFeeFiat('$0.29');

        // confirms the transaction
        await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();

        await activityListPage.openActivityTab();
        await activityListPage.checkConfirmedTxNumberDisplayedInActivity(1);

        await activityListPage.checkTxAmountInActivity('-2.2 ETH');
      },
    );
  });
});
