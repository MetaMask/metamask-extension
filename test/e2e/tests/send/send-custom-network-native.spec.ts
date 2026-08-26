/**
 * Native send on a custom EVM network (XDC).
 *
 * Regression for WPN-1799: custom-network native send must not surface
 * Swap/Bridge quote-error UI. Quote APIs are mocked to fail so a mis-routed
 * fetch would show banners.
 *
 * See `test/e2e/helpers/custom-network-harness.ts`.
 */

import type { Mockttp } from 'mockttp';
import { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import { prepareCustomNetwork } from '../../helpers/custom-network-harness';
import { login } from '../../page-objects/flows/login.flow';
import { SwapAndBridgeErrorUi } from '../../page-objects/components/swap-and-bridge-error-ui';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';

const DEFAULT_RECIPIENT = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';
const SEND_AMOUNT = '1';

const QUOTE_ERROR_RESPONSE = {
  statusCode: 500,
  json: 'Internal server error',
};

/**
 * Mocks Bridge quote endpoints to fail. If send incorrectly fetches quotes,
 * Swap/Bridge error UI would appear.
 *
 * @param mockServer - Mockttp server.
 * @returns Registered mock endpoints.
 */
async function mockConfusingBridgeQuoteApis(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet(/getQuoteStream/u)
      .always()
      .thenCallback(() => QUOTE_ERROR_RESPONSE),
    await mockServer
      .forGet(/getQuote(?!Stream)/u)
      .always()
      .thenCallback(() => QUOTE_ERROR_RESPONSE),
  ];
}

describe('Send native on custom network', function () {
  it('sends native XDC without swap/bridge error UI', async function () {
    const { fixtures, localNodeOptions, testSpecificMock, network } =
      prepareCustomNetwork('xdc', 'nativeSend');

    await withFixtures(
      {
        fixtures,
        localNodeOptions,
        testSpecificMock: async (mockServer: Mockttp) => {
          const catalogMocks = await testSpecificMock(mockServer);
          const quoteMocks = await mockConfusingBridgeQuoteApis(mockServer);
          return [...catalogMocks, ...quoteMocks];
        },
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes?: Anvil[];
      }) => {
        await login(driver, { localNode: localNodes?.[0] });

        const homePage = new HomePage(driver);
        const sendPage = new SendPage(driver);
        const transactionConfirmation = new TransactionConfirmation(driver);
        const swapAndBridgeErrorUi = new SwapAndBridgeErrorUi(driver);
        const activityTab = new ActivityTab(driver);

        await homePage.startSendFlow();
        await sendPage.checkPageIsLoaded();
        await sendPage.selectToken(network.chainIdHex, network.nativeSymbol);
        await sendPage.fillRecipient({ recipientAddress: DEFAULT_RECIPIENT });
        await sendPage.fillAmount(SEND_AMOUNT);
        await swapAndBridgeErrorUi.checkErrorUiIsAbsent();
        await sendPage.pressContinueButton();

        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.checkWalletInitiatedHeadingTitle();
        await swapAndBridgeErrorUi.checkErrorUiIsAbsent();
        await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();

        await homePage.goToActivityList();
        await activityTab.checkTransactionActivityByText('Sent');
        await activityTab.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityTab.checkTxAmountInActivity(
          `-${SEND_AMOUNT} ${network.nativeSymbol}`,
        );
        await activityTab.checkNoFailedTransactions();
      },
    );
  });
});
