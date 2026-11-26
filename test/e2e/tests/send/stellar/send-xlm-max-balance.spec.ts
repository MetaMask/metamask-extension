import { Driver } from '../../../webdriver/driver';
import { TxToastNotification } from '../../../page-objects/components/tx-toast-notification';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../../page-objects/flows/network.flow';
import SnapConfirmSendConfirmation from '../../../page-objects/pages/confirmations/snap-confirm-send-confirmation';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import SendPage from '../../../page-objects/pages/send/send-page';
import { withStellarFixtures } from '../../stellar/fixtures/with-stellar-fixtures';
import {
  STELLAR_CHAIN_ID,
  STELLAR_NETWORK_NAME,
} from '../../stellar/mocks/stellar-constants';
import { STELLAR_RECIPIENT_ADDRESS } from '../../stellar/mocks/stellar-tx-fixtures';
import {
  checkStellarHomeXlmBalance,
  fillStellarAmount,
  fillStellarRecipient,
} from './helpers';

/**
 * Manual max entry leaves room for the account base reserve (2 × 0.5 XLM) and
 * a small inclusion-fee headroom — same idea as Tron's fee-buffered max send.
 * Seeded balance is 100 XLM → 100 − 1.1 = 98.9.
 */
const XLM_MAX_SEND_AMOUNT = '98.9';

describe('Stellar Send', function () {
  it('sends fee-buffered XLM balance via manual full-amount entry', async function () {
    await withStellarFixtures(
      {
        enableSend: true,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await checkStellarHomeXlmBalance(homePage);

        await homePage.startSendFlow();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken(STELLAR_CHAIN_ID, 'XLM');
        await sendPage.checkSendFormIsLoaded();

        await fillStellarRecipient(driver, STELLAR_RECIPIENT_ADDRESS);
        await fillStellarAmount(driver, XLM_MAX_SEND_AMOUNT);
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
