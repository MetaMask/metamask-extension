const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

const OPENSEA_URL =
  'https://proxy.metafi.codefi.network/opensea/security/v1/validate';

/**
 * @param {import('mockttp').Mockttp} mockServer - The mock server.
 */

describe('Transaction security provider', function () {
  let windowHandles;

  async function mockSecurityProviderDetection(mockServer, scenario) {
    switch (scenario) {
      case 'notMalicious':
        return await mockServer.forPost(OPENSEA_URL).thenCallback(() => {
          return {
            statusCode: 200,
            json: {
              flagAsDangerous: 0,
            },
          };
        });
      case 'malicious':
        return await mockServer.forPost(OPENSEA_URL).thenCallback(() => {
          return {
            statusCode: 200,
            json: {
              flagAsDangerous: 1,
              reason:
                'If you sign this request, you may lose all of your assets for good',
              reason_header: 'This could be a scam',
            },
          };
        });
      case 'notSafe':
        return await mockServer.forPost(OPENSEA_URL).thenCallback(() => {
          return {
            statusCode: 200,
            json: {
              flagAsDangerous: 2,
              reason:
                'The security provider didn’t detect any known malicious activity, but it still may not be safe to continue.',
              reason_header: 'Request may not be safe',
            },
          };
        });
      case 'requestNotVerified':
        return await mockServer.forPost(OPENSEA_URL).thenCallback(() => {
          return {
            statusCode: 500,
            json: {},
          };
        });
      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }
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

  it('Should return malicious response', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            transactionSecurityCheckEnabled: true,
          })
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.title,
        dapp: true,
        failOnConsoleError: false,
      },
      async ({ driver, mockServer }) => {
        const mockedEndpoints = await mockSecurityProviderDetection(
          mockServer,
          'malicious',
        );
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.openNewPage('http://127.0.0.1:8080/');
        windowHandles = await driver.getAllWindowHandles();

        await driver.clickElement('#personalSign');

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        const warningHeader = await driver.isElementPresent({
          text: 'This could be a scam',
          tag: 'h5',
        });
        assert.equal(warningHeader, true);

        // Approve personal sign
        await driver.clickElement({ text: 'Sign', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        windowHandles = await driver.getAllWindowHandles();

        const mockedRequests = await mockedEndpoints.getSeenRequests();
        assert.equal(
          mockedRequests.length,
          1,
          'Unnecessary API requests have been sent',
        );
      },
    );
  });

  it('Should return not safe response', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            transactionSecurityCheckEnabled: true,
          })
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.title,
        dapp: true,
        failOnConsoleError: false,
      },
      async ({ driver, mockServer }) => {
        const mockedEndpoints = await mockSecurityProviderDetection(
          mockServer,
          'notSafe',
        );
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.openNewPage('http://127.0.0.1:8080/');
        windowHandles = await driver.getAllWindowHandles();

        await driver.clickElement('#signTypedData');

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        const warningHeader = await driver.isElementPresent({
          text: 'Request may not be safe',
          tag: 'h5',
        });
        assert.equal(warningHeader, true);

        // Approve signing typed data
        await driver.clickElement({ text: 'Sign', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        windowHandles = await driver.getAllWindowHandles();

        const mockedRequests = await mockedEndpoints.getSeenRequests();
        assert.equal(
          mockedRequests.length,
          1,
          'Unnecessary API requests have been sent',
        );
      },
    );
  });

  it('Should return not malicious response', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            transactionSecurityCheckEnabled: true,
          })
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.title,
        dapp: true,
        failOnConsoleError: false,
      },
      async ({ driver, mockServer }) => {
        const mockedEndpoints = await mockSecurityProviderDetection(
          mockServer,
          'notMalicious',
        );
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.openNewPage('http://127.0.0.1:8080/');
        windowHandles = await driver.getAllWindowHandles();

        await driver.clickElement('#siwe');

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        const warningNotSafeHeader = await driver.isElementPresent({
          text: 'Request may not be safe',
          tag: 'h5',
        });
        assert.equal(warningNotSafeHeader, false);

        const warningScamHeader = await driver.isElementPresent({
          text: 'This could be a scam',
          tag: 'h5',
        });
        assert.equal(warningScamHeader, false);

        const warningNotVerifiedHeader = await driver.isElementPresent({
          text: 'Request not verified',
          tag: 'h5',
        });
        assert.equal(warningNotVerifiedHeader, false);

        // Approve SIWE
        await driver.clickElement({ text: 'Sign-In', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        windowHandles = await driver.getAllWindowHandles();

        const mockedRequests = await mockedEndpoints.getSeenRequests();
        assert.equal(
          mockedRequests.length,
          1,
          'Unnecessary API requests have been sent',
        );
      },
    );
  });

  it('Should return request not verified response', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPreferencesController({
            transactionSecurityCheckEnabled: true,
          })
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.title,
        dapp: true,
        failOnConsoleError: false,
      },
      async ({ driver, mockServer }) => {
        const mockedEndpoints = await mockSecurityProviderDetection(
          mockServer,
          'requestNotVerified',
        );
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.openNewPage('http://127.0.0.1:8080/');
        windowHandles = await driver.getAllWindowHandles();

        await driver.clickElement('#signTypedDataV4');

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        const warningHeader = await driver.isElementPresent({
          text: 'Request not verified',
          tag: 'h5',
        });
        assert.equal(warningHeader, true);

        // Approve signing typed data V4
        await driver.clickElement(
          '[data-testid="signature-request-scroll-button"]',
        );
        await driver.clickElement({ text: 'Sign', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        windowHandles = await driver.getAllWindowHandles();

        const mockedRequests = await mockedEndpoints.getSeenRequests();
        assert.equal(
          mockedRequests.length,
          1,
          'Unnecessary API requests have been sent',
        );
      },
    );
  });
});
