import { Suite } from 'mocha';
import { Anvil } from '@viem/anvil';
import { Driver } from '../../../webdriver/driver';
import FixtureBuilder from '../../../fixture-builder';
import { WINDOW_TITLES, unlockWallet, withFixtures } from '../../../helpers';
import { mockSimulationResponse } from '../helpers';
import { createDappTransaction } from '../../../page-objects/flows/transaction';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import GasFeeTokenModal from '../../../page-objects/pages/confirmations/redesign/gas-fee-token-modal';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { MockttpServer } from 'mockttp';
import { mockSmartTransactionBatchRequests } from '../../smart-transactions/mocks';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import HomePage from '../../../page-objects/pages/home/homepage';

const TRANSACTION_HASH =
  '0xf25183af3bf64af01e9210201a2ede3c1dcd6d16091283152d13265242939fc4';

const TRANSACTION_HASH_2 =
  '0x5cb2ed94e3e6bada4afc015992db8b7eb4e8e69904f38508e513aa9ec0e9b357';

describe('Gasless - Bundle', function (this: Suite) {
  it('test', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder({ inputChainId: CHAIN_IDS.MAINNET })
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesControllerSmartTransactionsOptedIn()
          .withNetworkControllerOnMainnet()
          .build(),
        localNodeOptions: {
          hardfork: 'london',
        },
        testSpecificMock: (mockServer: MockttpServer) => {
          mockSimulationResponse(mockServer);
          mockSmartTransactionBatchRequests(mockServer, [
            TRANSACTION_HASH,
            TRANSACTION_HASH_2,
          ]);
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver; localNodes: Anvil }) => {
        await unlockWallet(driver);
        await createDappTransaction(driver);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.clickGasFeeTokenPill();

        await driver.delay(120000);

        const gasFeeTokenModal = new GasFeeTokenModal(driver);
        await gasFeeTokenModal.clickToken('USDC');

        await transactionConfirmation.check_selectedGasFeeTokenPill('USDC');
        await transactionConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const homepage = new HomePage(driver);
        await homepage.goToActivityList();

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.check_confirmedTxNumberDisplayedInActivity(2);
      },
    );
  });
});
