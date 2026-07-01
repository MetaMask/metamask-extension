import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import SendPage from '../../page-objects/pages/send/send-page';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import NetworkManager from '../../page-objects/pages/network-manager';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import {
  buildTronFixtures,
  mockTronApis,
  TRON_RECIPIENT_ADDRESS,
} from '../tron/mocks/common-tron';

describe('Send Tron', function () {
  it('it should be possible to send TRX', async function () {
    await withFixtures(
      {
        fixtures: buildTronFixtures(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        // Switch to Tron via the UI. Enabling it through fixtures causes a redirect
        // back to the default network because the snap is not yet initialized
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const appState = await driver.executeScript(async () => {
          if (window.stateHooks?.getCleanAppState) {
            return window.stateHooks.getCleanAppState();
          }
          if (window.stateHooks?.metamaskGetState) {
            return window.stateHooks.metamaskGetState();
          }
          return null;
        });
        const accounts =
          appState?.AccountsController?.internalAccounts?.accounts ??
          appState?.metamask?.internalAccounts?.accounts ??
          {};
        console.log(
          'DEBUG_ALL_ACCOUNTS',
          JSON.stringify(Object.values(accounts)),
        );

        const homePage = new HomePage(driver);
        const tokensTab = new TokensTab(driver);
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched balance is shown reliably.
        // Tron account is created by a snap at runtime so the balance cannot
        // be pre-seeded — allow extra time for the v5 API fetch on slow CI.
        await driver.refresh();
        const appStateAfterRefresh = await driver.executeScript(async () => {
          if (window.stateHooks?.getCleanAppState) {
            return window.stateHooks.getCleanAppState();
          }
          if (window.stateHooks?.metamaskGetState) {
            return window.stateHooks.metamaskGetState();
          }
          return null;
        });
        const accountsAfterRefresh =
          appStateAfterRefresh?.AccountsController?.internalAccounts?.accounts ??
          appStateAfterRefresh?.metamask?.internalAccounts?.accounts ??
          {};
        console.log(
          'DEBUG_ALL_ACCOUNTS_AFTER_REFRESH',
          JSON.stringify(Object.values(accountsAfterRefresh)),
        );
        await tokensTab.checkExpectedTokenBalanceIsDisplayed('6.072', 'TRX');
        const snapTransactionConfirmation = new SnapTransactionConfirmation(
          driver,
        );
        await homePage.clickOnSendButton();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken('tron:728126428', 'TRX');

        // Wait for the send page to load
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();
        await snapTransactionConfirmation.checkPageIsLoaded();
        await snapTransactionConfirmation.clickFooterConfirmButton();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkTxAmountInActivity('-50,000 HTX', 1); // mocked activity
        await activityTab.checkNoFailedTransactions();
      },
    );
  });
});
