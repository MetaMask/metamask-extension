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
  checkStellarUsdcInTokenList,
  fillStellarAmount,
  fillStellarRecipient,
} from './helpers';

describe('Stellar Send', function () {
  it('sends part of USDC balance and shows it pending then confirmed', async function () {
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
        await login(driver, { validateBalance: false });
        await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await checkStellarHomeXlmBalance(homePage);
        await checkStellarUsdcInTokenList(driver);

        await homePage.startSendFlow();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken(STELLAR_CHAIN_ID, 'USDC');
        await sendPage.checkSendFormIsLoaded();

        await fillStellarRecipient(driver, STELLAR_RECIPIENT_ADDRESS);
        await fillStellarAmount(driver, '1');
        await sendPage.waitForSendAmountBalance();
        await sendPage.pressContinueButton();

        const snapConfirmation = new SnapConfirmSendConfirmation(driver);
        await snapConfirmation.checkPageIsLoaded();
        await snapConfirmation.clickFooterButton({ button: 'confirm' });

        const txToast = new TxToastNotification(driver);
        await txToast.checkTxSubmittedToast();

        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkPendingTxNumberDisplayedInActivity(1);
        await activityTab.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityTab.checkTxAmountInActivity('-1 USDC', 1);
        await activityTab.checkNoFailedTransactions();
      },
    );
  });
});
