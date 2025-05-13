import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { MOCK_META_METRICS_ID } from '../../constants';
import { MetaMetricsRequestedThrough } from '../../../../shared/constants/metametrics';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

/**
 * mocks the segment api multiple times for specific payloads that we expect to
 * see when these tests are run. In this case we are looking for
 * 'Signature Requested' and 'Signature Received'. Do not use the constants
 * from the metrics constants files, because if these change we want a strong
 * indicator to our data team that the shape of data will change.
 *
 * @param mockServer
 */
async function mockSegment(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Signature Requested' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Signature Approved' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

const expectedEventPropertiesBase = {
  account_type: 'MetaMask',
  category: 'inpage_provider',
  locale: 'en',
  chain_id: '0x539',
  environment_type: 'background',
  security_alert_reason: 'validation_in_progress',
  security_alert_response: 'loading',
  ui_customizations: ['redesigned_confirmation'],
  api_source: MetaMetricsRequestedThrough.EthereumProvider,
} as const;

describe('Signature Approved Event', function () {
  it('Successfully tracked for signTypedData_v4', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
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

        // creates a sign typed data V4 signature request
        await testDapp.signTypedDataV4();
        const events = await getEventPayloads(driver, mockedEndpoints);

        assert.deepStrictEqual(events[0].properties, {
          ...expectedEventPropertiesBase,
          signature_type: 'eth_signTypedData_v4',
          eip712_primary_type: 'Mail',
          hd_entropy_index: 0,
        });

        assert.deepStrictEqual(events[1].properties, {
          ...expectedEventPropertiesBase,
          signature_type: 'eth_signTypedData_v4',
          eip712_primary_type: 'Mail',
          hd_entropy_index: 0,
          security_alert_response: 'Benign',
          security_alert_source: 'api',
        });
      },
    );
  });

  it('Successfully tracked for signTypedData_v3', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
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

        // creates a sign typed data V3 signature request
        await testDapp.signTypedDataV3Redesign();
        const events = await getEventPayloads(driver, mockedEndpoints);

        assert.deepStrictEqual(events[0].properties, {
          ...expectedEventPropertiesBase,
          signature_type: 'eth_signTypedData_v3',
          hd_entropy_index: 0,
        });

        assert.deepStrictEqual(events[1].properties, {
          ...expectedEventPropertiesBase,
          signature_type: 'eth_signTypedData_v3',
          security_alert_response: 'Benign',
          security_alert_source: 'api',
          hd_entropy_index: 0,
        });
      },
    );
  });

  it('Successfully tracked for signTypedData', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
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

        // creates a sign typed data signature request
        await testDapp.signTypedData();
        const events = await getEventPayloads(driver, mockedEndpoints);

        assert.deepStrictEqual(events[0].properties, {
          ...expectedEventPropertiesBase,
          signature_type: 'eth_signTypedData',
          hd_entropy_index: 0,
        });

        assert.deepStrictEqual(events[1].properties, {
          ...expectedEventPropertiesBase,
          signature_type: 'eth_signTypedData',
          security_alert_response: 'Benign',
          security_alert_source: 'api',
          hd_entropy_index: 0,
        });
      },
    );
  });

  it('Successfully tracked for personalSign', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
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

        // creates a sign typed data signature request
        await testDapp.personalSign();
        const events = await getEventPayloads(driver, mockedEndpoints);

        assert.deepStrictEqual(events[0].properties, {
          ...expectedEventPropertiesBase,
          signature_type: 'personal_sign',
          hd_entropy_index: 0,
        });

        assert.deepStrictEqual(events[1].properties, {
          ...expectedEventPropertiesBase,
          signature_type: 'personal_sign',
          security_alert_response: 'Benign',
          security_alert_source: 'api',
          hd_entropy_index: 0,
        });
      },
    );
  });
});
