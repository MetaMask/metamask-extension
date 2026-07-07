import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_BALANCE } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import BitcoinAssetDetailsPage from '../../page-objects/pages/asset/bitcoin-asset-details';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  mockBtcSpotPrices,
  mockCurrencyExchangeRates,
  mockEmptyInitialFullScan,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from './mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from './mocks/min-api';

async function buildBtcAssetsBaseMocks(mockServer: Mockttp) {
  return [
    await mockExchangeRates(mockServer),
    await mockCurrencyExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockSolanaSpotPrices(mockServer),
    await mockSupportedVsCurrencies(mockServer),
    await mockPriceMulti(mockServer),
    await mockPriceMultiBtcAndSol(mockServer),
    await mockTokensV2SupportedNetworks(mockServer),
    await mockTokensV3Assets(mockServer),
    await mockBtcSpotPrices(mockServer),
  ];
}

async function mockBtcAssetsFunded(mockServer: Mockttp) {
  return [
    await mockInitialFullScan(mockServer),
    ...(await buildBtcAssetsBaseMocks(mockServer)),
  ];
}

async function mockBtcAssetsEmpty(mockServer: Mockttp) {
  return [
    await mockEmptyInitialFullScan(mockServer),
    ...(await buildBtcAssetsBaseMocks(mockServer)),
  ];
}

describe('BTC Account - Assets', function (this: Suite) {
  this.timeout(180_000);

  it('BTC is the only asset and shows a 0 balance for an empty account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcAssetsEmpty,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        await homePage.checkPageIsLoaded();

        const tokensTab = new TokensTab(driver);
        await tokensTab.checkOnlyAssetsArePresent(['Bitcoin']);
        await tokensTab.checkTokenExistsInList('Bitcoin', '0 BTC');
        await tokensTab.checkTokenFiatAmountIsDisplayed('$');
        await tokensTab.checkConversionRateDisplayed();
        await tokensTab.checkSendAndSwapButtonsArePresentAndEnabled();
      },
    );
  });

  it('BTC asset list and details for a funded account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBtcAssetsFunded,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        await homePage.checkPageIsLoaded();

        const tokensTab = new TokensTab(driver);
        await tokensTab.checkTokenExistsInList(
          'Bitcoin',
          `${DEFAULT_BTC_BALANCE} BTC`,
        );
        await tokensTab.checkTokenFiatAmountIsDisplayed('$');
        await tokensTab.checkConversionRateDisplayed();
        await tokensTab.checkTokenAmountIsDisplayed(
          `${DEFAULT_BTC_BALANCE} BTC`,
        );
        await tokensTab.clickOnAsset('Bitcoin');

        const details = new BitcoinAssetDetailsPage(driver);
        await details.checkPageIsLoaded();
        await details.checkCurrentPriceHeader();
        await details.checkPriceChart();
        await details.checkActionButtons({
          swap: true,
          send: true,
          receive: true,
        });
        await details.checkAllStandardSections();
        await details.checkStakedBalanceIsAbsent();
      },
    );
  });
});
