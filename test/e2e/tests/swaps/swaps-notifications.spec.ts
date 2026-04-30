import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import {
  getBridgeFixtures,
  getInsufficientFundsFixtures,
  getQuoteNegativeCasesFixtures,
  mockTokensWithSecurityData,
} from '../bridge/bridge-test-utils';
import {
  BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
  DEFAULT_BRIDGE_FEATURE_FLAGS,
} from '../bridge/constants';
import { checkNotification } from './shared';

const MUSD_MALICIOUS_SECURITY_DATA = {
  type: 'Malicious',
  metadata: {
    features: [
      {
        featureId: 'HONEYPOT',
        type: 'Malicious',
        description: 'Honeypot risk',
      },
    ],
  },
};

describe('Swaps - notifications', function () {
  it('shows token risk warning banner for malicious destination token', async function () {
    const fixtures = getBridgeFixtures({
      title: this.test?.fullTitle(),
      featureFlags: {
        ...BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        refreshRate: 30000,
      },
    });
    const originalTestSpecificMock = fixtures.testSpecificMock;

    await withFixtures(
      {
        ...fixtures,
        testSpecificMock: async (mockServer: Mockttp) => {
          const baseMocks = originalTestSpecificMock
            ? await originalTestSpecificMock(mockServer)
            : [];
          await mockTokensWithSecurityData(
            mockServer,
            MUSD_MALICIOUS_SECURITY_DATA,
          );
          return baseMocks;
        },
      },
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$225,730.11' });
        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        const bridgeQuotePage = new BridgeQuotePage(driver);
        // Explicitly select mUSD so the token comes from the API with securityData
        await bridgeQuotePage.enterBridgeQuote({
          amount: '1',
          tokenTo: 'mUSD',
        });
        await bridgeQuotePage.waitForQuote();

        // Banner title is bridgeTokenIsMaliciousBanner ("$1 is a malicious token.")
        await bridgeQuotePage.checkTokenRiskWarningIsDisplayed(
          'malicious token',
        );
      },
    );
  });

  it('shows insufficient funds state', async function () {
    await withFixtures(
      getInsufficientFundsFixtures(
        DEFAULT_BRIDGE_FEATURE_FLAGS,
        this.test?.fullTitle(),
      ),
      async ({ driver, localNodes }) => {
        await login(driver, { localNode: localNodes[0] });
        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        const bridgeQuotePage = new BridgeQuotePage(driver);
        await bridgeQuotePage.enterBridgeQuote({
          amount: '24.9950',
          tokenFrom: 'ETH',
          tokenTo: 'WETH',
          fromChain: 'Ethereum',
          toChain: 'Linea',
        });
        await bridgeQuotePage.checkInsufficientFundsButtonIsDisplayed();
        await bridgeQuotePage.checkMoreETHneededIsDisplayed();
      },
    );
  });

  it('shows no trade route available notification', async function () {
    await withFixtures(
      {
        ...getQuoteNegativeCasesFixtures(
          {
            statusCode: 500,
            json: 'Internal server error',
          },
          DEFAULT_BRIDGE_FEATURE_FLAGS,
          this.test?.fullTitle(),
        ),
      },
      async ({ driver, localNodes }) => {
        await login(driver, { localNode: localNodes[0] });
        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        const bridgeQuotePage = new BridgeQuotePage(driver);
        await bridgeQuotePage.enterBridgeQuote({
          amount: '1',
          tokenFrom: 'ETH',
          tokenTo: 'ETH',
          fromChain: 'Ethereum',
          toChain: 'Linea',
        });
        await bridgeQuotePage.checkNoTradeRouteMessageIsDisplayed();
      },
    );
  });

  it('shows low slippage warning in transaction settings', async function () {
    await withFixtures(
      getBridgeFixtures({
        title: this.test?.fullTitle(),
        featureFlags: BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
      }),
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$225,730.11' });
        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        const bridgeQuotePage = new BridgeQuotePage(driver);
        await bridgeQuotePage.enterBridgeQuote({
          amount: '1',
        });
        await bridgeQuotePage.waitForQuote();

        await bridgeQuotePage.setCustomSlippage('0.1');

        await checkNotification(driver, {
          title: 'Low slippage',
          text: 'A value this low (0.1%) may result in a failed swap',
        });
      },
    );
  });
});
