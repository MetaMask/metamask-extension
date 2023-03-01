const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

const STALELIST_URL =
  'https://static.metafi.codefi.network/api/v1/lists/stalelist.json';

const emptyHtmlPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>title</title>
  </head>
  <body>
    Empty page
  </body>
</html>`;

/**
 * Setup fetch mocks for the phishing detection feature.
 *
 * The mock configuration will show that "127.0.0.1" is blocked. The dynamic lookup on the warning
 * page can be customized, so that we can test both the MetaMask and PhishFort block cases.
 *
 * @param {import('mockttp').Mockttp} mockServer - The mock server.
 * @param {object} metamaskPhishingConfigResponse - The response for the dynamic phishing
 * configuration lookup performed by the warning page.
 */
async function setupPhishingDetectionMocks(
  mockServer,
  metamaskPhishingConfigResponse,
) {
  await mockServer.forGet(STALELIST_URL).thenCallback(() => {
    return {
      statusCode: 200,
      json: {
        version: 2,
        tolerance: 2,
        fuzzylist: [],
        allowlist: [],
        blocklist: ['127.0.0.1'],
        lastUpdated: 0,
      },
    };
  });

  await mockServer
    .forGet('https://github.com/MetaMask/eth-phishing-detect/issues/new')
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: emptyHtmlPage,
      };
    });
  await mockServer
    .forGet('https://github.com/phishfort/phishfort-lists/issues/new')
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: emptyHtmlPage,
      };
    });

  await mockServer
    .forGet(
      'https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/master/src/config.json',
    )
    .thenCallback(() => metamaskPhishingConfigResponse);
}

describe('Phishing Detection', function () {
  function mockPhishingDetection(mockServer) {
    setupPhishingDetectionMocks(mockServer, {
      statusCode: 200,
      json: {
        version: 2,
        tolerance: 2,
        fuzzylist: [],
        whitelist: [],
        blacklist: ['127.0.0.1'],
        lastUpdated: 0,
      },
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

  it('should display the MetaMask Phishing Detection page and take the user to the blocked page if they continue', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
        testSpecificMock: mockPhishingDetection,
        dapp: true,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        await driver.openNewPage('http://127.0.0.1:8080');
        await driver.clickElement({
          text: 'continue to the site.',
        });
        const header = await driver.findElement('h1');
        assert.equal(await header.getText(), 'E2E Test Dapp');
      },
    );
  });

  it('should display the MetaMask Phishing Detection page in an iframe and take the user to the blocked page if they continue', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
        testSpecificMock: mockPhishingDetection,
        dapp: true,
        dappPaths: ['mock-page-with-iframe'],
        dappOptions: {
          numberOfDapps: 2,
        },
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        await driver.openNewPage('http://localhost:8080/');

        const iframe = await driver.findElement('iframe');

        await driver.switchToFrame(iframe);
        await driver.clickElement({
          text: 'Open this warning in a new tab',
        });
        await driver.switchToWindowWithTitle('MetaMask Phishing Detection');
        await driver.clickElement({
          text: 'continue to the site.',
        });
        const header = await driver.findElement('h1');
        assert.equal(await header.getText(), 'E2E Test Dapp');
      },
    );
  });

  it('should display the MetaMask Phishing Detection page in an iframe but should NOT take the user to the blocked page if it is not an accessible resource', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
        testSpecificMock: mockPhishingDetection,
        dapp: true,
        dappPaths: ['mock-page-with-disallowed-iframe'],
        dappOptions: {
          numberOfDapps: 2,
        },
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        await driver.openNewPage(
          `http://localhost:8080?extensionUrl=${driver.extensionUrl}`,
        );

        const iframe = await driver.findElement('iframe');

        await driver.switchToFrame(iframe);
        await driver.clickElement({
          text: 'Open this warning in a new tab',
        });
        await driver.switchToWindowWithTitle('MetaMask Phishing Detection');
        await driver.clickElement({
          text: 'continue to the site.',
        });

        // Ensure we're not on the wallet home page
        await driver.assertElementNotPresent('[data-testid="wallet-balance"]');
      },
    );
  });

  it('should navigate the user to eth-phishing-detect to dispute a block if the phishing warning page fails to identify the source', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
        testSpecificMock: (mockServer) => {
          setupPhishingDetectionMocks(mockServer, { statusCode: 500 });
        },
        dapp: true,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        await driver.openNewPage('http://127.0.0.1:8080');

        await driver.clickElement({ text: 'report a detection problem.' });

        // wait for page to load before checking URL.
        await driver.findElement({ text: 'Empty page' });
        assert.equal(
          await driver.getCurrentUrl(),
          `https://github.com/MetaMask/eth-phishing-detect/issues/new?title=[Legitimate%20Site%20Blocked]%20127.0.0.1&body=http%3A%2F%2F127.0.0.1%3A8080%2F`,
        );
      },
    );
  });

  it('should navigate the user to eth-phishing-detect to dispute a block from MetaMask', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
        testSpecificMock: mockPhishingDetection,
        dapp: true,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        await driver.openNewPage('http://127.0.0.1:8080');

        await driver.clickElement({ text: 'report a detection problem.' });

        // wait for page to load before checking URL.
        await driver.findElement({ text: 'Empty page' });
        assert.equal(
          await driver.getCurrentUrl(),
          `https://github.com/MetaMask/eth-phishing-detect/issues/new?title=[Legitimate%20Site%20Blocked]%20127.0.0.1&body=http%3A%2F%2F127.0.0.1%3A8080%2F`,
        );
      },
    );
  });

  it('should navigate the user to PhishFort to dispute a block from MetaMask', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
        testSpecificMock: (mockServer) => {
          setupPhishingDetectionMocks(mockServer, {
            statusCode: 200,
            json: {
              version: 2,
              tolerance: 2,
              fuzzylist: [],
              whitelist: [],
              blacklist: [],
              lastUpdated: 0,
            },
          });
        },
        dapp: true,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        await driver.openNewPage('http://127.0.0.1:8080');

        await driver.clickElement({ text: 'report a detection problem.' });

        // wait for page to load before checking URL.
        await driver.findElement({ text: 'Empty page' });
        assert.equal(
          await driver.getCurrentUrl(),
          `https://github.com/phishfort/phishfort-lists/issues/new?title=[Legitimate%20Site%20Blocked]%20127.0.0.1&body=http%3A%2F%2F127.0.0.1%3A8080%2F`,
        );
      },
    );
  });
});
