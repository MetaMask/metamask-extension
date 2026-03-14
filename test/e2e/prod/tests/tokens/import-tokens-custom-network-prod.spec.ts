import { Suite } from 'mocha';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withProductionFixtures } from '../../helpers/prod-with-fixtures';
import { PROD_DELAYS } from '../../helpers/prod-test-helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import { switchToEditRPCViaGlobalMenuNetworks } from '../../../page-objects/flows/network.flow';
import HomePage from '../../../page-objects/pages/home/homepage';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import SelectNetwork from '../../../page-objects/pages/dialog/select-network';
import AddEditNetworkModal from '../../../page-objects/pages/dialog/add-edit-network';
import AddNetworkRpcUrlModal from '../../../page-objects/pages/dialog/add-network-rpc-url';

/**
 * Production E2E Test: Add Custom Network and Import Tokens
 *
 * This test validates MetaMask's ability to:
 * 1. Add a custom network (Sepolia Testnet) via UI using "Add Custom Network" flow
 * 2. Verify the network was added successfully
 * 3. Import tokens on that custom network using real contract addresses
 *
 * Network: Sepolia Testnet (Chain ID: 11155111)
 * RPC: Real Sepolia RPC via Infura or public RPC
 * Tokens: Real LINK token on Sepolia
 *
 * This test uses REAL network infrastructure and follows the exact same flow
 * as test/e2e/tests/network/custom-rpc-history.spec.ts but with a real network.
 */
describe('Production E2E: Add Custom Network and Import Tokens', function (this: Suite) {
  this.timeout(180000); // 3 minutes for network operations

  it('adds Sepolia testnet as custom network and imports tokens', async function () {
    await withProductionFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet() // Start with Mainnet instead of localhost
          .build(),
        title:
          this.test?.fullTitle() ||
          'Add custom network and import tokens production test',
        extendedTimeoutMultiplier: 2,
      },
      async ({ driver }) => {
        console.log('[PROD TEST] Logging in to wallet...');
        await loginWithoutBalanceValidation(driver);

        console.log('[PROD TEST] Waiting for home page to load...');
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await driver.delay(PROD_DELAYS.API_RESPONSE); // Wait for network to stabilize

        // Network details for Sepolia testnet
        const chainId = 11155111;
        const networkName = 'Sepolia Testnet';
        const symbol = 'ETH';
        const rpcUrl = process.env.INFURA_PROJECT_ID
          ? `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
          : 'https://rpc.sepolia.org'; // Fallback to public RPC

        console.log('[PROD TEST] Opening network selection dialog...');
        await switchToEditRPCViaGlobalMenuNetworks(driver);

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();

        console.log('[PROD TEST] Opening Add Custom Network modal...');
        await selectNetworkDialog.openAddCustomNetworkModal();

        console.log('[PROD TEST] Filling network details...');
        const addEditNetworkModal = new AddEditNetworkModal(driver);
        await addEditNetworkModal.checkPageIsLoaded();
        await addEditNetworkModal.fillNetworkNameInputField(networkName);
        await addEditNetworkModal.fillNetworkChainIdInputField(
          chainId.toString(),
        );
        await addEditNetworkModal.fillCurrencySymbolInputField(symbol);
        await addEditNetworkModal.openAddRpcUrlModal();

        console.log('[PROD TEST] Adding RPC URL:', rpcUrl);
        const addRpcUrlModal = new AddNetworkRpcUrlModal(driver);
        await addRpcUrlModal.checkPageIsLoaded();
        await addRpcUrlModal.fillAddRpcUrlInput(rpcUrl);
        await addRpcUrlModal.fillAddRpcNameInput('Sepolia RPC');
        await addRpcUrlModal.saveAddRpcUrl();

        console.log('[PROD TEST] Saving network...');
        await addEditNetworkModal.saveEditedNetwork();

        // Wait for network to be added
        console.log('[PROD TEST] Waiting for network to be added...');
        await driver.delay(PROD_DELAYS.API_RESPONSE);

        // Validate the network was added
        const homepage = new HomePage(driver);
        await homepage.checkPageIsLoaded();
        await homepage.checkAddNetworkMessageIsDisplayed(networkName);

        console.log('[PROD TEST] Custom network added successfully!');
        console.log('[PROD TEST] Importing tokens on Sepolia...');

        const assetListPage = new AssetListPage(driver);

        // Import LINK token on Sepolia: 0x779877A7B0D9E8603169DdbD7836e478b4624789
        console.log('[PROD TEST] Importing LINK token on Sepolia...');
        await assetListPage.importCustomTokenByChain(
          '0xaa36a7', // Sepolia chain ID in hex
          '0x779877A7B0D9E8603169DdbD7836e478b4624789', // LINK on Sepolia
        );

        // Wait for token to be imported
        await driver.delay(PROD_DELAYS.TOKEN_BALANCE_UPDATE);

        console.log('[PROD TEST] Verifying imported tokens...');
        const tokenList = new AssetListPage(driver);

        // Debug: Print what tokens are actually in the list
        const actualTokens = await tokenList.getTokenListNames();
        console.log('[PROD TEST] Tokens currently in list:', actualTokens);

        // Verify tokens were imported (ETH + LINK)
        console.log('[PROD TEST] Checking token count...');
        await tokenList.checkTokenItemNumber(2);

        console.log('[PROD TEST] Checking for ETH...');
        await tokenList.checkTokenExistsInList('Ether');

        console.log('[PROD TEST] Checking for LINK...');
        await tokenList.checkTokenExistsInList('LINK');

        console.log(
          '[PROD TEST] Custom network and token import validation successful!',
        );
      },
    );
  });
});
