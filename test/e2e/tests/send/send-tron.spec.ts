import { Mockttp } from "mockttp";
import { withFixtures } from "../../helpers";
import FixtureBuilderV2 from "../../fixtures/fixture-builder-v2";
import { Driver } from "../../webdriver/driver";
import NonEvmHomepage from "../../page-objects/pages/home/non-evm-homepage";
import SendPage from "../../page-objects/pages/send/send-page";
import SnapTransactionConfirmation from "../../page-objects/pages/confirmations/snap-transaction-confirmation";
import ActivityTab from "../../page-objects/pages/home/activity-tab";
import { selectTronNetwork } from "../../page-objects/flows/tron-network.flow";
import { login } from "../../page-objects/flows/login.flow";
import {
  mockTronFeatureFlags,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockTrxNativeSpotPrices,
  mockTronAssets,
  TRON_ACCOUNT_ADDRESS,
  TRON_RECIPIENT_ADDRESS,
} from "../tron/mocks/common-tron";
import { proxyTronBlockchainCalls } from "../tron/mocks/local-tron-node-mocks";
import { TronNode } from "../../seeder/tron/node";
import { createTronPortfolioNodeOptions } from "../../seeder/tron/profiles";

describe("Send Tron", function () {
  this.timeout(180_000);

  it("sends TRX using a local Tron node", async function () {
    // Captured in afterLocalNodesStart (which runs before the network mocks
    // are set up) so the mock builder can proxy calls to the local node.
    // testSpecificMock itself keeps its single-argument contract.
    let localNodes: unknown[] = [];
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          "anvil",
          {
            type: "tron",
            options: createTronPortfolioNodeOptions(TRON_ACCOUNT_ADDRESS),
          },
        ],
        afterLocalNodesStart: (nodeContext: { localNodes: unknown[] }) => {
          localNodes = nodeContext.localNodes;
        },
        testSpecificMock: async (mockServer: Mockttp) => {
          const tronNode = localNodes.find((node): node is TronNode => node instanceof TronNode);
          if (!tronNode) {
            throw new Error("Tron local node was not started");
          }

          return [
            await mockTronFeatureFlags(mockServer),
            await mockExchangeRates(mockServer),
            await mockFiatExchangeRates(mockServer),
            await mockTrxNativeSpotPrices(mockServer),
            await mockTronAssets(mockServer, tronNode),
            ...(await proxyTronBlockchainCalls(mockServer, tronNode, [
              TRON_ACCOUNT_ADDRESS,
              TRON_RECIPIENT_ADDRESS,
            ])),
          ];
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        await selectTronNetwork(driver);
        await driver.refresh();

        const nonEvmHomepage = new NonEvmHomepage(driver);
        await nonEvmHomepage.checkPageIsLoaded();
        await nonEvmHomepage.checkExpectedTokenBalanceIsDisplayed("6.072", "TRX");
        const snapTransactionConfirmation = new SnapTransactionConfirmation(driver);
        await nonEvmHomepage.clickOnSendButton();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken("tron:728126428", "TRX");

        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount("1");
        await sendPage.pressContinueButton();
        await snapTransactionConfirmation.checkPageIsLoaded();
        await snapTransactionConfirmation.clickFooterConfirmButton();
        const activityList = new ActivityTab(driver);
        await activityList.checkTxAmountInActivity("-1 TRX", 1);
        await activityList.checkNoFailedTransactions();
      },
    );
  });
});
