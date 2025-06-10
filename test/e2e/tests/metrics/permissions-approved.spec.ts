import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { Suite } from 'mocha';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { MetaMetricsRequestedThrough } from '../../../../shared/constants/metametrics';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

/**
 * mocks the segment api multiple times for specific payloads that we expect to
 * see when these tests are run. In this case we are looking for
 * 'Permissions Requested' and 'Permissions Received'. Do not use the constants
 * from the metrics constants files, because if these change we want a strong
 * indicator to our data team that the shape of data will change.
 *
 * @param mockServer - The mock server instance.
 * @returns Array of mocked responses
 */
async function mockSegment(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Permissions Requested' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Permissions Approved' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

describe('Permissions Approved Event', function (this: Suite) {
  it('Successfully tracked when connecting to dapp', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-fd20',
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        await testDapp.connectAccount({
          publicAddress: DEFAULT_FIXTURE_ACCOUNT,
        });

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].properties, {
          method: 'eth_requestAccounts',
          category: 'inpage_provider',
          locale: 'en',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x539',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'background',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          api_source: MetaMetricsRequestedThrough.EthereumProvider,
        });
        assert.deepStrictEqual(events[1].properties, {
          method: 'eth_requestAccounts',
          category: 'inpage_provider',
          locale: 'en',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x539',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'background',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          api_source: MetaMetricsRequestedThrough.EthereumProvider,
        });
      },
    );
  });
});
