const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  regularDelayMs,
  openDapp,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Signature Approved Event', function () {
  async function mockSegment(mockServer) {
    return await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Signature Approved' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      });
  }
  it('Successfully tracked for signTypedData_v4', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
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
        ganacheOptions,
        title: this.test.title,
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#signTypedDataV4');

        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        const verifyContractDetailsButton = await driver.findElement(
          '.signature-request-content__verify-contract-details',
        );

        verifyContractDetailsButton.click();
        await driver.clickElement({ text: 'Got it', tag: 'button' });

        // Approve signing typed data
        await driver.clickElement(
          '[data-testid="signature-request-scroll-button"]',
        );
        await driver.delay(regularDelayMs);
        await driver.clickElement({ text: 'Sign', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        windowHandles = await driver.getAllWindowHandles();

        await driver.wait(async () => {
          const isPending = await mockedEndpoint.isPending();
          return isPending === false;
        }, 10000);
        const mockedRequests = await mockedEndpoint.getSeenRequests();
        const payloads = mockedRequests
          .map((req) => req.body.json.batch)
          .flat();
        assert.deepStrictEqual(payloads[0].properties, {
          signature_type: 'eth_signTypedData_v4',
          category: 'inpage_provider',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });
});
