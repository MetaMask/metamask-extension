import { Suite } from 'mocha';
import { Driver } from '../../../webdriver/driver';
import { TxToastNotification } from '../../../page-objects/components/tx-toast-notification';
import SnapConfirmSendConfirmation from '../../../page-objects/pages/confirmations/snap-confirm-send-confirmation';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import SendPage from '../../../page-objects/pages/send/send-page';
import { withStellarFixtures } from '../../stellar/fixtures/with-stellar-fixtures';
import { STELLAR_CHAIN_ID } from '../../stellar/mocks/common-stellar';
import { STELLAR_RECIPIENT_ADDRESS } from '../../stellar/mocks/stellar-tx-fixtures';
import {
  checkStellarHomeXlmBalance,
  fillStellarAmount,
  fillStellarRecipient,
  landOnStellarSendHome,
} from './helpers';

describe('Stellar Send', function (this: Suite) {
  this.timeout(180_000);

  it('sends part of XLM balance and shows it pending then confirmed', async function () {
    await withStellarFixtures(
      {
        enableSend: true,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const homePage = await landOnStellarSendHome(driver);
        await checkStellarHomeXlmBalance(homePage);

        await homePage.startSendFlow();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken(STELLAR_CHAIN_ID, 'XLM');
        await sendPage.checkSendFormIsLoaded();

        await fillStellarRecipient(driver, STELLAR_RECIPIENT_ADDRESS);
        await fillStellarAmount(driver, '1');
        await sendPage.pressContinueButton();

        const snapConfirmation = new SnapConfirmSendConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();
        await snapConfirmation.clickFooterButton({ button: 'confirm' });

        const txToast = new TxToastNotification(driver);
        await txToast.checkTxSubmittedToast();

        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        // Snap saves Pending immediately; TrackTransaction confirms ~5s later.
        await activityTab.checkPendingTxNumberDisplayedInActivity(1);
        await activityTab.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityTab.checkTxAmountInActivity('-1 XLM', 1);
        await activityTab.checkNoFailedTransactions();
      },
    );
  });
});
