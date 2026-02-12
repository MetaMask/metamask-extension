import { strict as assert } from 'assert';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixtures/fixture-builder';
import TestDapp from '../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { DEFAULT_FIXTURE_ACCOUNT } from '../constants';
import { mockEip7702FeatureFlag } from '../tests/confirmations/helpers';

describe('wallet_getCapabilities', function () {
  it('should indicate auxiliaryFunds support for chains with bridge support', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDappWithChains(['0x1'])
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
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDappWithChains(['0x539'])
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
});
