const { strict: assert } = require('assert');

const {
  defaultGanacheOptions,
  switchToNotificationWindow,
  withFixtures,
  openDapp,
  unlockWallet,
  getEventPayloads,
  clickSignOnSignatureConfirmation,
  tempToggleSettingRedesignedConfirmations,
  validateContractDetails,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

/**
 * mocks the segment api multiple times for specific payloads that we expect to
 * see when these tests are run. In this case we are looking for
 * 'Signature Requested' and 'Signature Received'. Do not use the constants
 * from the metrics constants files, because if these change we want a strong
 * indicator to our data team that the shape of data will change.
 *
 * @param {import('mockttp').Mockttp} mockServer
 * @returns {Promise<import('mockttp/dist/pluggable-admin').MockttpClientResponse>[]}
 */
async function mockSegment(mockServer) {
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
  security_alert_reason: 'CheckingChain',
  security_alert_response: 'loading',
};

describe('Signature Approved Event @no-mmi', function () {
  it('Successfully tracked for signTypedData_v4', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);
        await tempToggleSettingRedesignedConfirmations(driver);
        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#signTypedDataV4');
        await switchToNotificationWindow(driver);
        await validateContractDetails(driver);
        await clickSignOnSignatureConfirmation({ driver });
        const events = await getEventPayloads(driver, mockedEndpoints);

        assert.deepStrictEqual(events[0].properties, {
          ...expectedEventPropertiesBase,
          signature_type: 'eth_signTypedData_v4',
          eip712_primary_type: 'Mail',
        });

        assert.deepStrictEqual(events[1].properties, {
          ...expectedEventPropertiesBase,
          signature_type: 'eth_signTypedData_v4',
          eip712_primary_type: 'Mail',
          security_alert_response: 'Benign',
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
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);
        await tempToggleSettingRedesignedConfirmations(driver);
        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#signTypedDataV3');
        await switchToNotificationWindow(driver);
        await validateContractDetails(driver);
        await clickSignOnSignatureConfirmation({ driver });
        const events = await getEventPayloads(driver, mockedEndpoints);

        assert.deepStrictEqual(events[0].properties, {
          ...expectedEventPropertiesBase,
          signature_type: 'eth_signTypedData_v3',
        });

        assert.deepStrictEqual(events[1].properties, {
          ...expectedEventPropertiesBase,
          signature_type: 'eth_signTypedData_v3',
          security_alert_response: 'Benign',
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
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);
        await tempToggleSettingRedesignedConfirmations(driver);
        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#signTypedData');
        await switchToNotificationWindow(driver);
        await clickSignOnSignatureConfirmation({ driver });
        const events = await getEventPayloads(driver, mockedEndpoints);

        assert.deepStrictEqual(events[0].properties, {
          ...expectedEventPropertiesBase,
          signature_type: 'eth_signTypedData',
        });

        assert.deepStrictEqual(events[1].properties, {
          ...expectedEventPropertiesBase,
          signature_type: 'eth_signTypedData',
          security_alert_response: 'Benign',
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
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);
        await tempToggleSettingRedesignedConfirmations(driver);
        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#personalSign');
        await switchToNotificationWindow(driver);
        await clickSignOnSignatureConfirmation({ driver });
        const events = await getEventPayloads(driver, mockedEndpoints);

        assert.deepStrictEqual(events[0].properties, {
          ...expectedEventPropertiesBase,
          signature_type: 'personal_sign',
        });

        assert.deepStrictEqual(events[1].properties, {
          ...expectedEventPropertiesBase,
          signature_type: 'personal_sign',
          security_alert_response: 'Benign',
        });
      },
    );
  });
});
