/**
 * Send ETH - Base
 *
 * Wallet-initiated native ETH send on Base, backed by a local Anvil node running
 * on Base's chain id. See `test/e2e/helpers/base-chain.ts` for the fixture and
 * local node wiring.
 */

import ActivityTab from '../../page-objects/pages/home/activity-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import NetworkFilter from '../../page-objects/pages/networks/network-filter';
import SelectNetworkModal, {
  NetworkId,
} from '../../page-objects/pages/networks/select-network-modal';
import SendPage from '../../page-objects/pages/send/send-page';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import {
  BASE_CHAIN_ID_HEX,
  BASE_LOCAL_NODE_OPTIONS,
  getBaseChainFixtureBuilder,
  mockBaseChainApis,
} from '../../helpers/base-chain';
import { login } from '../../page-objects/flows/login.flow';

const DEFAULT_RECIPIENT = '0x2f318C334780961FB129D2a6c30D0763d9a5C970';

describe('Send ETH on Base', function () {
  it('sends ETH', async function () {
    await withFixtures(
      {
        fixtures: getBaseChainFixtureBuilder().build(),
        localNodeOptions: BASE_LOCAL_NODE_OPTIONS,
        testSpecificMock: mockBaseChainApis,
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
        const networkFilter = new NetworkFilter(driver);
        const selectNetworkModal = new SelectNetworkModal(driver);
        const sendPage = new SendPage(driver);
        const transactionConfirmation = new TransactionConfirmation(driver);

        // Guards against the fixture silently falling back to another network,
        // which would otherwise let the send below pass on the wrong chain.
        await networkFilter.open();
        await selectNetworkModal.checkPageIsLoaded();
        await selectNetworkModal.checkNetworkIsSelected(NetworkId.BASE);
        await selectNetworkModal.close();

        await homePage.startSendFlow();
        await sendPage.selectToken(BASE_CHAIN_ID_HEX, 'ETH');
        await sendPage.fillRecipient({ recipientAddress: DEFAULT_RECIPIENT });
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();

        await transactionConfirmation.clickFooterConfirmButtonAndWaitToDisappear();

        await homePage.goToActivityList();
        await activityTab.checkTransactionActivityByText('Sent');
        await activityTab.checkCompletedTxNumberDisplayedInActivity(1);
        await activityTab.checkTxAmountInActivity('-1 ETH');
      },
    );
  });
});
