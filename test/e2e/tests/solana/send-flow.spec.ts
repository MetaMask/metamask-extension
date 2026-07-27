import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { MockedEndpoint, Mockttp } from 'mockttp';

import SendPage from '../../page-objects/pages/send/send-page';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import { SOLANA_MAINNET_SCOPE } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import { SolanaNode } from '../../seeder/solana/node';
import {
  buildSolanaTestSpecificMock,
  commonSolanaAddress,
  LAMPORTS_PER_SOL,
  mockClientSideDetectionApi,
  mockMultiCoinPrice,
  mockPhishingDetectionApi,
  mockPriceApiExchangeRates,
  mockPriceApiSpotPrice,
} from './common-solana';
import { proxySolanaBlockchainCalls } from './mocks/local-solana-node-mocks';
import { buildSolanaPositiveBalanceFixture } from './unified-solana-assets';

const solSendAmountFiatValue = '$11.28';

const SOLANA_ACCOUNT_ADDRESS = '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer';
const LOCAL_SOLANA_BALANCE = 50 * LAMPORTS_PER_SOL;

async function buildLocalSolanaTestSpecificMock(
  mockServer: Mockttp,
  localNodes: unknown[],
): Promise<MockedEndpoint[]> {
  const solanaNode = localNodes.find(
    (node): node is SolanaNode => node instanceof SolanaNode,
  );
  if (!solanaNode) {
    throw new Error('Solana local node was not started');
  }

  return [
    await mockMultiCoinPrice(mockServer),
    await mockPriceApiSpotPrice(mockServer),
    await mockPriceApiExchangeRates(mockServer),
    await mockClientSideDetectionApi(mockServer),
    await mockPhishingDetectionApi(mockServer),
    ...(await proxySolanaBlockchainCalls(mockServer, solanaNode)),
  ];
}

describe('Send flow', function (this: Suite) {
  it('with some field validation', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        const sendPage = new SendPage(driver);

        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('0', 'SOL', false);
        await homePage.clickOnSendButton();
        await sendPage.checkSolanaNetworkIsPresent();
        await sendPage.selectToken(SOLANA_MAINNET_SCOPE, 'SOL');

        await sendPage.fillRecipient({
          recipientAddress: '2433asd',
          validAddress: false,
        });
        await sendPage.checkInvalidAddressError();

        await sendPage.fillRecipient({ recipientAddress: commonSolanaAddress });
        await sendPage.fillAmount('1');
        await sendPage.checkInsufficientFundsError();
        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled and it shouldn`t',
        );
      },
    );
  });

  it('full flow of SOL with a positive balance account', async function () {
    this.timeout(120000);
    // Captured in afterLocalNodesStart (which runs before the network mocks
    // are set up) so the mock builder can proxy calls to the local node.
    // testSpecificMock itself keeps its single-argument contract.
    let localNodes: unknown[] = [];
    await withFixtures(
      {
        fixtures: buildSolanaPositiveBalanceFixture(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          'anvil',
          {
            type: 'solana',
            options: {
              initialBalances: {
                [SOLANA_ACCOUNT_ADDRESS]: LOCAL_SOLANA_BALANCE,
              },
            },
          },
        ],
        afterLocalNodesStart: (nodeContext: { localNodes: unknown[] }) => {
          localNodes = nodeContext.localNodes;
        },
        testSpecificMock: (mockServer: Mockttp) =>
          buildLocalSolanaTestSpecificMock(mockServer, localNodes),
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        const sendPage = new SendPage(driver);

        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('50');
        await homePage.clickOnSendButton();
        await sendPage.checkSolanaNetworkIsPresent();
        await sendPage.selectToken(SOLANA_MAINNET_SCOPE, 'SOL');

        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address nor amount',
        );
        await sendPage.fillRecipient({ recipientAddress: commonSolanaAddress });
        await sendPage.fillAmount('0.1');
        await sendPage.waitForSendAmountBalance();
        await sendPage.waitForSendAmountFiatValue(solSendAmountFiatValue);
        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          true,
          'Continue button should be enabled',
        );

        await sendPage.pressContinueButton();

        const confirmation = new SnapTransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.checkAccountIsDisplayed('Account 1');
        await confirmation.clickFooterConfirmButton();

        const activityTab = new ActivityTab(driver);
        await activityTab.checkTxAction({ action: 'Sent SOL' });
        await activityTab.checkTxAmountInActivity('-0.1 SOL', 1);
        await activityTab.checkNoFailedTransactions();
      },
    );
  });

  it('and transaction fails', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: buildSolanaPositiveBalanceFixture(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock({
          mockGetTransactionFailed: true,
        }),
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        const sendPage = new SendPage(driver);

        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('50');
        await homePage.clickOnSendButton();
        await sendPage.checkSolanaNetworkIsPresent();
        await sendPage.selectToken(SOLANA_MAINNET_SCOPE, 'SOL');

        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address nor amount',
        );
        await sendPage.fillRecipient({ recipientAddress: commonSolanaAddress });
        await sendPage.fillAmount('0.1');
        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          true,
          'Continue button should be enabled',
        );

        await sendPage.pressContinueButton();

        const confirmation = new SnapTransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.checkAccountIsDisplayed('Account 1');
        await confirmation.checkSecurityAlertsErrorIsDisplayed();
        await confirmation.clickFooterConfirmButton();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkFailedTxNumberDisplayedInActivity();
        await activityTab.checkTxAction({
          action: 'Interaction failed',
          confirmedTx: 0,
        });
      },
    );
  });
});
