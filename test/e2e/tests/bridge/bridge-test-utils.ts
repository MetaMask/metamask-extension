import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { Browser, Key } from 'selenium-webdriver';
import FixtureBuilder from '../../fixture-builder';
import { generateGanacheOptions } from '../../helpers';
import {
  BRIDGE_CLIENT_ID,
  BRIDGE_DEV_API_BASE_URL,
  BRIDGE_PROD_API_BASE_URL,
} from '../../../../shared/constants/bridge';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { Driver } from '../../webdriver/driver';
import { FeatureFlagResponse } from '../../../../ui/pages/bridge/bridge.util';
import { isManifestV3 } from '../../../../shared/modules/mv3.utils';
import {
  DEFAULT_FEATURE_FLAGS_RESPONSE,
  ETH_CONVERSION_RATE_USD,
  MOCK_CURRENCY_RATES,
} from './constants';

const IS_FIREFOX = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

export class BridgePage {
  driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  reloadHome = async () => {
    await this.driver.navigate();
  };

  navigateToBridgePage = async (
    location:
      | 'wallet-overview'
      | 'coin-overview'
      | 'token-overview' = 'wallet-overview',
  ) => {
    // Mitigates flakiness by waiting for the feature flags to be fetched
    await this.driver.delay(3000);
    let bridgeButtonTestIdPrefix;
    switch (location) {
      case 'wallet-overview':
        bridgeButtonTestIdPrefix = 'eth';
        break;
      case 'coin-overview': // native asset page
        bridgeButtonTestIdPrefix = 'coin';
        break;
      case 'token-overview':
      default:
        bridgeButtonTestIdPrefix = 'token';
    }
    await this.driver.clickElement(
      LOCATOR.BRIDGE_BUTTON(bridgeButtonTestIdPrefix),
    );
  };

  navigateToAssetPage = async (symbol: string) => {
    await this.driver.clickElement({
      css: '[data-testid="multichain-token-list-button"]',
      text: symbol,
    });

    await this.driver.delay(2000);
    assert.ok((await this.driver.getCurrentUrl()).includes('asset'));
  };

  addNetwork = async () => {
    await this.driver.delay(2000);

    await this.driver.clickElement('[data-testid="network-display"]');
    await clickNestedButton(this.driver, 'Add network');
    await this.driver.clickElement('[data-testid="add-network-Arbitrum One"]');
    await clickNestedButton(this.driver, 'Approve');
    await this.driver.clickElement({
      tag: 'h6',
      text: 'Dismiss',
    });
  };

  selectNetwork = async (prefix: 'from' | 'to', networkNickname: string) => {
    await this.driver.clickElement(LOCATOR.BRIDGE_ASSET_PICKER(prefix));
    await this.driver.clickElement(LOCATOR.ASSET_PICKER_NETWORK);
    await clickNestedButton(this.driver, networkNickname);
  };

  selectToken = async (symbol: string) => {
    await this.driver.fill(LOCATOR.ASSET_PICKER_SEARCH, symbol);
    await this.driver.clickElement(LOCATOR.ASSET_PICKER_ITEM(symbol));
  };

  changeTokenAmount = async (charInputs: (string | keyof typeof Key)[]) => {
    charInputs.forEach(async (char) => {
      if (typeof char === 'string') {
        await this.driver.fill(LOCATOR.BRIDGE_FROM_AMOUNT, char);
      } else {
        await (
          await this.driver.findElement(LOCATOR.BRIDGE_FROM_AMOUNT)
        ).sendKeys(char);
      }
    });
    await this.driver.clickPoint(LOCATOR.BRIDGE_FROM_AMOUNT, 10, 10);
  };

  verifyDestTokenNotInList = async (symbol: string) => {
    await this.driver.fill(LOCATOR.ASSET_PICKER_SEARCH, symbol);
    await this.driver.assertElementNotPresent(
      LOCATOR.ASSET_PICKER_ITEM(symbol),
    );
  };

