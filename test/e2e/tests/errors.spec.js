const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Sentry errors', function () {
  async function mockSegment(mockServer) {
    mockServer.reset();
    await mockServer.forAnyRequest().thenPassThrough();
    return await mockServer
      .forPost('https://sentry.io/api/0000000/store/')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {},
        };
      });
  }
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should send error events', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver, mockServer }) => {
        const mockedEndpoint = await mockSegment(mockServer);
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        // Trigger error
        driver.executeScript('window.stateHooks.throwTestError()');
        // Wait for Sentry request
        await driver.wait(async () => {
          const isPending = await mockedEndpoint.isPending();
          return isPending === false;
        }, 10000);
        const [mockedRequest] = await mockedEndpoint.getSeenRequests();
        const mockJsonBody = mockedRequest.body.json;
        const { level, extra } = mockJsonBody;
        const [{ type, value }] = mockJsonBody.exception.values;
        const { participateInMetaMetrics } = extra.appState.store.metamask;
        // Verify request
        assert.equal(type, 'TestError');
        assert.equal(value, 'Test Error');
        assert.equal(level, 'error');
        assert.equal(participateInMetaMetrics, true);
      },
    );
  });
});
