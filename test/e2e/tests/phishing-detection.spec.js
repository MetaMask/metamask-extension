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
            blacklist: ['localhost'],
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
  it('should display the MetaMask Phishing Detection page', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
        testSpecificMock: mockPhishingDetection,
        dapp: true,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        await driver.navigate();
        await driver.openNewPage('http://localhost:8080');
        const continueLink = await driver.waitForSelector({
          text: 'continuing at your own risk',
        });
        await continueLink.click();
        const header = await driver.findElement('h1');
        assert.equal(await header.getText(), 'E2E Test Dapp');
      },
    );
  });
});
