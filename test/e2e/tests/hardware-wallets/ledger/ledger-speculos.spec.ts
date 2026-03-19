import { strict as assert } from 'assert';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withFixtures } from '../../../helpers';
import { SpeculosTestHelper } from '../../../speculos/test-helper';
import { SpeculosAutomation } from '../../../speculos/automation';
import { WebHIDSpeculosBridge } from '../../../mocks/webhid-speculos-bridge';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import ConnectHardwareWalletPage from '../../../page-objects/pages/hardware-wallet/connect-hardware-wallet-page';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import SelectHardwareWalletAccountPage from '../../../page-objects/pages/hardware-wallet/select-hardware-wallet-account-page';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';

const speculosHelper = new SpeculosTestHelper();

describe('Ledger Hardware - Speculos Integration @speculos', function () {
  this.timeout(120000);

  before(async function () {
    await speculosHelper.start();
  });

  after(async function () {
    await speculosHelper.stop();
  });

  describe('Manual Approval (Default)', function () {
    it('connects to Speculos with manual button presses', async function () {
      const webHIDBridge = new WebHIDSpeculosBridge(speculosHelper.getClient());
      const automation = new SpeculosAutomation(speculosHelper.getClient());

      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await webHIDBridge.inject(driver);
          await loginWithBalanceValidation(driver);

          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.openAccountMenu();

          const accountListPage = new AccountListPage(driver);
          await accountListPage.openConnectHardwareWalletModal();

          const connectPage = new ConnectHardwareWalletPage(driver);
          await connectPage.clickConnectLedgerButton();
          await connectPage.clickContinueButton();

          const selectPage = new SelectHardwareWalletAccountPage(driver);
          await selectPage.checkPageIsLoaded();

          // Verify device shows confirmation screen
          const screenshot = await speculosHelper.getClient().getScreenshot();
          assert.ok(screenshot.length > 0, 'Device shows confirmation');

          // MANUALLY approve by pressing both buttons
          await automation.approve();

          await selectPage.unlockAccount(1);
          await headerNavbar.openAccountMenu();
        },
      );
    });

    it('signs transaction with review and manual approval', async function () {
      const webHIDBridge = new WebHIDSpeculosBridge(speculosHelper.getClient());
      const automation = new SpeculosAutomation(speculosHelper.getClient());

      await withFixtures(
        {
          fixtures: new FixtureBuilder().withLedgerAccount().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await webHIDBridge.inject(driver);
          await loginWithBalanceValidation(driver);

          // Initiate transaction
          await driver.clickElement('[data-testid="send-button"]');
          await driver.fill(
            '[data-testid="recipient-input"]',
            '0x1234567890123456789012345678901234567890',
          );
          await driver.fill('[data-testid="amount-input"]', '0.1');
          await driver.clickElement('[data-testid="next-button"]');

          // Transaction is now on device
          await driver.delay(1000); // Wait for APDU exchange

          // Review transaction screens (scroll through)
          const result = await automation.approveTransaction({
            reviewScreens: 2, // Scroll through 2 screens
            takeScreenshots: true, // Capture each screen
            screenshotPrefix: 'eth-tx',
          });

          assert.ok(result.approved, 'Transaction approved');
          assert.ok(result.screenshots!.length > 0, 'Screenshots captured');

          // Verify success in MetaMask
          await driver.waitForElement('[data-testid="transaction-success"]');
        },
      );
    });
  });

  describe('Auto-Approval Mode', function () {
    it('uses auto-approval for quick transactions', async function () {
      const webHIDBridge = new WebHIDSpeculosBridge(speculosHelper.getClient());
      const automation = new SpeculosAutomation(speculosHelper.getClient());

      await withFixtures(
        {
          fixtures: new FixtureBuilder().withLedgerAccount().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          // Enable auto-approve BEFORE connecting
          await automation.enableAutoApprove();

          await webHIDBridge.inject(driver);
          await loginWithBalanceValidation(driver);

          // Connect device - auto-approved
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.openAccountMenu();
          const accountListPage = new AccountListPage(driver);
          await accountListPage.openConnectHardwareWalletModal();
          const connectPage = new ConnectHardwareWalletPage(driver);
          await connectPage.clickConnectLedgerButton();
          await connectPage.clickContinueButton();

          const selectPage = new SelectHardwareWalletAccountPage(driver);
          await selectPage.checkPageIsLoaded();
          // Account appears automatically (no manual button press needed)

          await selectPage.unlockAccount(1);

          // Disable auto-approve for safety
          await automation.disableAutoApprove();
        },
      );
    });

    it('signs multiple transactions with auto-approval', async function () {
      const webHIDBridge = new WebHIDSpeculosBridge(speculosHelper.getClient());
      const automation = new SpeculosAutomation(speculosHelper.getClient());

      await withFixtures(
        {
          fixtures: new FixtureBuilder().withLedgerAccount().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await webHIDBridge.inject(driver);
          await loginWithBalanceValidation(driver);

          // Enable auto-approval for batch processing
          await automation.enableAutoApprove();

          // Send 3 transactions rapidly
          for (let i = 0; i < 3; i++) {
            await driver.clickElement('[data-testid="send-button"]');
            await driver.fill(
              '[data-testid="recipient-input"]',
              `0xRecipient${i}...`,
            );
            await driver.fill('[data-testid="amount-input"]', '0.01');
            await driver.clickElement('[data-testid="next-button"]');

            // Transaction auto-approved, wait for success
            await driver.waitForElement('[data-testid="transaction-success"]');
            await driver.clickElement('[data-testid="close-button"]');
          }

          await automation.disableAutoApprove();
        },
      );
    });
  });

  describe('Rejection Tests', function () {
    it('rejects transaction on device', async function () {
      const webHIDBridge = new WebHIDSpeculosBridge(speculosHelper.getClient());
      const automation = new SpeculosAutomation(speculosHelper.getClient());

      await withFixtures(
        {
          fixtures: new FixtureBuilder().withLedgerAccount().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await webHIDBridge.inject(driver);
          await loginWithBalanceValidation(driver);

          // Initiate transaction
          await driver.clickElement('[data-testid="send-button"]');
          await driver.fill('[data-testid="recipient-input"]', '0x1234...');
          await driver.fill('[data-testid="amount-input"]', '0.1');
          await driver.clickElement('[data-testid="next-button"]');

          await driver.delay(1000);

          // Reject transaction
          await automation.reject();

          // Verify rejection in MetaMask
          await driver.waitForElement('[data-testid="transaction-rejected"]');
        },
      );
    });
  });
});
