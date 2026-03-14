import { Suite } from 'mocha';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withProductionFixtures } from '../../helpers/prod-with-fixtures';
import { PROD_DELAYS } from '../../helpers/prod-test-helpers';
import { loginWithoutBalanceValidation } from '../../../page-objects/flows/login.flow';
import { switchToEditRPCViaGlobalMenuNetworks } from '../../../page-objects/flows/network.flow';
import HomePage from '../../../page-objects/pages/home/homepage';
import SelectNetwork from '../../../page-objects/pages/dialog/select-network';
import AddEditNetworkModal from '../../../page-objects/pages/dialog/add-edit-network';
import AddNetworkRpcUrlModal from '../../../page-objects/pages/dialog/add-network-rpc-url';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import SendPage from '../../../page-objects/pages/send/send-page';
import SendTokenConfirmPage from '../../../page-objects/pages/send/send-token-confirmation-page';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import { Driver } from '../../../webdriver/driver';
// import { CHAIN_IDS } from '../../../../../shared/constants/network';

/**
 * Production E2E Test: Add Etherlink Network, Import Account, and Send XTZ
 *
 * This test validates MetaMask's ability to:
 * 1. Add Etherlink network (Chain ID: 42793) via UI using "Add Custom Network" flow
 * 2. Import an account using a private key
 * 3. Send native XTZ tokens on Etherlink network
 *
 * Network: Etherlink Mainnet (Chain ID: 42793 / 0xa729)
 * RPC: https://node.mainnet.etherlink.com
 * Currency: XTZ
 *
 * This test uses REAL network infrastructure with production RPC endpoints.
 */
