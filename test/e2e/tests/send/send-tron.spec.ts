import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import NetworkManager from '../../page-objects/pages/network-manager';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import {
  mockTronFeatureFlags,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockTrxNativeSpotPrices,
  mockTronAssets,
  TRON_ACCOUNT_ADDRESS,
  TRON_RECIPIENT_ADDRESS,
} from '../tron/mocks/common-tron';
import { proxyTronBlockchainCalls } from '../tron/mocks/local-tron-node-mocks';
import { TronNode } from '../../seeder/tron/node';
import { createTronPortfolioNodeOptions } from '../../seeder/tron/profiles';

describe('Send Tron', function () {
  this.timeout(180_000);

  it('sends TRX using a local Tron node', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'tron',
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        testSpecificMock: async (
          mockServer: Mockttp,
          { localNodes }: { localNodes: unknown[] },
        ) => {
          const tronNode = localNodes.find(
            (node): node is TronNode => node instanceof TronNode,
          );
          if (!tronNode) {
            throw new Error('Tron local node was not started');
          }

          return [
            await mockTronFeatureFlags(mockServer),
            await mockExchangeRates(mockServer),
            await mockFiatExchangeRates(mockServer),
            await mockTrxNativeSpotPrices(mockServer),
            await mockTronAssets(mockServer, tronNode),
            ...(await proxyTronBlockchainCalls(
              mockServer,
              tronNode,
              TRON_ACCOUNT_ADDRESS,
            )),
          ];
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        // Switch to Tron via the UI. Enabling it through fixtures causes a redirect
        // back to the default network because the snap is not yet initialized
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomepage = new NonEvmHomepage(driver);
        await nonEvmHomepage.checkExpectedTokenBalanceIsDisplayed(
          '6.072',
          'TRX',
        );
        const snapTransactionConfirmation = new SnapTransactionConfirmation(
          driver,
        );
        await nonEvmHomepage.clickOnSendButton();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken('tron:728126428', 'TRX');

        // Wait for the send page to load
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();
        await snapTransactionConfirmation.checkPageIsLoaded();
        await snapTransactionConfirmation.clickFooterConfirmButton();
        const activityList = new ActivityListPage(driver);
        await activityList.checkTxAmountInActivity('-1 TRX', 1);
        await activityList.checkNoFailedTransactions();
      },
    );
  });
});
