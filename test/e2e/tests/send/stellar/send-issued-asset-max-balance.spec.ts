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
  checkStellarUsdcInTokenList,
  fillStellarAmount,
  fillStellarRecipient,
  landOnStellarSendHome,
} from './helpers';

describe('Stellar Send', function (this: Suite) {
  this.timeout(180_000);

  it('sends total USDC balance via manual full-amount entry', async function () {
    await withStellarFixtures(
      {
        horizonOptions: {
          usdc: {
            balance: '25.0000000',
            limit: '922337203685.4775807',
          },
        },
        enableSend: true,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const homePage = await landOnStellarSendHome(driver);
        await checkStellarHomeXlmBalance(homePage);
        await checkStellarUsdcInTokenList(driver);

        await homePage.startSendFlow();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken(STELLAR_CHAIN_ID, 'USDC');
        await sendPage.checkSendFormIsLoaded();

        await fillStellarRecipient(driver, STELLAR_RECIPIENT_ADDRESS);
        // Issued-asset fees are paid in XLM; no token fee buffer.
        await fillStellarAmount(driver, '25');
        await sendPage.waitForSendAmountBalance();
        await sendPage.pressContinueButton();

        const snapConfirmation = new SnapConfirmSendConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();
        await snapConfirmation.clickFooterButton({ button: 'confirm' });

        const txToast = new TxToastNotification(driver);
        await txToast.checkTxSubmittedToast();

        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityTab.checkNoFailedTransactions();
      },
    );
  });
});