  verifySelectedInputs = async (
    _fromNetwork: string,
    fromSymbol = '',
    fromAmount = '',
    _toNetwork = '',
    toSymbol = 'Select token',
    toAmount = '0',
  ) => {
    // TODO verify fromNetwork
    // TODO verify fiat value
    await this.driver.findElement({
      css: LOCATOR.BRIDGE_ASSET_PICKER('from'),
      text: fromSymbol,
    });
    await this.driver.waitForSelector({
      xpath: `//input[@value='${fromAmount}']`,
      css: LOCATOR.BRIDGE_FROM_AMOUNT,
    });

    // TODO verify toNetwork
    // TODO verify fiat value
    await this.driver.findElement({
      css: LOCATOR.BRIDGE_ASSET_PICKER('to'),
      text: toSymbol,
    });
    await this.driver.waitForSelector({
      xpath: `//input[@value='${toAmount}']`,
      css: LOCATOR.BRIDGE_TO_AMOUNT,
    });
  };

  verifyPortfolioTab = async (expectedHandleCount: number) => {
    // await this.driver.waitUntilXWindowHandles(_handleCount);
    await this.driver.delay(2000);
    await this.driver.switchToWindowWithTitle('MetaMask Portfolio - Bridge');
    assert.equal(
      (await this.driver.getAllWindowHandles()).length,
      IS_FIREFOX || !isManifestV3
        ? expectedHandleCount
        : expectedHandleCount + 1,
    );
    assert.match(
      await this.driver.getCurrentUrl(),
      /^https:\/\/portfolio\.metamask\.io\/bridge/u,
    );
  };

  verifySwapPage = async (expectedHandleCount: number) => {
    await this.driver.delay(4000);
    assert.equal(
      (await this.driver.getAllWindowHandles()).length,
      IS_FIREFOX || !isManifestV3
        ? expectedHandleCount
        : expectedHandleCount + 1,
    );
    assert.match(await this.driver.getCurrentUrl(), /.+cross-chain\/swaps/u);
  };
}

const mockServer =
  (featureFlagOverrides: Partial<FeatureFlagResponse>) =>
  async (mockServer_: Mockttp) => {
    const featureFlagMocks = [
      `${BRIDGE_DEV_API_BASE_URL}/getAllFeatureFlags`,
      `${BRIDGE_PROD_API_BASE_URL}/getAllFeatureFlags`,
    ].map(
      async (url) =>
        await mockServer_
          .forGet(url)
          .withHeaders({ 'X-Client-Id': BRIDGE_CLIENT_ID })
          .always()
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                ...DEFAULT_FEATURE_FLAGS_RESPONSE,
                ...featureFlagOverrides,
              },
            };
          }),
    );
    const portfolioMock = async () =>
      await mockServer_
        .forGet('https://portfolio.metamask.io/bridge')
        .always()
        .thenCallback(() => {
          return {
            statusCode: 200,
            json: {},
          };
        });
    return Promise.all([...featureFlagMocks, portfolioMock]);
  };

export const getBridgeFixtures = (
  title?: string,
  featureFlags: Partial<FeatureFlagResponse> = {},
  withErc20: boolean = true,
) => {
  const fixtureBuilder = new FixtureBuilder({
    inputChainId: CHAIN_IDS.MAINNET,
  })
    .withNetworkControllerOnMainnet()
    .withPreferencesController({
      preferences: { showFiatInTestnets: true },
    })
    .withCurrencyController(MOCK_CURRENCY_RATES)
    .withBridgeControllerDefaultState();

  if (withErc20) {
    fixtureBuilder.withTokensControllerERC20({ chainId: 1 });
  }

  return {
    driverOptions: {
      // openDevToolsForTabs: true,
    },
    fixtures: fixtureBuilder.build(),
    testSpecificMock: mockServer(featureFlags),
    smartContract: SMART_CONTRACTS.HST,
    ethConversionInUsd: ETH_CONVERSION_RATE_USD,
    ganacheOptions: generateGanacheOptions({
      hardfork: 'london',
      chain: { chainId: CHAIN_IDS.MAINNET },
      concurrent: [{ port: 8546, chainId: CHAIN_IDS.ARBITRUM }],
    }),
    title,
  };
};
