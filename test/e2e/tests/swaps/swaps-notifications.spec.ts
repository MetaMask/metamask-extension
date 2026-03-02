import { strict as assert } from 'assert';
import { MockedEndpoint, Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import {
  getBridgeFixtures,
  getInsufficientFundsFixtures,
  getQuoteNegativeCasesFixtures,
} from '../bridge/bridge-test-utils';
import {
  BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
  DEFAULT_BRIDGE_FEATURE_FLAGS,
} from '../bridge/constants';
import { checkNotification } from './shared';

const UNSTABLE_TOKEN_PRICE_TITLE = 'Unstable token price';
const UNSTABLE_TOKEN_PRICE_DESCRIPTION =
  'The price of this token in USD is highly volatile, indicating a high risk of losing significant value by interacting with it.';

const getBridgeFixturesWithTokenAlertWarning = (title?: string) => {
  const fixtures = getBridgeFixtures(
    title,
    BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
    false,
  );

  return {
    ...fixtures,
    testSpecificMock: async (mockServer: Mockttp) => {
      const baseMocks = fixtures.testSpecificMock
        ? await fixtures.testSpecificMock(mockServer)
        : [];

      return [
        ...baseMocks,
        await mockServer
          .forPost('https://security-alerts.api.cx.metamask.io/token/scan')
          .always()
          .thenJson(200, {
            features: [
              {
                // This maps to "Unstable token price" in i18n.
                // eslint-disable-next-line @typescript-eslint/naming-convention
                feature_id: 'UNSTABLE_TOKEN_PRICE',
                type: 'Warning',
                description: 'Unstable price warning',
              },
            ],
          }),
      ];
    },
  };
};

describe('Swaps - notifications', function () {
  it('shows token risk warning banner for unstable token price', async function () {
    await withFixtures(
      getBridgeFixturesWithTokenAlertWarning(this.test?.fullTitle()),
      async ({ driver, mockedEndpoint }) => {
        await loginWithBalanceValidation(driver, undefined, undefined, '$0');
        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        const bridgeQuotePage = new BridgeQuotePage(driver);
        await bridgeQuotePage.enterBridgeQuote({
          amount: '1',
        });
        await bridgeQuotePage.waitForQuote();

        const allSeenRequests = (
          await Promise.all(
            mockedEndpoint.map((endpoint: MockedEndpoint) =>
              endpoint.getSeenRequests(),
            ),
          )
        ).flat();
        const tokenScanRequests = allSeenRequests.filter((request: Request) =>
          request.url.includes('security-alerts.api.cx.metamask.io/token/scan'),
        );
        assert.ok(
          tokenScanRequests.length > 0,
          'Security alerts token/scan endpoint was not called',
        );

        await bridgeQuotePage.checkTokenRiskWarningIsDisplayed(
          UNSTABLE_TOKEN_PRICE_TITLE,
          UNSTABLE_TOKEN_PRICE_DESCRIPTION,
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
        await loginWithBalanceValidation(driver, localNodes[0]);
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
        await loginWithBalanceValidation(driver, localNodes[0]);
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
      getBridgeFixtures(
        this.test?.fullTitle(),
        BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
      ),
      async ({ driver }) => {
        await loginWithBalanceValidation(driver, undefined, undefined, '$0');
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
