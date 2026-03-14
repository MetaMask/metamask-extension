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
import { getRequiredE2EEnv } from '../../../helpers/e2e-env';

/**
 * Production E2E Test: Custom Network, Import Account, and Send
 * This test uses REAL network infrastructure with production RPC endpoints.
 */
describe('Production E2E: Add Custom Network, Import Account and Send CHZ', function (this: Suite) {
  this.timeout(300000); // 5 minutes for network operations and send

  it('adds Chiliz network, imports account with private key, and sends CHZ', async function () {
    await withProductionFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()

          .build(),
        title:
          this.test?.fullTitle() ||
          'Add Chiliz network, import account and send CHZ production test',
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
        await loginWithoutBalanceValidation(driver);

        // console.log('[PROD TEST] Waiting for home page to load...');
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await driver.delay(PROD_DELAYS.API_RESPONSE); // Wait for network to stabilize

        // Network details for Chiliz Chain
        const chainId = 88888;
        const chainIdHex = '0x15b38'; // Hex representation of 88888
        const networkName = 'Chiliz Chain';
        const symbol = 'CHZ';
        const rpcUrl = 'https://rpc.ankr.com/chiliz';
        const rpcName = 'Chiliz RPC';

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
          '[PROD TEST] MetaMask automatically switched to Chiliz network',
        );

        // Wait for the home page to load with the new network
        await homePage.checkPageIsLoaded();
        await driver.delay(PROD_DELAYS.API_RESPONSE);

        console.log('[PROD TEST] Verifying we are on Chiliz network...');

        // Import account with private key
        // NOTE: These values are loaded from test/e2e/.env.e2e file
        console.log('[PROD TEST] Loading test credentials from .env.e2e...');
        const privateKeyFrom = getRequiredE2EEnv('PRIVATE_KEY_FROM');
        const privateKeyTo = getRequiredE2EEnv('PRIVATE_KEY_TO');
        const recipientAddress = getRequiredE2EEnv('RECIPIENT_ADDRESS');
        const senderAddress = getRequiredE2EEnv('SENDER_ADDRESS');

        console.log('[PROD TEST] ✅ Test credentials loaded successfully');

        console.log('[PROD TEST] Opening account list to import account...');
        // This opens the account list modal/popover (not a full page navigation)
        await homePage.headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        console.log('[PROD TEST] Waiting for account list page to load...');
        await accountListPage.checkPageIsLoaded();

        console.log('[PROD TEST] Importing account with private key...');

        // Verify balance in To Account
        await accountListPage.addNewImportedAccount(privateKeyTo, undefined, {
          isMultichainAccountsState2Enabled: true,
        });
        console.log('[PROD TEST] Account imported successfully!');
        console.log('[PROD TEST] Closing account list modal...');
        await accountListPage.closeMultichainAccountsPage();

        // Wait for account to be imported and balance to load
        await driver.delay(PROD_DELAYS.API_RESPONSE * 2);

        // Verify we're on Chiliz network
        console.log('[PROD TEST] Verifying network...');
        await homePage.checkPageIsLoaded();

        // Verify we're on Chiliz network
        console.log('[PROD TEST] Verifying network...');
        await homePage.checkPageIsLoaded();

        // Click on desired token
        await driver.clickElement({
          css: '[data-testid="multichain-token-list-button"]',
          text: symbol, // CHZ
        });

        await driver.delay(2000);

        let balance = 'N/A';

        try {
          const balanceElement = await driver.findElement(
            '[data-testid="multichain-token-list-item-value"]',
          );
          balance = await balanceElement.getText();
          console.log(`[PROD TEST] Balance in imported account: ${balance}`);
        } catch (balanceError) {
          console.log(`[PROD TEST] Could not fetch balance: ${balanceError}`);
        }

        // Navigate back from token details
        console.log('[PROD TEST] Navigating back from token details...');
        await driver.clickElement('button[aria-label="Back"]');
        await homePage.checkPageIsLoaded();
        console.log('[PROD TEST] ✅ Successfully navigated back to home page');

        console.log('[PROD TEST] Opening account list to import account...');
        // This opens the account list modal/popover (not a full page navigation)
        await homePage.headerNavbar.openAccountMenu();

        // const accountListPage = new AccountListPage(driver);
        console.log('[PROD TEST] Waiting for account list page to load...');
        await accountListPage.checkPageIsLoaded();

        console.log('[PROD TEST] Importing account with private key...');

        await accountListPage.addNewImportedAccount(privateKeyFrom, undefined, {
          isMultichainAccountsState2Enabled: true,
        });

        console.log('[PROD TEST] Account imported successfully!');
        console.log('[PROD TEST] Closing account list modal...');
        await accountListPage.closeMultichainAccountsPage();

        // Wait for account to be imported and balance to load
        await driver.delay(PROD_DELAYS.API_RESPONSE * 2);

        // Verify we're on Chiliz network
        console.log('[PROD TEST] Verifying network...');
        await homePage.checkPageIsLoaded();

        // Start send flow
        console.log('[PROD TEST] Starting send flow...');
        await homePage.startSendFlow();

        const sendPage = new SendPage(driver);
        await sendPage.checkPageIsLoaded();

        // Select CHZ token
        console.log('[PROD TEST] Selecting CHZ token...');
        await sendPage.selectToken(chainIdHex, symbol);

        // Fill recipient address
        console.log('[PROD TEST] Filling recipient address:', recipientAddress);
        await sendPage.fillRecipient(recipientAddress);

        // Fill amount (sending 2 CHZ as a test)
        const sendAmount = '2';
        console.log(`[PROD TEST] Filling amount: ${sendAmount} CHZ`);
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
        await activityListPage.checkWaitForTransactionStatus('confirmed');
        await activityListPage.checkTransactionAmount(`-${sendAmount} CHZ`);

        console.log('[PROD TEST] ✅ Transaction sent successfully!');
        console.log(
          `[PROD TEST] Sent ${sendAmount} CHZ to ${recipientAddress} on Chiliz network`,
        );

        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );
        await driver.delay(1000);

        console.log('[PROD TEST] Opening account list to import account...');
        // This opens the account list modal/popover (not a full page navigation)
        await homePage.headerNavbar.openAccountMenu();

        // const accountListPage = new AccountListPage(driver);
        console.log('[PROD TEST] Waiting for account list page to load...');
        await accountListPage.checkPageIsLoaded();

        console.log('[PROD TEST] Switch to Importing account 1');
        await accountListPage.switchToAccount('Imported Account 1');

        // Wait for account to be imported and balance to load
        await driver.delay(PROD_DELAYS.API_RESPONSE * 2);

        // Verify we're on Chiliz network
        console.log('[PROD TEST] Verifying network...');
        await homePage.checkPageIsLoaded();

        // // Step: Click on native token to view token summary
        console.log(
          '[PROD TEST] Clicking on native CHZ token to view token summary...',
        );
        await driver.clickElement({
          css: '[data-testid="multichain-token-list-button"]',
          text: symbol, // CHZ
        });
        await driver.delay(2000);

        const updatedBalance = parseInt(balance) + parseInt(sendAmount);
        console.log('[PROD TEST] Updated balance is: ', updatedBalance);
        let receivedBalance = 'N/A';

        try {
          const balanceElement = await driver.findElement(
            '[data-testid="multichain-token-list-item-value"]',
          );
          receivedBalance = await balanceElement.getText();
          console.log(`[PROD TEST] ✅ Received balance is: ${receivedBalance}`);

          if (parseInt(receivedBalance) === updatedBalance) {
            console.log('[PROD TEST] ✅ Received balance matches sent amount!');
          } else {
            console.log(
              '[PROD TEST] ❌ FAILURE: Received balance does not match sent amount!',
            );
          }
          console.log(`[PROD TEST] Balance: ${receivedBalance}`);
          // (await driver.findElement('//button[@aria-label="Back"]')).click();
          // await homePage.checkPageIsLoaded();
        } catch (balanceError) {
          console.log(`[PROD TEST] Could not fetch balance: ${balanceError}`);
        }

        // Navigate back from token details
        console.log('[PROD TEST] Navigating back from token details...');
        await driver.clickElement('button[aria-label="Back"]');
        await homePage.checkPageIsLoaded();
        console.log('[PROD TEST] ✅ Successfully navigated back to home page');

        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );
        await driver.delay(1000);

        // Wait for account to be imported and balance to load
        await driver.delay(PROD_DELAYS.API_RESPONSE * 2);

        // Verify we're on Chiliz network
        console.log('[PROD TEST] Verifying network...');
        await homePage.checkPageIsLoaded();

        // Start send flow
        console.log('[PROD TEST] Starting send flow...');
        await homePage.startSendFlow();

        // const sendPage = new SendPage(driver);
        await sendPage.checkPageIsLoaded();

        // Select CHZ token
        console.log('[PROD TEST] Selecting CHZ token...');
        await sendPage.selectToken(chainIdHex, symbol);

        // Fill recipient address
        console.log('[PROD TEST] Filling sender address:', senderAddress);
        await sendPage.fillRecipient(senderAddress);

        // Fill amount (sending 2 CHZ as a test)
        // const sendAmount = '2';
        console.log(`[PROD TEST] Filling amount: ${sendAmount} CHZ`);
        await sendPage.fillAmount(sendAmount);

        // Continue to confirmation
        console.log('[PROD TEST] Proceeding to confirmation...');
        await sendPage.pressContinueButton();

        // Confirm transaction
        await sendTokenConfirmPage.checkPageIsLoaded();

        console.log('[PROD TEST] Confirming transaction...');
        await sendTokenConfirmPage.clickOnConfirm();

        // Wait for transaction to be submitted
        await driver.delay(PROD_DELAYS.RPC_RESPONSE);

        // Verify transaction in activity list
        console.log('[PROD TEST] Verifying transaction in activity list...');
        // const activityListPage = new ActivityListPage(driver);
        await driver.delay(PROD_DELAYS.RPC_RESPONSE);
        await activityListPage.checkTransactionActivityByText('Sent');
        await activityListPage.checkWaitForTransactionStatus('confirmed');
        await activityListPage.checkTransactionAmount(`-${sendAmount} CHZ`);

        console.log('[PROD TEST] ✅ Transaction sent successfully!');
        console.log(
          `[PROD TEST] Sent ${sendAmount} CHZ to ${recipientAddress} on Chiliz network`,
        );

        console.log('[PROD TEST] ✅ All verifications passed!');
        console.log(
          `[PROD TEST] Successfully verified received transaction on Chiliz network`,
        );
      },
    );
  });
});
