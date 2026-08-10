/**
 * Send XDC - XDC Network
 *
 * Wallet-initiated native XDC send, backed by a local Anvil node running on
 * XDC's chain id. See `test/e2e/helpers/xdc-chain.ts` for the fixture and local
 * node wiring.
 */

import ActivityTab from '../../page-objects/pages/home/activity-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import NetworkManager, {
  NetworkId,
} from '../../page-objects/pages/network-manager';
import SendPage from '../../page-objects/pages/send/send-page';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import {
  XDC_CHAIN_ID_HEX,
  XDC_LOCAL_NODE_OPTIONS,
  getXdcChainFixtureBuilder,
  mockXdcChainApis,
} from '../../helpers/xdc-chain';
import { login } from '../../page-objects/flows/login.flow';

const DEFAULT_RECIPIENT = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

describe('Send XDC on XDC Network', function () {
  it('sends XDC', async function () {
    await withFixtures(
      {
        fixtures: getXdcChainFixtureBuilder().build(),
        localNodeOptions: XDC_LOCAL_NODE_OPTIONS,
        testSpecificMock: mockXdcChainApis,
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

        const activityTab = new ActivityTab(driver);
        const homePage = new HomePage(driver);
        const networkManager = new NetworkManager(driver);
        const sendPage = new SendPage(driver);
        const transactionConfirmation = new TransactionConfirmation(driver);

        // Guards against the fixture silently falling back to another network,
        // which would otherwise let the send below pass on the wrong chain.
        await networkManager.openNetworkManager();
        await networkManager.checkNetworkIsSelected(NetworkId.XDC);
        await networkManager.closeNetworkManager();

        await homePage.startSendFlow();
        await sendPage.selectToken(XDC_CHAIN_ID_HEX, 'XDC');
        await sendPage.fillRecipient({ recipientAddress: DEFAULT_RECIPIENT });
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();

        await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();

        await homePage.goToActivityList();
        await activityTab.checkTransactionActivityByText('Sent');
        await activityTab.checkCompletedTxNumberDisplayedInActivity(1);
        await activityTab.checkTxAmountInActivity('-1 XDC');
      },
    );
  });
});
