import { strict as assert } from 'assert';
import { withFixtures } from '../helpers';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import TestDapp from '../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { DEFAULT_FIXTURE_ACCOUNT } from '../constants';
import { mockEip7702FeatureFlag } from '../tests/confirmations/helpers';

describe('wallet_getCapabilities', function () {
  it('should indicate auxiliaryFunds support for chains with bridge support', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp({ chainIds: [1] })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockEip7702FeatureFlag,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        const walletGetCapabilitiesRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_getCapabilities',
          params: [DEFAULT_FIXTURE_ACCOUNT, ['0x1']],
        });
        const walletGetCapabilitiesResponse = await driver.executeScript(
          `return window.ethereum.request(${walletGetCapabilitiesRequest})`,
        );
        assert.deepEqual(walletGetCapabilitiesResponse['0x1'].auxiliaryFunds, {
          supported: true,
        });
      },
    );
  });

  it('should not include auxiliaryFunds for chains without bridge support', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockEip7702FeatureFlag,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        const walletGetCapabilitiesRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_getCapabilities',
          params: [DEFAULT_FIXTURE_ACCOUNT, ['0x539']],
        });
        const walletGetCapabilitiesResponse = await driver.executeScript(
          `return window.ethereum.request(${walletGetCapabilitiesRequest})`,
        );
        assert.deepEqual(
          walletGetCapabilitiesResponse['0x539'].auxiliaryFunds,
          undefined,
        );
      },
    );
  });

  it('returns atomic batch capability for fresh account', async function () {
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
        title: this.test?.fullTitle(),
        testSpecificMock: mockEip7702FeatureFlag,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        const walletGetCapabilitiesRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_getCapabilities',
          params: [DEFAULT_FIXTURE_ACCOUNT, ['0x539']],
        });
        const walletGetCapabilitiesResponse = await driver.executeScript(
          `return window.ethereum.request(${walletGetCapabilitiesRequest})`,
        );
        assert.deepEqual(walletGetCapabilitiesResponse['0x539'].atomicBatch, {
          supported: true,
        });
      },
    );
  });

  it('returns upgraded capabilities for smart account', async function () {
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
        title: this.test?.fullTitle(),
        testSpecificMock: mockEip7702FeatureFlag,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // First upgrade the account
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await testDapp.clickSendCalls();

        await driver.switchToWindowWithTitle('MetaMask Notification');
        const BatchConfirmation = (
          await import('../page-objects/pages/confirmations/batch-confirmation')
        ).default;
        const batchConfirmation = new BatchConfirmation(driver);
        await batchConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle('Test Dapp');
        await driver.delay(2000); // Wait for upgrade to complete

        const walletGetCapabilitiesRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_getCapabilities',
          params: [DEFAULT_FIXTURE_ACCOUNT, ['0x539']],
        });
        const walletGetCapabilitiesResponse = await driver.executeScript(
          `return window.ethereum.request(${walletGetCapabilitiesRequest})`,
        );

        // Smart accounts should have enhanced capabilities
        assert.deepEqual(walletGetCapabilitiesResponse['0x539'].atomicBatch, {
          supported: true,
        });
        assert.deepEqual(
          walletGetCapabilitiesResponse['0x539'].paymasterService,
          {
            supported: true,
          },
        );
      },
    );
  });

  it('maintains capabilities after rejecting upgrade', async function () {
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
        title: this.test?.fullTitle(),
        testSpecificMock: mockEip7702FeatureFlag,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // Trigger and reject upgrade
        await testDapp.clickSendCalls();
        await driver.switchToWindowWithTitle('MetaMask Notification');
        const BatchConfirmation2 = (
          await import('../page-objects/pages/confirmations/batch-confirmation')
        ).default;
        const batchConfirmation = new BatchConfirmation2(driver);
        await batchConfirmation.clickFooterCancelButtonAndAndWaitForWindowToClose();

        await driver.switchToWindowWithTitle('Test Dapp');

        const walletGetCapabilitiesRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_getCapabilities',
          params: [DEFAULT_FIXTURE_ACCOUNT, ['0x539']],
        });
        const walletGetCapabilitiesResponse = await driver.executeScript(
          `return window.ethereum.request(${walletGetCapabilitiesRequest})`,
        );

        // Should still have atomic batch capability
        assert.deepEqual(walletGetCapabilitiesResponse['0x539'].atomicBatch, {
          supported: true,
        });
      },
    );
  });
});
