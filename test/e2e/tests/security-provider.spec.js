const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  openDapp,
  unlockWallet,
} = require('../helpers');
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
        await mockServer.forPost(OPENSEA_URL).thenCallback(() => {
          return {
            statusCode: 200,
            json: {
              flagAsDangerous: 0,
            },
          };
        });
        break;
      case 'malicious':
        await mockServer.forPost(OPENSEA_URL).thenCallback(() => {
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
        break;
      case 'notSafe':
        await mockServer.forPost(OPENSEA_URL).thenCallback(() => {
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
        break;
      case 'requestNotVerified':
        await mockServer.forPost(OPENSEA_URL).thenCallback(() => {
          return {
            statusCode: 500,
            json: {},
          };
        });
        break;
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
        title: this.test.fullTitle(),
        testSpecificMock: async (mockServer) =>
          await mockSecurityProviderDetection(mockServer, 'malicious'),
        dapp: true,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);
        windowHandles = await driver.getAllWindowHandles();

        await driver.clickElement('#personalSign');

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        const warningHeader = await driver.isElementPresent({
          text: 'This could be a scam',
          tag: 'p',
        });
        assert.equal(warningHeader, true);
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
        title: this.test.fullTitle(),
        testSpecificMock: async (mockServer) =>
          await mockSecurityProviderDetection(mockServer, 'notSafe'),
        dapp: true,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);
        windowHandles = await driver.getAllWindowHandles();

        await driver.clickElement('#signTypedData');

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        const warningHeader = await driver.isElementPresent({
          text: 'Request may not be safe',
          tag: 'p',
        });
        assert.equal(warningHeader, true);
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
        title: this.test.fullTitle(),
        testSpecificMock: async (mockServer) =>
          await mockSecurityProviderDetection(mockServer, 'notMalicious'),
        dapp: true,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);
        windowHandles = await driver.getAllWindowHandles();

        await driver.clickElement('#siwe');

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        const warningHeader = await driver.isElementPresent({
          text: 'Request may not be safe',
          tag: 'p',
        });
        assert.equal(warningHeader, false);
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
        title: this.test.fullTitle(),
        testSpecificMock: async (mockServer) =>
          await mockSecurityProviderDetection(mockServer, 'requestNotVerified'),
        dapp: true,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);
        windowHandles = await driver.getAllWindowHandles();

        await driver.clickElement('#signTypedDataV4');

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        const warningHeader = await driver.isElementPresent({
          text: 'Request not verified',
          tag: 'p',
        });
        assert.equal(warningHeader, true);
      },
    );
  });
});
