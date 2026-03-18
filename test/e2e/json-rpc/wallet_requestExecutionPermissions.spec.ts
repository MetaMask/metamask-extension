import { strict as assert } from 'assert';
import type { Mockttp } from 'mockttp';
import { withFixtures } from '../helpers';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { Driver } from '../webdriver/driver';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { WINDOW_TITLES } from '../constants';
import TestDapp from '../page-objects/pages/test-dapp';
import AdvancedPermissionsIntroduction from '../page-objects/pages/confirmations/advanced-permissions-introduction';
import { getProductionRemoteFlagApiResponse } from '../feature-flags/feature-flag-registry';

/**
 * Mocks the client-config flags API so that confirmations_eip_7702 has
 * supportedChains: ['0x539']. This is more reliable than fixture state because
 * the extension fetches flags when the UI opens and overwrites fixture-loaded state.
 *
 * @param server - The mockttp server to mock the flags API on.
 * @returns An array of mockttp requests to mock the flags API.
 */
async function mockEip7702SupportedChains(server: Mockttp) {
  const flags = getProductionRemoteFlagApiResponse();

  const flagsWithEip7702 = [
    ...flags,
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      confirmations_eip_7702: {
        supportedChains: ['0x539'],
        contracts: {},
      },
    },
  ];
  return [
    await server
      .forGet('https://client-config.api.cx.metamask.io/v1/flags')
      .withQuery({ client: 'extension', distribution: 'main' })
      .thenCallback(() => ({
        ok: true,
        statusCode: 200,
        json: flagsWithEip7702,
      })),
  ];
}

describe('wallet_requestExecutionPermissions', function () {
  it('blocks other requests, until the dialog is closed', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2().build(),
        testSpecificMock: mockEip7702SupportedChains,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        const requestExecutionPermissionsRequest: string = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_requestExecutionPermissions',
          params: [
            {
              chainId: '0x539',
              to: '0x1234567890123456789012345678901234567890',
              permission: {
                type: 'erc20-token-revocation',
                isAdjustmentAllowed: true,
                data: {},
              },
              rules: [],
            },
          ],
          id: 0,
        });

        // this could be any method, but eth_chainId is simple enough.
        const chainIdRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 0,
        });

        // We don't await the promise so that we can validate that concurrent
        // requests are blocked. We store a reference so that we can await it
        // later.
        await driver.executeScript(
          `window.__pendingPermissionRequest = window.ethereum.request(${requestExecutionPermissionsRequest})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const advancedPermissionsIntroduction =
          new AdvancedPermissionsIntroduction(driver);
        await advancedPermissionsIntroduction.checkPageIsLoaded();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await assert.rejects(
          driver.executeScript(
            `return window.ethereum.request(${chainIdRequest})`,
          ),
          {
            message:
              /Cannot process requests while a wallet_requestExecutionPermissions request is in process/u,
          },
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // We cancel the request, because granting is a much more complex user interaction.
        await advancedPermissionsIntroduction.cancel();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await assert.rejects(
          driver.executeScript('return window.__pendingPermissionRequest'),
        );

        const chainId = await driver.executeScript(
          `return window.ethereum.request(${chainIdRequest})`,
        );

        assert.equal(chainId, '0x539');
      },
    );
  });
});
