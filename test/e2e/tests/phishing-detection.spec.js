const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Phishing Detection', function () {
  async function mockPhishingDetection(mockServer) {
    await mockServer
      .forGet(
        'https://cdn.jsdelivr.net/gh/MetaMask/eth-phishing-detect@master/src/config.json',
      )
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            version: 2,
            tolerance: 2,
            fuzzylist: [],
            whitelist: [],
            blacklist: ['127.0.0.1'],
          },
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
  it('should display the MetaMask Phishing Detection page and take the user to the blocked page if they continue', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
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
          text: 'continuing at your own risk',
        });
        const header = await driver.findElement('h1');
        assert.equal(await header.getText(), 'E2E Test Dapp');
      },
    );
  });

  it('should display the MetaMask Phishing Detection page in an iframe and take the user to the blocked page if they continue', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
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
          text: 'continuing at your own risk',
        });
        const header = await driver.findElement('h1');
        assert.equal(await header.getText(), 'E2E Test Dapp');
      },
    );
  });

  it('should display the MetaMask Phishing Detection page in an iframe but should NOT take the user to the blocked page if it is not an accessible resource', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
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
          text: 'continuing at your own risk',
        });

        // Ensure we're not on the wallet home page
        await driver.assertElementNotPresent('[data-testid="wallet-balance"]');
      },
    );
  });
});
