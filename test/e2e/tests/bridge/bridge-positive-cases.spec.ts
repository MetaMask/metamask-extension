import { Suite } from 'mocha';
import { veryLargeDelayMs, withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import NetworkManager from '../../page-objects/pages/network-manager';
import TokenOverviewPage from '../../page-objects/pages/token-overview-page';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from './constants';
import {
  bridgeTransaction,
  checkQuoteRequestsAreNotMadeAfterTimestamp,
  getBridgeFixtures,
} from './bridge-test-utils';

describe('Bridge tests', function (this: Suite) {
  this.timeout(160000); // This test is very long, so we need an unusually high timeout
  it('Execute multiple bridge transactions', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        false,
      ),
      async ({ driver }) => {
        // the balance has been fixed now , we show native balance when currency controller is set
        await login(driver, { expectedBalance: '$225,730.11' });

        const homePage = new HomePage(driver);
        await bridgeTransaction({
          driver,
          quote: {
            amount: '25',
            tokenFrom: 'DAI',
            tokenTo: 'ETH',
            fromChain: 'Ethereum',
            toChain: 'Linea',
            unapproved: true,
          },
          expectedTransactionsCount: 2,
          expectedDestAmount: '0.0157',
        });

        await bridgeTransaction({
          driver,
          quote: {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'USDC',
            fromChain: 'Ethereum',
            toChain: 'Arbitrum',
          },
          expectedTransactionsCount: 3,
          expectedDestAmount: '1,642',
        });
        await bridgeTransaction({
          driver,
          quote: {
            amount: '1',
            tokenFrom: 'ETH',
            tokenTo: 'ETH',
            fromChain: 'Ethereum',
            toChain: 'Linea',
          },
          expectedTransactionsCount: 4,
          expectedDestAmount: '0.991',
        });

        await homePage.checkPageIsLoaded();
        await homePage.goToTokensTab();
        await homePage.goToActivityList();

        await bridgeTransaction({
          driver,
          quote: {
            amount: '10',
            tokenFrom: 'USDC',
            tokenTo: 'DAI',
            fromChain: 'Ethereum',
            toChain: 'Linea',
            unapproved: true,
          },
          expectedTransactionsCount: 6,
          expectedDestAmount: '9.9',
        });
      },
    );
  });

  it('Execute bridge transactions on non enabled networks', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        false,
      ),
      async ({ driver, mockedEndpoint }) => {
        await login(driver, { expectedBalance: '$225,730.11' });
        const networkManager = new NetworkManager(driver);

        // Navigate to Bridge page
        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.enterBridgeQuote({
          amount: '25',
          tokenFrom: 'ETH',
          tokenTo: 'DAI',
          fromChain: 'Linea',
          toChain: 'Ethereum',
        });
        const finalQuoteRequestTimestamp = Date.now();

        await bridgePage.goBack();
        await checkQuoteRequestsAreNotMadeAfterTimestamp(
          driver,
          finalQuoteRequestTimestamp,
          mockedEndpoint,
        );

        // check if the Linea network is selected
        await networkManager.openNetworkManager();
        await driver.delay(veryLargeDelayMs);

        await networkManager.checkAllPopularNetworksIsSelected();
      },
    );
  });

  it('updates recommended bridge quote incrementally when SSE events are received', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        false,
      ),
      async ({ driver, mockedEndpoint }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.goToTokensTab();
        await homePage.goToActivityList();

        await bridgeTransaction({
          driver,
          quote: {
            amount: '10',
            tokenFrom: 'USDC',
            tokenTo: 'DAI',
            fromChain: 'Ethereum',
            toChain: 'Linea',
            unapproved: true,
          },
          expectedTransactionsCount: 2,
          expectedDestAmount: '9.9',
        });
        const finalQuoteRequestTimestamp = Date.now();
        const bridgePage = new BridgeQuotePage(driver);
        await checkQuoteRequestsAreNotMadeAfterTimestamp(
          driver,
          finalQuoteRequestTimestamp,
          mockedEndpoint,
        );

        console.log('Navigating back to Swap page');
        await homePage.startSwapFlow();
        await bridgePage.checkAssetsAreSelected('ETH', 'mUSD');
        console.log('Checked that assets have been reset to defaults');
      },
    );
  });

  it('Preserves bridge state when navigating from the source asset page', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        false,
      ),
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

        // Navigate to Bridge page
        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();
        const bridgePage = new BridgeQuotePage(driver);

        console.log('Checking that source asset is selected');
        await bridgePage.goToAssetPage(
          'DAI',
          '0x1',
          '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        );

        const tokenOverviewPage = new TokenOverviewPage(driver);
        await tokenOverviewPage.clickSwap();
        console.log('Clicked Swap button from source asset page');
        await bridgePage.checkAssetsAreSelected('DAI', 'mUSD');
      },
    );
  });

  it('Preserves bridge state when navigating from the dest asset page', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        false,
      ),
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

        // Navigate to Bridge page
        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();
        const bridgePage = new BridgeQuotePage(driver);

        await (await bridgePage.searchForAsset('DAI')).click();
        console.log('Selected source asset DAI');

        const tokenOverviewPage = new TokenOverviewPage(driver);
        console.log('Checking that dest asset is selected');
        await bridgePage.goToAssetPage(
          'USDC',
          '0xe708',
          '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
          bridgePage.destinationAssetPickerButton,
        );
        await tokenOverviewPage.clickSwap();
        console.log('Clicked Swap button from dest asset page');
        await bridgePage.checkAssetsAreSelected('DAI', 'USDC');
      },
    );
  });

  it('Preserves bridge state when navigating back from the asset page', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        false,
      ),
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

        // Navigate to Bridge page
        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();
        const bridgePage = new BridgeQuotePage(driver);

        const tokenOverviewPage = new TokenOverviewPage(driver);

        const srcAssetElement = await bridgePage.searchForAsset('mUSD');
        await srcAssetElement.click();
        console.log('Selected source asset mUSD');

        console.log('Checking that asset picker is visible');
        await bridgePage.goToAssetPage(
          'USDC',
          '0xe708',
          '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
          bridgePage.destinationAssetPickerButton,
        );
        await tokenOverviewPage.clickBack();
        console.log('Navigated back to Swap page from asset page');

        await bridgePage.checkAssetPickerModalIsReopened();
        await bridgePage.checkAssetsAreSelected('mUSD', 'ETH');
      },
    );
  });

  it('Resets bridge state when reopening the page', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
        false,
      ),
      async ({ driver }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

        // Navigate to Bridge page
        const homePage = new HomePage(driver);
        await homePage.startSwapFlow();
        const bridgePage = new BridgeQuotePage(driver);

        const tokenOverviewPage = new TokenOverviewPage(driver);

        await (await bridgePage.searchForAsset('DAI')).click();
        console.log('Selected source asset DAI');

        await (
          await bridgePage.searchForAsset(
            'USDC',
            bridgePage.destinationAssetPickerButton,
          )
        ).click();
        console.log('Selected dest asset USDC');

        await bridgePage.goToAssetPage(
          'DAI',
          '0x1',
          '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          bridgePage.destinationAssetPickerButton,
        );
        await tokenOverviewPage.clickBack();

        await bridgePage.checkAssetPickerModalIsReopened();
        await bridgePage.checkAssetsAreSelected('DAI', 'USDC');

        console.log(
          'Checking that selected assets are reset after reopening Swap page',
        );
        await bridgePage.goBack();
        await homePage.startSwapFlow();
        await bridgePage.checkAssetsAreSelected('ETH', 'mUSD');
      },
    );
  });
});
