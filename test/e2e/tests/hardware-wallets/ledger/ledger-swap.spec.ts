import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  withSpeculosFixtures,
  startSharedSpeculos,
  stopSharedSpeculos,
} from '../../../speculos/with-speculos-fixtures';
import type { SharedSpeculosContext } from '../../../speculos/with-speculos-fixtures';
import { getBridgeFixtures } from '../../bridge/bridge-test-utils';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED, MOCK_CURRENCY_RATES } from '../../bridge/constants';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToHardwareAccount } from '../../../page-objects/flows/account-list.flow';
import HomePage from '../../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../../page-objects/pages/bridge/quote-page';
import { WINDOW_TITLES } from '../../../constants';
import { LEDGER_SEED_BALANCE } from './ledger-helpers';

const bridgeFixtures = getBridgeFixtures({
  featureFlags: BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
});

describe('Ledger Swap @speculos', function () {
  this.timeout(240000);

  let shared: SharedSpeculosContext;

  // eslint-disable-next-line mocha/no-hooks-for-single-case
  before(async function () {
    this.timeout(120000);
    shared = await startSharedSpeculos();
  });

  // eslint-disable-next-line mocha/no-hooks-for-single-case
  after(async function () {
    this.timeout(30000);
    await stopSharedSpeculos(shared);
  });

  it('completes a swap from ETH to mUSD with a Ledger account', async function () {
    await withSpeculosFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSpeculosLedgerAccount()
          .withNetworkRpcUrlOnLocalhost('0x1')
          .withCurrencyController(MOCK_CURRENCY_RATES)
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
              '0xe708': true,
              '0xa4b1': true,
            },
          })
          .build(),
        localNodeOptions: {
          hardfork: 'london',
          chainId: 1,
        },
        title: this.test?.fullTitle(),
        testSpecificMock: bridgeFixtures.testSpecificMock,
        sharedContext: shared,
        seedBalances: LEDGER_SEED_BALANCE,
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });
        await switchToHardwareAccount(driver, 'Ledger 1');

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.startSwapFlow();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();

        await bridgePage.enterBridgeQuote({
          amount: '1',
          tokenTo: 'mUSD',
        });
        await bridgePage.waitForQuote();

        await bridgePage.submitQuote();
        await bridgePage.approveModalIfPresent();

        await homePage.checkPageIsLoaded();
      },
    );
  });
});
