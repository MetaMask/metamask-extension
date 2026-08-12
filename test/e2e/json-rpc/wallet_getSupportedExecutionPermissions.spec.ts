import { strict as assert } from 'assert';
import type { Mockttp } from 'mockttp';
import { withFixtures } from '../helpers';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { Driver } from '../webdriver/driver';
import { login } from '../page-objects/flows/login.flow';
import TestDapp from '../page-objects/pages/test-dapp';
import { getProductionRemoteFlagApiResponse } from '../feature-flags/feature-flag-registry';

/**
 * Mocks the client-config flags API so that confirmations_eip_7702 has
 * supportedChains: ['0x539']. This ensures chain IDs are resolved in
 * wallet_getSupportedExecutionPermissions responses for local test networks.
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

describe('wallet_getSupportedExecutionPermissions', function () {
  it('returns supported advanced permission types', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2().build(),
        testSpecificMock: mockEip7702SupportedChains,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        const getSupportedExecutionPermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_getSupportedExecutionPermissions',
          params: [],
        });

        const supportedExecutionPermissions = await driver.executeScript(
          `return window.ethereum.request(${getSupportedExecutionPermissionsRequest})`,
        );

        assert.equal(
          typeof supportedExecutionPermissions,
          'object',
          'Expected wallet_getSupportedExecutionPermissions to return an object',
        );
        assert.notEqual(
          supportedExecutionPermissions,
          null,
          'Expected wallet_getSupportedExecutionPermissions to return a non-null object',
        );

        assert.ok(
          Object.keys(supportedExecutionPermissions).length > 0,
          'Expected at least one supported execution permission type',
        );
        assert.ok(
          supportedExecutionPermissions['native-token-periodic'],
          "Expected 'native-token-periodic' to be included in supported permission types",
        );
        assert.deepEqual(
          supportedExecutionPermissions['native-token-periodic'].chainIds,
          ['0x539'],
        );
      },
    );
  });
});
