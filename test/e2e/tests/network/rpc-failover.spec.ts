import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { TestSuiteArguments } from '../confirmations/transactions/shared';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { Mockttp } from '../../mock-e2e';
import { expectMockRequest } from '../../helpers/mock-server';

describe('RPC Failover', function (this: Suite) {
  it('should failover to the secondary RPC when the primary fails and the feature flag is enabled', async function () {
    const primaryRpcUrl = 'https://primary-rpc.test/';
    const failoverRpcUrl = 'https://failover-rpc.test/';

    async function mockRpc(mockServer: Mockttp) {
      const primaryMock = await mockServer
        .forPost(primaryRpcUrl)
        .thenCloseConnection();

      const failoverMock = await mockServer
        .forPost(failoverRpcUrl)
        .thenCallback(() => {
          return {
            statusCode: 200,
            json: {
              id: 1,
              jsonrpc: '2.0',
              result: '0xde0b6b3a7640000', // 1 ETH
            },
          };
        });
      return [primaryMock, failoverMock];
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkController({
            networkConfigurationsByChainId: {
              '0x539': {
                blockExplorerUrls: ['https://etherscan.io/'],
                chainId: '0x539',
                defaultBlockExplorerUrlIndex: 0,
                defaultRpcEndpointIndex: 0,
                name: 'Localhost 8545 with Failover',
                nativeCurrency: 'ETH',
                rpcEndpoints: [
                  {
                    url: primaryRpcUrl,
                    failoverUrls: [failoverRpcUrl],
                    networkClientId: 'failover-test-network',
                    type: 'custom',
                  },
                ],
              },
            },
            selectedNetworkClientId: 'failover-test-network',
          })
          .build(),
        remoteFeatureFlags: {
          walletFrameworkRpcFailoverEnabled: {
            enabled: true,
            value: 'variantA',
          },
        },
        title: this.test?.fullTitle(),
        testSpecificMock: mockRpc,
      },
      async ({ driver, mockedEndpoint }: TestSuiteArguments) => {
        await loginWithBalanceValidation(driver);
        if (!Array.isArray(mockedEndpoint)) {
          throw new Error('mockedEndpoint is not an array');
        }

        const primaryMock = mockedEndpoint[0];
        const failoverMock = mockedEndpoint[1];

        const primaryRequests = await primaryMock.getSeenRequests();
        assert.ok(primaryRequests.length > 0, 'Primary RPC should be called');

        await expectMockRequest(driver, failoverMock, {
          timeout: 10000,
        });
      },
    );
  });
});
