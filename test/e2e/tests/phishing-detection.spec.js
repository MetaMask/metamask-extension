const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  openDapp,
  setupPhishingDetectionMocks,
  mockPhishingDetection,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Phishing Detection', function () {
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
        await openDapp(driver);
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
        await openDapp(driver);

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
        await openDapp(driver);

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
        await openDapp(driver);

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

  it('should open a new extension expanded view when clicking back to safety button', async function () {
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
          text: 'Back to safety',
        });

        // Ensure we're redirected to wallet home page
        const homePage = await driver.findElement('.home__main-view');
        const homePageDisplayed = await homePage.isDisplayed();

        assert.equal(homePageDisplayed, true);
      },
    );
  });
});
