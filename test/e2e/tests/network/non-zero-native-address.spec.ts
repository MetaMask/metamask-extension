/**
 * Non-zero native currency address — Rootstock, Stable, Mantle, Metis, Gnosis.
 *
 * Monitors the regression where networks whose native token is not `0x0` (or
 * is catalogued as `erc20:0x0`) show a duplicate/missing native row and route
 * Send as an ERC-20 `transfer` instead of a native `simpleSend`.
 *
 * See `test/e2e/helpers/custom-network-harness.ts`.
 */

import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import {
  NON_ZERO_NATIVE_NETWORKS,
  getCustomNetwork,
  prepareCustomNetwork,
} from '../../helpers/custom-network-harness';
import { login } from '../../page-objects/flows/login.flow';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import SendPage from '../../page-objects/pages/send/send-page';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';

const DEFAULT_RECIPIENT = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
const SEND_AMOUNT = '1';

NON_ZERO_NATIVE_NETWORKS.forEach((id) => {
  describe(`Non-zero native on ${getCustomNetwork(id).name}`, function () {
    it('shows a single native row and sends via the native path', async function () {
      const { fixtures, localNodeOptions, testSpecificMock, network } =
        prepareCustomNetwork(id, 'nativeSend');

      await withFixtures(
        {
          fixtures,
          localNodeOptions,
          testSpecificMock,
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          // Homepage overview still shows an ETH-denominated default; the
          // Tokens tab is the surface under test.
          await login(driver, { validateBalance: false });

          const tokensTab = new TokensTab(driver);
          await tokensTab.checkTokenListIsDisplayed();
          await tokensTab.checkTokenItemNumber(1);
          await tokensTab.checkTokenExistsInList(network.nativeSymbol);
          await tokensTab.checkExpectedTokenBalanceIsDisplayed(
            '25',
            network.nativeSymbol,
          );

          const homePage = new HomePage(driver);
          await homePage.startSendFlow();

          const sendPage = new SendPage(driver);
          await sendPage.checkPageIsLoaded();
          await sendPage.selectToken(network.chainIdHex, network.nativeSymbol);
          await sendPage.fillRecipient({ recipientAddress: DEFAULT_RECIPIENT });
          await sendPage.fillAmount(SEND_AMOUNT);
          await sendPage.pressContinueButton();

          const transactionConfirmation = new TransactionConfirmation(driver);
          await transactionConfirmation.checkNativeTransferPath(
            network.nativeSymbol,
          );
          await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();

          await homePage.goToActivityList();
          const activityTab = new ActivityTab(driver);
          await activityTab.checkTransactionActivityByText('Sent');
          await activityTab.checkCompletedTxNumberDisplayedInActivity(1);
          await activityTab.checkTxAmountInActivity(
            `-${SEND_AMOUNT} ${network.nativeSymbol}`,
          );
        },
      );
    });
  });
});
