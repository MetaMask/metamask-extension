import { strict as assert } from 'assert';
import { test as pwTest } from '@playwright/test';
import { Mockttp } from 'mockttp';
import { MetaMetricsRequestedThrough } from '../../../../shared/constants/metametrics';
import {
  DEFAULT_FIXTURE_ACCOUNT,
  E2E_DRIVER,
  MOCK_ANALYTICS_ID,
  MOCK_PROFILE_IDENTITY_EVENT_PROPERTIES,
} from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { getEventPayloads, withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { connectAccountToTestDapp } from '../../page-objects/flows/test-dapp.flow';
import TestDapp from '../../page-objects/pages/test-dapp';

/**
 * Mocks the segment API for the Permissions Requested and Permissions Approved
 * events. Do not use constants from the metrics constants files, because if
 * these change we want a strong indicator to our data team that the shape of
 * data will change.
 *
 * @param mockServer - The mock server instance.
 * @returns Array of mocked responses.
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

pwTest.describe('Permissions Approved Event', () => {
  pwTest('is tracked when connecting to a dapp', async () => {
    await withFixtures(
      {
        driverType: E2E_DRIVER.PLAYWRIGHT,
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
            consentDecisionMade: true,
            optedIn: true,
          })
          .build(),
        title: pwTest.info().titlePath.join(' '),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await connectAccountToTestDapp(driver, {
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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_iframe: false,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_cross_origin_iframe: false,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          iframe_origin: null,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          top_level_origin: null,
          ...MOCK_PROFILE_IDENTITY_EVENT_PROPERTIES,
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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_iframe: false,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_cross_origin_iframe: false,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          iframe_origin: null,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          top_level_origin: null,
          ...MOCK_PROFILE_IDENTITY_EVENT_PROPERTIES,
        });
      },
    );
  });
});
