import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import NetworkManager from '../../page-objects/pages/network-manager';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import {
  mockTronSwapApis,
  mockTronSwapApisNoQuotes,
  TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE,
} from './mocks/common-tron';

describe('Swap on Tron', function () {
  it('Quote displayed between TRX and TRC20', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronSwapApis,
        ignoredConsoleErrors: [
          `Failed to send transaction: ${TRON_MOCK_TRANSACTION_EXPIRATION_MESSAGE}`,
        ],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '6.07' });

        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });

        // Review quote - mock returns ~0.295 USDT for 1 TRX
        await swapPage.reviewQuote({
          swapToAmount: '0.295',
          swapFrom: 'TRX',
          swapTo: 'USDT',
          swapFromAmount: '1',
        });
      },
    );
  });

  it('No quotes available for the pair', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronSwapApisNoQuotes,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '6.07' });

        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDT',
          swapFrom: 'TRX',
          network: 'Tron',
        });

        // Verify no quotes available message
        await swapPage.checkNoQuotesAvailable();
      },
    );
  });
});
