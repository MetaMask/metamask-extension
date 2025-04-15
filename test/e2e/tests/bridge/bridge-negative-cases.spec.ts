import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { unlockWallet, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import { Driver } from '../../webdriver/driver';
import BridgeQuotePage, {
  BridgeQuote,
} from '../../page-objects/pages/bridge/quote-page';
import { getBridgeNegativeCasesFixtures } from './bridge-test-utils';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AccountListPage from '../../page-objects/pages/account-list-page';

describe('Bridge functionality', function (this: Suite) {
  it('should show message that no trade route is available if getQuote returns error 500', async function () {
    await withFixtures(
      getBridgeNegativeCasesFixtures(async (mockServer) => {
        return await mockServer.forGet(/getQuote/u).thenCallback(() => {
          return {
            statusCode: 500,
            json: { error: 'Internal server error' },
          };
        });
      }, this.test?.fullTitle()),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed();
        await homePage.startBridgeFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.enterBridgeQuote({
          amount: '1',
          tokenFrom: 'ETH',
          tokenTo: 'ETH',
          fromChain: 'Ethereum',
          toChain: 'Linea',
        });
        await bridgePage.check_noTradeRouteMessageIsDisplayed();
      },
    );
  });

  it('should show message that no trade route is available if getQuote returns empty array', async function () {
    await withFixtures(
      getBridgeNegativeCasesFixtures(async (mockServer) => {
        return await mockServer.forGet(/getQuote/u).thenCallback(() => {
          return {
            statusCode: 200,
            json: [],
          };
        });
      }, this.test?.fullTitle()),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed();
        await homePage.startBridgeFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.enterBridgeQuote({
          amount: '1',
          tokenFrom: 'ETH',
          tokenTo: 'ETH',
          fromChain: 'Ethereum',
          toChain: 'Linea',
        });
        await bridgePage.check_noTradeRouteMessageIsDisplayed();
      },
    );
  });

  it('should show message that no trade route is available if getQuote returns invalid response', async function () {
    await withFixtures(
      getBridgeNegativeCasesFixtures(async (mockServer) => {
        return await mockServer.forGet(/getQuote/u).thenCallback(() => {
          return {
            statusCode: 200,
            json: [
              {
                quote: {
                  requestId: 'd6d465bf-38a1-452e-a8e4-b95cb9ad5421',
                  srcChainId: 59144,
                  srcTokenAmount: '991250',
                  srcAsset: {
                    address: null,
                    chainId: 59144,
                    assetId: null,
                    symbol: 'USDC',
                    decimals: 6,
                    name: 'USD Coin',
                    coingeckoId: 'bridged-usd-coin-linea',
                    aggregators: [],
                    occurrences: 0,
                    price: '0',
                  },
                  destChainId: 1,
                  destTokenAmount: '387773599373699',
                  destAsset: {
                    address: '0x0000000000000000000000000000000000000000',
                    chainId: 1,
                    assetId: 'eip155:1/slip44:60',
                    symbol: 'ETH',
                    decimals: 18,
                    name: 'Ethereum',
                    coingeckoId: 'ethereum',
                    aggregators: [],
                    occurrences: 100,
                    price: '0',
                  },
                  bridgeId: 'lifi',
                  bridges: ['hop'],
                  steps: [],
                  bridgePriceData: {
                    totalFromAmountUsd: '0.9913',
                    totalToAmountUsd: '0.6160',
                    priceImpact: '0.3785937657621305',
                  },
                },
                trade: {
                  chainId: null,
                  to: null,
                  from: null,
                  value: null,
                  data: null,
                  gasLimit: 0,
                },
                estimatedProcessingTimeInSeconds: 0,
              },
            ],
          };
        });
      }, this.test?.fullTitle()),
      async ({ driver }) => {
        await unlockWallet(driver);
        const homePage = new HomePage(driver);
        await homePage.check_expectedBalanceIsDisplayed();
        await homePage.startBridgeFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.enterBridgeQuote({
          amount: '1',
          tokenFrom: 'ETH',
          tokenTo: 'ETH',
          fromChain: 'Ethereum',
          toChain: 'Linea',
        });
        await bridgePage.check_noTradeRouteMessageIsDisplayed();
      },
    );
  });
});
