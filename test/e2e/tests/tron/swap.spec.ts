import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import NetworkManager from '../../page-objects/pages/network-manager';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import {
  mockTronSwapApis,
  mockTronSwapApisNoQuotes,
} from './mocks/common-tron';

// Tron chainId for bridge/swap config
const TRON_BRIDGE_CHAIN_ID = '728126428';

const bridgeConfig = {
  refreshRate: 30000,
  maxRefreshCount: 5,
  support: true,
  minimumVersion: '0.0.0',
  chains: {
    '1': { isActiveSrc: true, isActiveDest: true },
    '42161': { isActiveSrc: true, isActiveDest: true },
    '59144': { isActiveSrc: true, isActiveDest: true },
    [TRON_BRIDGE_CHAIN_ID]: {
      isActiveSrc: true,
      isActiveDest: true,
    },
  },
  chainRanking: [
    { chainId: 'eip155:1', name: 'Ethereum' },
    { chainId: 'eip155:42161', name: 'Arbitrum' },
    { chainId: 'eip155:59144', name: 'Linea' },
    { chainId: formatChainIdToCaip(TRON_BRIDGE_CHAIN_ID), name: 'Tron' },
  ],
};

describe('Swap on Tron', function () {
  it('Quote displayed between TRX and TRC20', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronSwapApis,
        manifestFlags: {
          remoteFeatureFlags: {
            tronAccounts: { enabled: true, minimumVersion: '13.6.0' },
            bridgeConfig,
          },
        },
        // TODO: Fix error, cause is unknown
        ignoredConsoleErrors: ['Failed to send transaction: undefined'],
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '6.07' });

        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSolanaSwap({
          amount: 1,
          swapTo: 'USDT',
          swapFrom: 'TRX',
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
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronSwapApisNoQuotes,
        manifestFlags: {
          remoteFeatureFlags: {
            tronAccounts: { enabled: true, minimumVersion: '13.6.0' },
            bridgeConfig,
          },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '6.07' });

        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSolanaSwap({
          amount: 1,
          swapTo: 'USDT',
          swapFrom: 'TRX',
        });

        // Verify no quotes available message
        await swapPage.checkNoQuotesAvailable();
      },
    );
  });
});
