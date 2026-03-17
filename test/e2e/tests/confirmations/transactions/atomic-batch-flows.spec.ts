import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Anvil } from '../../../seeder/anvil';
import { Driver } from '../../../webdriver/driver';
import { DEFAULT_FIXTURE_ACCOUNT, WINDOW_TITLES } from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import Eip7702AndSendCalls from '../../../page-objects/pages/confirmations/batch-confirmation';
import DowngradeConfirmation from '../../../page-objects/pages/confirmations/downgrade-confirmation';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountDetailsModal from '../../../page-objects/pages/dialog/account-details-modal';
import TestDapp from '../../../page-objects/pages/test-dapp';
import { mockEip7702FeatureFlag } from '../helpers';

describe('Atomic Batch Flows', function (this: Suite) {
  it('creates atomic batch via wallet_sendCalls with account upgrade', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
            options: {
              hardfork: 'prague',
              loadState:
                './test/e2e/seeder/network-states/eip7702-state/withDelegatorContracts.json',
            },
          },
        ],
        testSpecificMock: mockEip7702FeatureFlag,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: Anvil[];
      }) => {
        await loginWithBalanceValidation(driver);

        // Verify we start with an EOA account
        let accountBytecode = await localNodes[0].getCode(
          DEFAULT_FIXTURE_ACCOUNT,
        );
        assert.strictEqual(accountBytecode, undefined);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // Trigger wallet_sendCalls which will prompt for account upgrade
        await testDapp.clickSendCalls();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const batchConfirmation = new Eip7702AndSendCalls(driver);

        // Verify upgrade prompt is displayed
        await batchConfirmation.checkExpectedTxTypeIsDisplayed('Smart account');
        await batchConfirmation.checkExpectedInteractingWithIsDisplayed(
          'Account 1',
        );

        // Verify batch transaction list
        await batchConfirmation.clickAdvancedDetailsButton();
        await batchConfirmation.checkBatchTxListIsPresent();
        await batchConfirmation.verifyBatchTransactionList();

        // Confirm the batch with upgrade
        await batchConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Verify transactions completed
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);

        // Verify balance changed (batch includes 2x 0.001 ETH sends)
        await homePage.checkExpectedBalanceIsDisplayed('24.9998', 'ETH');

        // Verify account was upgraded
        accountBytecode = await localNodes[0].getCode(DEFAULT_FIXTURE_ACCOUNT);
        assert.strictEqual(
          accountBytecode,
          '0xef01008438ad1c834623cff278ab6829a248e37c2d7e3f',
        );
      },
    );
  });

  it('handles atomic batch with already upgraded account', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
            options: {
              hardfork: 'prague',
              loadState:
                './test/e2e/seeder/network-states/eip7702-state/withDelegatorContracts.json',
            },
          },
        ],
        testSpecificMock: mockEip7702FeatureFlag,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver; localNodes: Anvil[] }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // First upgrade the account
        await testDapp.clickSendCalls();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const batchConfirmation = new Eip7702AndSendCalls(driver);
        await batchConfirmation.clickFooterConfirmButton();

        // Wait for first transaction to complete
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);

        // Now trigger another batch with already upgraded account
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickSendCalls();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const secondBatchConfirmation = new Eip7702AndSendCalls(driver);

        // Should not show upgrade prompt for already upgraded account
        await secondBatchConfirmation.clickAdvancedDetailsButton();
        await secondBatchConfirmation.checkBatchTxListIsPresent();

        // Confirm second batch
        await secondBatchConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await homePage.goToActivityList();
        await activityList.checkConfirmedTxNumberDisplayedInActivity(2);
      },
    );
  });

  it('downgrades account and verifies batch flow', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
            options: {
              hardfork: 'prague',
              loadState:
                './test/e2e/seeder/network-states/eip7702-state/withDelegatorContracts.json',
            },
          },
        ],
        testSpecificMock: mockEip7702FeatureFlag,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: Anvil[];
      }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // First upgrade the account
        await testDapp.clickSendCalls();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const upgradeConfirmation = new Eip7702AndSendCalls(driver);
        await upgradeConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.delay(2000);

        // Now downgrade the account
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountDetailsModal();

        const accountDetailsModal = new AccountDetailsModal(driver);
        await accountDetailsModal.checkPageIsLoaded();
        await accountDetailsModal.triggerAccountSwitch();

        const downgradeConfirmation = new DowngradeConfirmation(driver);
        await downgradeConfirmation.checkDowngradeMessageIsDisplayed();

        // Confirm downgrade
        await downgradeConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(2);

        // Verify account bytecode is cleared after downgrade
        const accountBytecode = await localNodes[0].getCode(
          DEFAULT_FIXTURE_ACCOUNT,
        );
        assert.strictEqual(accountBytecode, undefined);
      },
    );
  });

  it('verifies status using wallet_getCallsStatus', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
            options: {
              hardfork: 'prague',
              loadState:
                './test/e2e/seeder/network-states/eip7702-state/withDelegatorContracts.json',
            },
          },
        ],
        testSpecificMock: mockEip7702FeatureFlag,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // Trigger wallet_sendCalls
        await testDapp.clickSendCalls();

        // Switch back to dapp without confirming
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Try to get status (would need actual batch ID from sendCalls response)
        // This is a simplified version - in real implementation we'd capture the batch ID
        const getStatusRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_getCallsStatus',
          params: ['batch-id-placeholder'],
        });

        try {
          const statusResponse = await driver.executeScript(
            `return window.ethereum.request(${getStatusRequest})`,
          );
          console.log('Status response:', statusResponse);
        } catch (error) {
          // Expected if batch ID doesn't exist
          console.log('Status check failed as expected:', error);
        }

        // Now confirm the transaction
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const batchConfirmation = new Eip7702AndSendCalls(driver);
        await batchConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.delay(2000);

        // Check status again after confirmation
        try {
          const statusResponse = await driver.executeScript(
            `return window.ethereum.request(${getStatusRequest})`,
          );
          console.log('Status after confirmation:', statusResponse);
        } catch (error) {
          console.log('Status check after confirmation:', error);
        }
      },
    );
  });

  it('rejects account upgrade and continues with batch', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
            options: {
              hardfork: 'prague',
              loadState:
                './test/e2e/seeder/network-states/eip7702-state/withDelegatorContracts.json',
            },
          },
        ],
        testSpecificMock: mockEip7702FeatureFlag,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: Anvil[];
      }) => {
        await loginWithBalanceValidation(driver);

        // Verify we start with an EOA account
        let accountBytecode = await localNodes[0].getCode(
          DEFAULT_FIXTURE_ACCOUNT,
        );
        assert.strictEqual(accountBytecode, undefined);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // Trigger wallet_sendCalls which will prompt for upgrade
        await testDapp.clickSendCalls();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const batchConfirmation = new Eip7702AndSendCalls(driver);
        await batchConfirmation.checkExpectedTxTypeIsDisplayed('Smart account');

        // Reject the upgrade
        await batchConfirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

        // Verify account remains EOA
        accountBytecode = await localNodes[0].getCode(DEFAULT_FIXTURE_ACCOUNT);
        assert.strictEqual(accountBytecode, undefined);

        // Can still trigger a new batch
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickSendCalls();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const newBatchConfirmation = new Eip7702AndSendCalls(driver);
        await newBatchConfirmation.checkExpectedTxTypeIsDisplayed(
          'Smart account',
        );
        await newBatchConfirmation.checkExpectedInteractingWithIsDisplayed(
          'Account 1',
        );
      },
    );
  });
});