describe('Production E2E: Add Etherlink Network, Import Account and Send XTZ', function (this: Suite) {
  this.timeout(300000); // 5 minutes for network operations and send

  it('adds Etherlink network, imports account with private key, and sends XTZ', async function () {
    await withProductionFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet() // Start with Mainnet instead of localhost
          // .withEnabledNetworks({
          //   eip155: {
          //     [CHAIN_IDS.MAINNET]: true,
          //     [CHAIN_IDS.LINEA_MAINNET]: true,
          //     [CHAIN_IDS.BASE]: true,
          //   },
          // })
          .build(),
        title:
          this.test?.fullTitle() ||
          'Add Etherlink network, import account and send XTZ production test',
        extendedTimeoutMultiplier: 2,
      },
      async ({ driver }: { driver: Driver }) => {
        console.log(
          '[PROD TEST] Starting test - checking if wallet is already set up...',
        );

        // Debug: Check what page we're on
        const currentUrl = await driver.getCurrentUrl();
        console.log('[PROD TEST] Current URL:', currentUrl);

        // Check if we're on the onboarding page (which means fixture didn't load)
        const isOnboardingPage = currentUrl.includes('#onboarding');
        if (isOnboardingPage) {
          console.error('[PROD TEST] ❌ ERROR: Wallet is on onboarding page!');
          console.error(
            '[PROD TEST] This means the fixture did not load properly.',
          );
          console.error(
            '[PROD TEST] The wallet should already be set up with a vault.',
          );
          throw new Error(
            'Fixture did not load - wallet is on onboarding page',
          );
        }

        console.log('[PROD TEST] Logging in to wallet...');

        // Use loginWithBalanceValidation like the working token import test
        // This ensures the wallet is properly set up before proceeding
        await loginWithoutBalanceValidation(driver);

        // console.log('[PROD TEST] Waiting for home page to load...');
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await driver.delay(PROD_DELAYS.API_RESPONSE); // Wait for network to stabilize

        // Network details for Etherlink
        const chainId = 42793;
        const chainIdHex = '0xa729';
        const networkName = 'Etherlink Mainnet';
        const symbol = 'XTZ';
        const rpcUrl = 'https://node.mainnet.etherlink.com';
        const rpcName = 'Etherlink RPC';

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
        await addRpcUrlModal.fillAddRpcNameInput(rpcName);

        // Wait for RPC validation to complete
        console.log('[PROD TEST] Waiting for RPC validation...');
        await driver.delay(PROD_DELAYS.RPC_RESPONSE);

        await addRpcUrlModal.saveAddRpcUrl();

        console.log('[PROD TEST] Saving network...');
        await addEditNetworkModal.saveEditedNetwork();

        // Wait for network to be added and RPC to be validated
        console.log(
          '[PROD TEST] Waiting for network to be added and RPC to connect...',
        );
        await driver.delay(PROD_DELAYS.RPC_RESPONSE * 2); // Extra time for RPC connection

        console.log('[PROD TEST] Network added successfully!');
        console.log(
          '[PROD TEST] MetaMask automatically switched to Etherlink network',
        );

        // After adding network, MetaMask automatically switches to it
        // Wait for the home page to load with the new network
        await homePage.checkPageIsLoaded();
        await driver.delay(PROD_DELAYS.API_RESPONSE);

        console.log('[PROD TEST] Verifying we are on Etherlink network...');

        // Import account with private key
        // NOTE: These values are loaded from .metamaskrc environment variables
        // const testPrivateKey = process.env.TEST_ACCOUNT_PRIVATE_KEY || '';
        // const recipientAddress = process.env.TEST_RECIPIENT_ADDRESS || '';

        const testPrivateKey = 'cd94ca4e3720';
        const testPrivateKey1 = 'eba207d32bf13';
        const recipientAddress = '0x6E1684784BE1bDfAbb13800F91b4F80a0afE3070';

        // if (!testPrivateKey || !recipientAddress) {
        //   throw new Error(
        //     'TEST_ACCOUNT_PRIVATE_KEY and TEST_RECIPIENT_ADDRESS must be set in .metamaskrc',
        //   );
        // }

        console.log('[PROD TEST] Opening account list to import account...');
        // This opens the account list modal/popover (not a full page navigation)
        await homePage.headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        console.log('[PROD TEST] Waiting for account list page to load...');
        await accountListPage.checkPageIsLoaded();

        console.log('[PROD TEST] Importing account with private key...');
        // This handles the entire flow:
        // 1. Clicks "Add Wallet" button
        // 2. Selects "Import an account"
        // 3. Enters private key in #private-key-box
        // 4. Clicks Import button
        await accountListPage.addNewImportedAccount(testPrivateKey, undefined, {
          isMultichainAccountsState2Enabled: true,
        });

        console.log('[PROD TEST] Account imported successfully!');
        console.log('[PROD TEST] Closing account list modal...');
        await accountListPage.closeMultichainAccountsPage();

        // Wait for account to be imported and balance to load
        await driver.delay(PROD_DELAYS.API_RESPONSE * 2);

        // Verify we're on Etherlink network
        console.log('[PROD TEST] Verifying network...');
        await homePage.checkPageIsLoaded();

        // Start send flow
        console.log('[PROD TEST] Starting send flow...');
        await homePage.startSendFlow();

        const sendPage = new SendPage(driver);
        await sendPage.checkPageIsLoaded();

        // Select XTZ token
        console.log('[PROD TEST] Selecting XTZ token...');
        await sendPage.selectToken(chainIdHex, symbol);

        // Fill recipient address
        console.log('[PROD TEST] Filling recipient address:', recipientAddress);
        await sendPage.fillRecipient(recipientAddress);

        // Fill amount (sending 0.001 XTZ as a test)
        const sendAmount = '0.000001';
        console.log(`[PROD TEST] Filling amount: ${sendAmount} XTZ`);
        await sendPage.fillAmount(sendAmount);

        // Continue to confirmation
        console.log('[PROD TEST] Proceeding to confirmation...');
        await sendPage.pressContinueButton();

        // Confirm transaction
        const sendTokenConfirmPage = new SendTokenConfirmPage(driver);
        await sendTokenConfirmPage.checkPageIsLoaded();

        console.log('[PROD TEST] Confirming transaction...');
        await sendTokenConfirmPage.clickOnConfirm();

        // Wait for transaction to be submitted
        await driver.delay(PROD_DELAYS.RPC_RESPONSE);

        // Verify transaction in activity list
        console.log('[PROD TEST] Verifying transaction in activity list...');
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkTransactionActivityByText('Sent');

        console.log('[PROD TEST] ✅ Transaction sent successfully!');
        console.log(
          `[PROD TEST] Sent ${sendAmount} XTZ to ${recipientAddress} on Etherlink network`,
        );

        console.log('[PROD TEST] Opening account list to import account...');
        // This opens the account list modal/popover (not a full page navigation)
        await homePage.headerNavbar.openAccountMenu();

        // const accountListPage = new AccountListPage(driver);
        // console.log('[PROD TEST] Waiting for account list page to load...');
        await accountListPage.checkPageIsLoaded();

        console.log('[PROD TEST] Importing account 2 with private key...');
        // This handles the entire flow:
        // 1. Clicks "Add Wallet" button
        // 2. Selects "Import an account"
        // 3. Enters private key in #private-key-box
        // 4. Clicks Import button
        await accountListPage.addNewImportedAccount(
          testPrivateKey1,
          undefined,
          {
            isMultichainAccountsState2Enabled: true,
          },
        );

        console.log('[PROD TEST] Account 2 imported successfully!');
        console.log('[PROD TEST] Closing account list modal...');
        await accountListPage.closeMultichainAccountsPage();

        // Wait for account to be imported and balance to load
        await driver.delay(PROD_DELAYS.API_RESPONSE * 2);

        // Verify we're on Etherlink network
        console.log('[PROD TEST] Verifying network...');
        await homePage.checkPageIsLoaded();

        // Step: Click on native token to view activity
        console.log(
          '[PROD TEST] Clicking on native XTZ token to view activity...',
        );
        await driver.clickElement({
          css: '[data-testid="multichain-token-list-button"]',
          text: symbol, // XTZ
        });
        await driver.delay(2000);

        // Navigate to "Your activity" section
        console.log('[PROD TEST] Navigating to Your activity section...');
        const activityListPage2 = new ActivityListPage(driver);
        await driver.delay(1000);

        // Verify "Received" entry is displayed
        console.log(
          '[PROD TEST] Verifying "Received" transaction is displayed...',
        );
        try {
          await activityListPage2.checkTransactionActivityByText('Received');
          console.log(
            '[PROD TEST] ✅ "Received" transaction found in activity list!',
          );
        } catch (error) {
          console.error(
            '[PROD TEST] ❌ FAILURE: "Received" transaction NOT found in activity list!',
          );
          console.error('[PROD TEST] Error:', error);
          throw new Error(
            'Received transaction not found in activity list - Test Failed!',
          );
        }

        console.log('[PROD TEST] ✅ All verifications passed!');
        console.log(
          `[PROD TEST] Successfully verified received transaction on Etherlink network`,
        );
      },
    );
  });
});
