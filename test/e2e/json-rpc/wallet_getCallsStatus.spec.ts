import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { withFixtures } from '../helpers';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import TestDapp from '../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { WINDOW_TITLES } from '../constants';
import { mockEip7702FeatureFlag } from '../tests/confirmations/helpers';
import Eip7702AndSendCalls from '../page-objects/pages/confirmations/batch-confirmation';
import { Driver } from '../webdriver/driver';
import { Anvil } from '../seeder/anvil';

describe('wallet_getCallsStatus', function (this: Suite) {
  it('returns pending status for ongoing batch', async function () {
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

        // Trigger wallet_sendCalls
        await testDapp.clickSendCalls();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const batchConfirmation = new Eip7702AndSendCalls(driver);
        await batchConfirmation.checkExpectedTxTypeIsDisplayed('Smart account');

        // Don't confirm yet, switch back to dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Check status while transaction is pending
        const walletGetCallsStatusRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_getCallsStatus',
          params: ['pending-batch-id'], // This would need the actual batch ID
        });

        const statusResponse = await driver.executeScript(
          `return window.ethereum.request(${walletGetCallsStatusRequest})`,
        );

        assert.equal(statusResponse.status, 'PENDING');
        assert.ok(statusResponse.calls);
      },
    );
  });

  it('returns confirmed status for completed batch', async function () {
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

        // Trigger and confirm wallet_sendCalls
        await testDapp.clickSendCalls();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const batchConfirmation = new Eip7702AndSendCalls(driver);
        await batchConfirmation.checkExpectedTxTypeIsDisplayed('Smart account');
        await batchConfirmation.clickFooterConfirmButton();

        // Wait for transaction to be confirmed
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.delay(2000); // Wait for confirmation

        // Check status after transaction is confirmed
        const walletGetCallsStatusRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_getCallsStatus',
          params: ['confirmed-batch-id'], // This would need the actual batch ID
        });

        const statusResponse = await driver.executeScript(
          `return window.ethereum.request(${walletGetCallsStatusRequest})`,
        );

        assert.equal(statusResponse.status, 'CONFIRMED');
        assert.ok(statusResponse.receipts);
      },
    );
  });

  it('handles error status correctly', async function () {
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

        // Check status for non-existent batch
        const walletGetCallsStatusRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_getCallsStatus',
          params: ['non-existent-batch-id'],
        });

        try {
          await driver.executeScript(
            `return window.ethereum.request(${walletGetCallsStatusRequest})`,
          );
          assert.fail('Should have thrown an error');
        } catch (error) {
          assert.ok(error.message.includes('not found'));
        }
      },
    );
  });
});
