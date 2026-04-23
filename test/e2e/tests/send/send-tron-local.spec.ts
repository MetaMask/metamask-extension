import { Suite } from 'mocha';
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
import { TronNode } from '../../seeder/tron-node';

// Fund the test account with the same SUN value the original mock uses,
// so the balance display assertion ('6.072 TRX') requires no change.
const FUND_AMOUNT_SUN = 6_072_392;

describe('Send Tron (local blockchain)', function (this: Suite) {
  this.timeout(180_000); // covers Docker startup (before hook) and the test run

  const tronNode = new TronNode();

  // eslint-disable-next-line mocha/no-hooks-for-single-case
  before(async function () {
    // Docker pull + node startup can take up to 90 seconds on a cold machine.
    this.timeout(120_000);
    tronNode.start(); // synchronous — uses execSync internally
    await tronNode.waitForReady(90_000);
    // Fund the fixture's derived Tron account from the genesis witness account.
    await tronNode.fundAccount(TRON_ACCOUNT_ADDRESS, FUND_AMOUNT_SUN);
  });

  // eslint-disable-next-line mocha/no-hooks-for-single-case
  after(async function () {
    tronNode.stop();
  });

  it('should be possible to send TRX using a real local blockchain', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => [
          // ── External service mocks (unchanged from original test) ──────────
          await mockTronFeatureFlags(mockServer),
          await mockExchangeRates(mockServer),
          await mockFiatExchangeRates(mockServer),
          await mockTrxNativeSpotPrices(mockServer),
          await mockTronAssets(mockServer),
          // ── Blockchain calls proxied to local Tron node ───────────────────
          ...(await proxyTronBlockchainCalls(
            mockServer,
            tronNode.baseUrl,
            TRON_ACCOUNT_ADDRESS,
          )),
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomepage = new NonEvmHomepage(driver);
        // Real balance from local node: 6,072,392 SUN ≈ 6.072 TRX
        await nonEvmHomepage.checkExpectedTokenBalanceIsDisplayed(
          '6.072',
          'TRX',
        );

        await nonEvmHomepage.clickOnSendButton();

        const sendPage = new SendPage(driver);
        await sendPage.selectToken('tron:728126428', 'TRX');
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();

        const snapTransactionConfirmation = new SnapTransactionConfirmation(
          driver,
        );
        await snapTransactionConfirmation.checkPageIsLoaded();
        await snapTransactionConfirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        // The broadcast reached the real local node — no failed transaction should appear
        await activityList.checkNoFailedTransactions();
        // The snap tracks the submitted transaction locally and renders it immediately
        await activityList.checkTxAmountInActivity('-1 TRX', 1);
      },
    );
  });
});
