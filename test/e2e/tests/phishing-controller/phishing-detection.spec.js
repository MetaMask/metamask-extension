const { strict: assert } = require('assert');

const {
  defaultGanacheOptions,
  withFixtures,
  openDapp,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
const {
  METAMASK_HOTLIST_DIFF_URL,
  METAMASK_STALELIST_URL,
  BlockProvider,
} = require('./helpers');

const {
  setupPhishingDetectionMocks,
  mockConfigLookupOnWarningPage,
} = require('./mocks');

describe('Phishing Detection', function () {
  describe('Phishing Detection Mock', function () {
    it('should be updated to use v1 of the API', function () {
      // Update the fixture in phishing-controller/mocks.js if this test fails
      assert.equal(
        METAMASK_STALELIST_URL,
        'https://phishing-detection.metafi.codefi.network/v1/stalelist',
      );
      assert.equal(
        METAMASK_HOTLIST_DIFF_URL,
        'https://phishing-detection.metafi.codefi.network/v1/diffsSince',
      );
    });
  });

  it('should display the MetaMask Phishing Detection page and take the user to the blocked page if they continue', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: async (mockServer) => {
          return setupPhishingDetectionMocks(mockServer, {
            blockProvider: BlockProvider.MetaMask,
            blocklist: ['127.0.0.1'],
          });
        },
        dapp: true,
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);
        await driver.switchToWindowWithTitle('MetaMask Phishing Detection');
        await driver.clickElement({
          text: 'continue to the site.',
        });
        const header = await driver.findElement('h1');
        assert.equal(await header.getText(), 'E2E Test Dapp');
      },
    );
  });

  it('should display the MetaMask Phishing Detection page in an iframe and take the user to the blocked page if they continue', async function () {
    const DAPP_WITH_IFRAMED_PAGE_ON_BLOCKLIST = 'http://localhost:8080/';
    const IFRAMED_HOSTNAME = '127.0.0.1';

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: async (mockServer) => {
          return setupPhishingDetectionMocks(mockServer, {
            blockProvider: BlockProvider.MetaMask,
            blocklist: [IFRAMED_HOSTNAME],
          });
        },
        dapp: true,
        dappPaths: ['mock-page-with-iframe'],
        dappOptions: {
          numberOfDapps: 2,
        },
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await driver.openNewPage(DAPP_WITH_IFRAMED_PAGE_ON_BLOCKLIST);

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
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: async (mockServer) => {
          return setupPhishingDetectionMocks(mockServer, {
            blockProvider: BlockProvider.MetaMask,
            blocklist: ['127.0.0.1'],
          });
        },
        dapp: true,
        dappPaths: ['mock-page-with-disallowed-iframe'],
        dappOptions: {
          numberOfDapps: 2,
        },
      },
      async ({ driver }) => {
        await unlockWallet(driver);
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

        // We don't really know what we're going to see at this blocked site, so a waitAtLeast guard of 1000ms is the best choice
        await driver.assertElementNotPresent(
          '[data-testid="wallet-balance"]',
          1000,
        );
      },
    );
  });

  it('should navigate the user to eth-phishing-detect to dispute a block if the phishing warning page fails to identify the source', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: (mockServer) => {
          setupPhishingDetectionMocks(mockServer, {
            blockProvider: BlockProvider.MetaMask,
            blocklist: ['127.0.0.1'],
          });
          mockConfigLookupOnWarningPage(mockServer, { statusCode: 500 });
        },
        dapp: true,
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        await driver.switchToWindowWithTitle('MetaMask Phishing Detection');
        await driver.clickElement({ text: 'report a detection problem.' });

        // wait for page to load before checking URL.
        await driver.findElement({
          text: `Empty page by ${BlockProvider.MetaMask}`,
        });
        assert.equal(
          await driver.getCurrentUrl(),
          `https://github.com/MetaMask/eth-phishing-detect/issues/new?title=[Legitimate%20Site%20Blocked]%20127.0.0.1&body=http%3A%2F%2F127.0.0.1%2F`,
        );
      },
    );
  });

  it('should navigate the user to eth-phishing-detect to dispute a block from MetaMask', async function () {
    // Must be site on actual eth-phishing-detect blocklist
    const phishingSite = new URL('https://test.metamask-phishing.io');

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: async (mockServer) => {
          return setupPhishingDetectionMocks(mockServer, {
            blockProvider: BlockProvider.MetaMask,
            blocklist: [phishingSite.hostname],
          });
        },
        dapp: true,
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await driver.openNewPage(phishingSite.href);

        await driver.switchToWindowWithTitle('MetaMask Phishing Detection');
        await driver.clickElement({ text: 'report a detection problem.' });

        // wait for page to load before checking URL.
        await driver.findElement({
          text: `Empty page by ${BlockProvider.MetaMask}`,
        });
        assert.equal(
          await driver.getCurrentUrl(),
          `https://github.com/MetaMask/eth-phishing-detect/issues/new?title=[Legitimate%20Site%20Blocked]%20${encodeURIComponent(
            phishingSite.hostname,
          )}&body=${encodeURIComponent(`${phishingSite.origin}/`)}`,
        );
      },
    );
  });

  it('should navigate the user to PhishFort to dispute a Phishfort Block', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: async (mockServer) => {
          return setupPhishingDetectionMocks(mockServer, {
            blockProvider: BlockProvider.PhishFort,
            blocklist: ['127.0.0.1'],
          });
        },
        dapp: true,
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await driver.openNewPage('http://127.0.0.1:8080');

        await driver.switchToWindowWithTitle('MetaMask Phishing Detection');
        await driver.clickElement({ text: 'report a detection problem.' });

        // wait for page to load before checking URL.
        await driver.findElement({
          text: `Empty page by ${BlockProvider.PhishFort}`,
        });
        assert.equal(
          await driver.getCurrentUrl(),
          `https://github.com/phishfort/phishfort-lists/issues/new?title=[Legitimate%20Site%20Blocked]%20127.0.0.1&body=http%3A%2F%2F127.0.0.1%2F`,
        );
      },
    );
  });

  it('should open a new extension expanded view when clicking back to safety button', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: async (mockServer) => {
          return setupPhishingDetectionMocks(mockServer, {
            blockProvider: BlockProvider.MetaMask,
            blocklist: ['127.0.0.1'],
          });
        },
        dapp: true,
        dappPaths: ['mock-page-with-disallowed-iframe'],
        dappOptions: {
          numberOfDapps: 2,
        },
      },
      async ({ driver }) => {
        await unlockWallet(driver);
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
