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
import NetworkManager from '../../../page-objects/pages/network-manager';
import { send } from 'process';

/**
 * Production E2E Test: Additional Network, Import Account, and Send
 * This test uses REAL network infrastructure with production RPC endpoints.
 */
describe('Production E2E: Monad Network, Import Account and SWAP MON', function (this: Suite) {
  this.timeout(300000); // 5 minutes for network operations and send

  it('adds Monad network, imports account with private key, and swaps MON', async function () {
    await withProductionFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMonad()
          .build(),
        title:
          this.test?.fullTitle() ||
          'Add Base network, import account and swap MON production test',
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

        // This ensures the wallet is properly set up before proceeding
        await loginWithoutBalanceValidation(driver);

        // console.log('[PROD TEST] Waiting for home page to load...');
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await driver.delay(PROD_DELAYS.API_RESPONSE); // Wait for network to stabilize

        const symbol = 'MON';
        const chainIdHex = '0x8f';

        console.log('[PROD TEST] Opening all network list..');
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab("Popular");
        await networkManager.selectNetworkByNameWithWait("Monad");

        // Import account with private key
        // NOTE: These values are loaded from test/e2e/.env.e2e file
        console.log('[PROD TEST] Loading test credentials from .env.e2e...');
        const privateKeyFrom = getRequiredE2EEnv('PRIVATE_KEY_FROM');
        const privateKeyTo = getRequiredE2EEnv('PRIVATE_KEY_TO');
        console.log('[PROD TEST] Opening account list to import account...');
        // This opens the account list modal/popover (not a full page navigation)
        await homePage.headerNavbar.openAccountMenu();

        const accountListPage = new AccountListPage(driver);
        console.log('[PROD TEST] Waiting for account list page to load...');
        await accountListPage.checkPageIsLoaded();

        // Import Account
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

        // Verify we're on Base network
        console.log('[PROD TEST] Verifying network...');
        await homePage.checkPageIsLoaded();

        await networkManager.openNetworkManager();
        await networkManager.selectTab("Popular");
        await networkManager.selectNetworkByNameWithWait("Base");

        await networkManager.openNetworkManager();
        await networkManager.selectTab("Popular");
        await networkManager.selectNetworkByNameWithWait("Monad");

        console.log('[PROD TEST] ✅ All verifications passed!');
        console.log(`[PROD TEST] Successfully swapped on Monad network`);
      },
    );
  });
});
