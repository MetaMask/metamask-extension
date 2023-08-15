const { strict: assert } = require('assert');
const { Browser } = require('selenium-webdriver');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Sentry errors', function () {
  const migrationError =
    process.env.SELENIUM_BROWSER === Browser.CHROME
      ? `Cannot read properties of undefined (reading 'version')`
      : 'meta is undefined';
  async function mockSentryMigratorError(mockServer) {
    return await mockServer
      .forPost('https://sentry.io/api/0000000/envelope/')
      .withBodyIncluding(migrationError)
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {},
        };
      });
  }

  async function mockSentryTestError(mockServer) {
    return await mockServer
      .forPost('https://sentry.io/api/0000000/envelope/')
      .withBodyIncluding('Test Error')
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

  describe('before initialization', function () {
    it('should NOT send error events when participateInMetaMetrics is false', async function () {
      await withFixtures(
        {
          fixtures: {
            ...new FixtureBuilder()
              .withMetaMetricsController({
                metaMetricsId: null,
                participateInMetaMetrics: false,
              })
              .build(),
            // Intentionally corrupt state to trigger migration error during initialization
            meta: undefined,
          },
          ganacheOptions,
          title: this.test.title,
          failOnConsoleError: false,
          testSpecificMock: mockSentryMigratorError,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();

          // Wait for Sentry request
          await driver.delay(3000);
          const isPending = await mockedEndpoint.isPending();
          assert.ok(
            isPending,
            'A request to sentry was sent when it should not have been',
          );
        },
      );
    });
    it('should send error events', async function () {
      await withFixtures(
        {
          fixtures: {
            ...new FixtureBuilder()
              .withMetaMetricsController({
                metaMetricsId: 'fake-metrics-id',
                participateInMetaMetrics: true,
              })
              .build(),
            // Intentionally corrupt state to trigger migration error during initialization
            meta: undefined,
          },
          ganacheOptions,
          title: this.test.title,
          failOnConsoleError: false,
          testSpecificMock: mockSentryMigratorError,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();

          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, 3000);

          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = mockedRequest.body.text.split('\n');
          const mockJsonBody = JSON.parse(mockTextBody[2]);
          const { level } = mockJsonBody;
          const [{ type, value }] = mockJsonBody.exception.values;
          // Verify request
          assert.equal(type, 'TypeError');
          assert(value.includes(migrationError));
          assert.equal(level, 'error');
        },
      );
    });
  });

  describe('after initialization', function () {
    it('should NOT send error events when participateInMetaMetrics is false', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withMetaMetricsController({
              metaMetricsId: null,
              participateInMetaMetrics: false,
            })
            .build(),
          ganacheOptions,
          title: this.test.title,
          failOnConsoleError: false,
          testSpecificMock: mockSentryTestError,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await driver.fill('#password', 'correct horse battery staple');
          await driver.press('#password', driver.Key.ENTER);
          // Trigger error
          driver.executeScript('window.stateHooks.throwTestError()');
          driver.delay(3000);
          // Wait for Sentry request
          const isPending = await mockedEndpoint.isPending();
          assert.ok(
            isPending,
            'A request to sentry was sent when it should not have been',
          );
        },
      );
    });
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
          testSpecificMock: mockSentryTestError,
        },
        async ({ driver, mockedEndpoint }) => {
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
          const mockTextBody = mockedRequest.body.text.split('\n');
          const mockJsonBody = JSON.parse(mockTextBody[2]);
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
});
