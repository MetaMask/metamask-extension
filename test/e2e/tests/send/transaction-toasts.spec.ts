/**
 * Generic transaction toasts are off in the default fixture.
 * This spec turns them on and covers the submitted-to-confirmed toast.
 */

import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import { createInternalTransaction } from '../../page-objects/flows/transaction.flow';
import Confirmation from '../../page-objects/pages/confirmations/confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import TransactionDetailsPage from '../../page-objects/pages/transaction-details-page';
import { TxToastNotification } from '../../page-objects/components/tx-toast-notification';

describe('Transaction toasts', function () {
  it('dismisses the confirmed toast and stays on the home page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().withTransactionToastsEnabled().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        await createInternalTransaction({ driver });
        await new Confirmation(driver).clickFooterButton({
          button: 'confirm',
        });

        const txToast = new TxToastNotification(driver);
        await txToast.checkTxConfirmedToast();
        await txToast.closeToastNotification();
        await new HomePage(driver).checkPageIsLoaded();
      },
    );
  });

  it('opens transaction details from the confirmed toast', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().withTransactionToastsEnabled().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        await createInternalTransaction({ driver });
        await new Confirmation(driver).clickFooterButton({
          button: 'confirm',
        });

        const txToast = new TxToastNotification(driver);
        await txToast.checkTxConfirmedToast();
        await txToast.openConfirmedToast();

        const transactionDetailsPage = new TransactionDetailsPage(driver);
        await transactionDetailsPage.checkPageIsLoaded();
        await transactionDetailsPage.checkStatus('Confirmed');
      },
    );
  });
});
