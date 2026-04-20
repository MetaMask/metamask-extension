import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import { withProductionFixtures } from '../../helpers/prod-with-fixtures';
import { PROD_DELAYS } from '../../helpers/prod-test-helpers';

/**
 * Production E2E Test: Import Tokens
 *
 * This test validates token import functionality using REAL blockchain networks
 * and REAL external services (token APIs, price feeds, etc.).
 *
 * Key differences from standard E2E test:
 * - Uses real Ethereum Mainnet via Infura
 * - Uses real token API (token.api.cx.metamask.io)
 * - Uses real price API (price.api.cx.metamask.io)
 * - No mocked token data
 * - Slower execution due to real network calls
 *
 * Prerequisites:
 * - Valid INFURA_PROJECT_ID in .metamaskrc
 * - Network connectivity to Ethereum Mainnet
 * - Access to MetaMask token/price APIs
 */
describe('Production E2E: Import Tokens', function () {
  // Increase timeout for real network operations
  this.timeout(120000);

  it.only('imports real tokens from Ethereum Mainnet using token search', async function () {
    await withProductionFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet() // Uses real Infura Mainnet RPC
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
              [CHAIN_IDS.LINEA_MAINNET]: true,
              [CHAIN_IDS.BASE]: true,
            },
          })
          .build(),
        title: this.test?.fullTitle() || 'Import tokens production test',
        extendedTimeoutMultiplier: 2, // Double timeout for network operations
      },
      async ({ driver }) => {
        console.log('[PROD TEST] Logging in to wallet...');

        // Login - balance will be $0.00 since we're on real mainnet with no funds
        await loginWithBalanceValidation(driver, undefined, undefined, '$0.00');

        console.log('[PROD TEST] Navigating to home page...');
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        console.log('[PROD TEST] Searching for real tokens on Mainnet...');
        const assetListPage = new AssetListPage(driver);

        // Search for well-known ERC20 tokens that exist on Mainnet
        // These will be fetched from the REAL token API
        const tokensToImport = [
          'USDT', // Tether USD - 0xdac17f958d2ee523a2206206994597c13d831ec7
          'USDC', // USD Coin - 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
          'DAI', // Dai Stablecoin - 0x6b175474e89094c44da98b954eedeac495271d0f
        ];

        console.log(
          `[PROD TEST] Importing tokens: ${tokensToImport.join(', ')}`,
        );

        // Import tokens - this will make REAL API calls to:
        // - token.api.cx.metamask.io/tokens/1 (for token list)
        // - price.api.cx.metamask.io/v3/spot-prices (for prices)
        console.log('[PROD TEST] Starting token import...');
        await assetListPage.importMultipleTokensBySearch(tokensToImport);

        // Wait for token data to load from real APIs
        console.log('[PROD TEST] Waiting for token data to load from APIs...');
        await driver.delay(PROD_DELAYS.TOKEN_BALANCE_UPDATE);

        console.log('[PROD TEST] Verifying imported tokens...');
        const tokenList = new AssetListPage(driver);

        // Debug: Print what tokens are actually in the list
        const actualTokens = await tokenList.getTokenListNames();
        console.log('[PROD TEST] Tokens currently in list:', actualTokens);

        // Verify tokens were imported
        // Native tokens: Ethereum ETH, Linea ETH, Base ETH
        // ERC20 tokens: USDT, USDC, DAI
        console.log('[PROD TEST] Checking token count...');
        await tokenList.checkTokenItemNumber(6);

        // Check native token
        console.log('[PROD TEST] Checking for Ether...');
        await tokenList.checkTokenExistsInList('Ether');

        // Check imported ERC20 tokens
        // Note: Token list shows different formats for different tokens:
        // - Tether USD (full name)
        // - USDC (symbol only)
        // - Dai Stablecoin (full name)
        console.log('[PROD TEST] Checking for Tether USD...');
        await tokenList.checkTokenExistsInList('Tether');
        console.log('[PROD TEST] Checking for USDC...');
        await tokenList.checkTokenExistsInList('USDC');
        console.log('[PROD TEST] Checking for Dai Stablecoin...');
        await tokenList.checkTokenExistsInList('Dai');

        console.log('[PROD TEST] Token import validation successful!');
      },
    );
  });

  it('imports token by contract address from real Ethereum Mainnet', async function () {
    await withProductionFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet() // Real Mainnet
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
              [CHAIN_IDS.LINEA_MAINNET]: true,
              [CHAIN_IDS.BASE]: true,
            },
          })
          .build(),
        title:
          this.test?.fullTitle() || 'Import token by address production test',
        extendedTimeoutMultiplier: 2,
      },
      async ({ driver }) => {
        console.log('[PROD TEST] Logging in to wallet...');
        await loginWithBalanceValidation(driver, undefined, undefined, '$0.00');

        console.log('[PROD TEST] Navigating to home page...');
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        const assetListPage = new AssetListPage(driver);

        // Import LINK token by its real contract address
        // This will make a REAL RPC call to Mainnet to fetch token metadata
        const linkTokenAddress = '0x514910771af9ca656af840dff83e8264ecf986ca';

        console.log(
          `[PROD TEST] Importing LINK token by address: ${linkTokenAddress}`,
        );

        await assetListPage.importCustomTokenByChain(
          CHAIN_IDS.MAINNET,
          linkTokenAddress,
        );

        // Wait for RPC response with token metadata
        console.log('[PROD TEST] Waiting for token metadata from RPC...');
        await driver.delay(PROD_DELAYS.RPC_RESPONSE);

        console.log('[PROD TEST] Verifying imported token...');
        const tokenList = new AssetListPage(driver);

        // Native tokens: Ethereum ETH, Linea ETH, Base ETH
        // ERC20 tokens: LINK
        await tokenList.checkTokenItemNumber(4);

        await tokenList.checkTokenExistsInList('Ether');
        await tokenList.checkTokenExistsInList('LINK');

        console.log('[PROD TEST] Token import by address successful!');
      },
    );
  });
});
