const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  switchToNotificationWindow,
  withFixtures,
  regularDelayMs,
  openDapp,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

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

/**
 * Some signing methods have extra security that requires the user to click a
 * button to validate that they have verified the details. This method handles
 * performing the necessary steps to click that button.
 *
 * @param {WebDriver} driver
 */
async function validateContractDetails(driver) {
  const verifyContractDetailsButton = await driver.findElement(
    '.signature-request-content__verify-contract-details',
  );

  verifyContractDetailsButton.click();
  await driver.clickElement({ text: 'Got it', tag: 'button' });

  // Approve signing typed data
  await driver.clickElement('[data-testid="signature-request-scroll-button"]');
  await driver.delay(regularDelayMs);
}

/**
 * This method handles clicking the sign button on signature confrimation
 * screen.
 *
 * @param {WebDriver} driver
 */
async function clickSignOnSignatureConfirmation(driver) {
  await driver.clickElement({ text: 'Sign', tag: 'button' });
  await driver.waitUntilXWindowHandles(2);
  await driver.getAllWindowHandles();
}

/**
 * This method handles getting the mocked requests to the segment server
 *
 * @param {WebDriver} driver
 * @param {import('mockttp').Mockttp} mockedEndpoints
 * @returns {import('mockttp/dist/pluggable-admin').MockttpClientResponse[]}
 */
async function getEventPayloads(driver, mockedEndpoints) {
  await driver.wait(async () => {
    let isPending = true;
    for (const mockedEndpoint of mockedEndpoints) {
      isPending = await mockedEndpoint.isPending();
    }
    return isPending === false;
  }, 10000);
  const mockedRequests = [];
  for (const mockedEndpoint of mockedEndpoints) {
    mockedRequests.push(...(await mockedEndpoint.getSeenRequests()));
  }
  return mockedRequests.map((req) => req.body.json.batch).flat();
}

describe('Signature Approved Event', function () {
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
        title: this.test.title,
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#signTypedDataV4');
        await switchToNotificationWindow(driver);
        await validateContractDetails(driver);
        await clickSignOnSignatureConfirmation(driver);
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].properties, {
          signature_type: 'eth_signTypedData_v4',
          category: 'inpage_provider',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].properties, {
          signature_type: 'eth_signTypedData_v4',
          category: 'inpage_provider',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
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
        title: this.test.title,
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#signTypedDataV3');
        await switchToNotificationWindow(driver);
        await validateContractDetails(driver);
        await clickSignOnSignatureConfirmation(driver);
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].properties, {
          signature_type: 'eth_signTypedData_v3',
          category: 'inpage_provider',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].properties, {
          signature_type: 'eth_signTypedData_v3',
          category: 'inpage_provider',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
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
        title: this.test.title,
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#signTypedData');
        await switchToNotificationWindow(driver);
        await clickSignOnSignatureConfirmation(driver);
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].properties, {
          signature_type: 'eth_signTypedData',
          category: 'inpage_provider',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].properties, {
          signature_type: 'eth_signTypedData',
          category: 'inpage_provider',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
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
        title: this.test.title,
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#personalSign');
        await switchToNotificationWindow(driver);
        await clickSignOnSignatureConfirmation(driver);
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].properties, {
          signature_type: 'personal_sign',
          category: 'inpage_provider',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].properties, {
          signature_type: 'personal_sign',
          category: 'inpage_provider',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });
  it('Successfully tracked for eth_sign', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            disabledRpcMethodPreferences: {
              eth_sign: true,
            },
          })
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        defaultGanacheOptions,
        title: this.test.title,
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#ethSign');
        await switchToNotificationWindow(driver);
        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        await driver.clickElement(
          '.signature-request-warning__footer__sign-button',
        );
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].properties, {
          signature_type: 'eth_sign',
          category: 'inpage_provider',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].properties, {
          signature_type: 'eth_sign',
          category: 'inpage_provider',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });
});
