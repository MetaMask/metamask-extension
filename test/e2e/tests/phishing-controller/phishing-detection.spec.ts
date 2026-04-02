import { strict as assert } from 'assert';
import { until } from 'selenium-webdriver';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import {
  withFixtures,
  createWebSocketConnection,
  veryLargeDelayMs,
} from '../../helpers';
import { WINDOW_TITLES } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import HomePage from '../../page-objects/pages/home/homepage';
import MockedPage from '../../page-objects/pages/mocked-page';
import PhishingWarningPage from '../../page-objects/pages/phishing-warning-page';
import { login } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import {
  setupPhishingDetectionMocks,
  mockConfigLookupOnWarningPage,
} from './mocks';
import {
  METAMASK_HOTLIST_DIFF_URL,
  METAMASK_STALELIST_URL,
  BlockProvider,
  DEFAULT_BLOCKED_DOMAIN,
  waitForPhishingBlocklistToBeLoaded,
} from './helpers';

describe('Phishing Detection', function (this: Suite) {
  describe('Phishing Detection Mock', function () {
    it('should be updated to use v1 of the API', function () {
      // Update the fixture in phishing-controller/mocks.js if this test fails
      assert.equal(
        METAMASK_STALELIST_URL,
        'https://phishing-detection.api.cx.metamask.io/v1/stalelist',
      );
      assert.equal(
        METAMASK_HOTLIST_DIFF_URL,
        'https://phishing-detection.api.cx.metamask.io/v2/diffsSince',
      );
    });
  });

  it('should display the MetaMask Phishing Detection page and take the user to the blocked page if they continue', async function () {
    if (process.env.SELENIUM_BROWSER === 'firefox') {
      this.skip();
    }
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          return setupPhishingDetectionMocks(mockServer, {
            statusCode: 200,
            blockProvider: BlockProvider.MetaMask,
            blocklist: ['127.0.0.1'],
            c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
            blocklistPaths: [],
          });
        },
        dappOptions: { numberOfTestDapps: 1 },
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await waitForPhishingBlocklistToBeLoaded(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        // To mitigate a race condition where 2 requests are made to the localhost:8080 which triggers a page refresh
        await driver.delay(veryLargeDelayMs);
        await driver.switchToWindowWithTitle('MetaMask Phishing Detection');

        // we need to wait for this selector to mitigate a race condition on the phishing page site
        // see more here https://github.com/MetaMask/phishing-warning/pull/173
        const phishingWarningPage = new PhishingWarningPage(driver);
        await phishingWarningPage.checkPageIsLoaded();
        await phishingWarningPage.clickProceedAnywayButton();
        await driver.wait(until.titleIs(WINDOW_TITLES.TestDApp), 10000);
      },
    );
  });

  describe('Via Iframe', function () {
    const DAPP_WITH_IFRAMED_PAGE_ON_BLOCKLIST = 'http://localhost:8081/';
    const IFRAMED_HOSTNAME = '127.0.0.1';

    const getFixtureOptions = (overrides: Record<string, unknown>) => {
      return {
        fixtures: new FixtureBuilderV2().build(),
        testSpecificMock: async (mockServer: Mockttp) => {
          return setupPhishingDetectionMocks(mockServer, {
            statusCode: 200,
            blockProvider: BlockProvider.MetaMask,
            blocklist: [IFRAMED_HOSTNAME],
            c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
            blocklistPaths: [],
          });
        },
        dappOptions: { numberOfTestDapps: 2 },
        ...overrides,
      };
    };

    it('should redirect users to the the MetaMask Phishing Detection page when an iframe domain is on the phishing blocklist', async function () {
      if (process.env.SELENIUM_BROWSER === 'firefox') {
        this.skip();
      }
      await withFixtures(
        getFixtureOptions({
          title: this.test?.fullTitle(),
          dappOptions: {
            numberOfTestDapps: 1,
            customDappPaths: [
              './tests/phishing-controller/mock-page-with-iframe',
            ],
          },
        }),
        async ({ driver }) => {
          await login(driver);
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await waitForPhishingBlocklistToBeLoaded(driver);
          await driver.openNewPage(DAPP_WITH_IFRAMED_PAGE_ON_BLOCKLIST);
          // we don't expect the iframe because early-phishing-detection redirects
          // the top level frame automatically.
          await driver.switchToWindowWithTitle('MetaMask Phishing Detection');
          const phishingWarningPage = new PhishingWarningPage(driver);
          await phishingWarningPage.checkPageIsLoaded();
          await phishingWarningPage.clickProceedAnywayButton();
          await driver.waitForWindowWithTitleToBePresent(
            WINDOW_TITLES.TestDApp,
            15000,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        },
      );
    });

    it('should display the MetaMask Phishing Detection page in an iframe and take the user to the blocked page if they continue', async function () {
      await withFixtures(
        getFixtureOptions({
          title: this.test?.fullTitle(),
          dappOptions: {
            numberOfTestDapps: 1,
            customDappPaths: [
              './tests/phishing-controller/mock-page-with-iframe-but-disable-early-detection',
            ],
          },
        }),
        async ({ driver }) => {
          await login(driver);
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await waitForPhishingBlocklistToBeLoaded(driver);
          await driver.openNewPage(DAPP_WITH_IFRAMED_PAGE_ON_BLOCKLIST);
          const phishingWarningPage = new PhishingWarningPage(driver);
          await phishingWarningPage.clickOpenWarningInNewTabLinkOnIframe();
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await new HomePage(driver).checkPageIsLoaded();

          await driver.switchToWindowWithTitle('MetaMask Phishing Detection');
          await phishingWarningPage.checkPageIsLoaded();
          await phishingWarningPage.clickProceedAnywayButton();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        },
      );
    });
  });

  it('should display the MetaMask Phishing Detection page in an iframe but should NOT take the user to the blocked page if it is not an accessible resource', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          return setupPhishingDetectionMocks(mockServer, {
            statusCode: 200,
            blockProvider: BlockProvider.MetaMask,
            blocklist: ['127.0.0.1'],
            c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
            blocklistPaths: [],
          });
        },
        dappOptions: {
          customDappPaths: [
            './tests/phishing-controller/mock-page-with-disallowed-iframe',
          ],
        },
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await waitForPhishingBlocklistToBeLoaded(driver);
        await driver.openNewPage(
          `http://localhost:8080?extensionUrl=${driver.extensionUrl}`,
        );

        const phishingWarningPage = new PhishingWarningPage(driver);
        await phishingWarningPage.clickOpenWarningInNewTabLinkOnIframe();
        await driver.switchToWindowWithTitle('MetaMask Phishing Detection');

        // we need to wait for this selector to mitigate a race condition on the phishing page site
        // see more here https://github.com/MetaMask/phishing-warning/pull/173
        await phishingWarningPage.checkPageIsLoaded();
        await phishingWarningPage.clickProceedAnywayButton();

        // We don't really know what we're going to see at this blocked site, so a waitAtLeast guard of 1000ms is the best choice
        await new HomePage(driver).checkPageIsNotLoaded();
      },
    );
  });

  it('should navigate the user to eth-phishing-detect to dispute a block if the phishing warning page fails to identify the source', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) => {
          setupPhishingDetectionMocks(mockServer, {
            statusCode: 200,
            blockProvider: BlockProvider.MetaMask,
            blocklist: ['127.0.0.1'],
            c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
            blocklistPaths: [],
          });
          mockConfigLookupOnWarningPage(mockServer, { statusCode: 500 });
        },
        dappOptions: { numberOfTestDapps: 1 },
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await waitForPhishingBlocklistToBeLoaded(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();

        await driver.switchToWindowWithTitle('MetaMask Phishing Detection');
        const phishingWarningPage = new PhishingWarningPage(driver);
        await phishingWarningPage.checkPageIsLoaded();
        await phishingWarningPage.clickReportDetectionProblemLink();

        // wait for page to load before checking URL.
        await new MockedPage(driver).checkDisplayedMessage(
          `Empty page by ${BlockProvider.MetaMask}`,
        );
        await driver.waitForUrl({
          url: `https://github.com/MetaMask/eth-phishing-detect/issues/new?title=[Legitimate%20Site%20Blocked]%20127.0.0.1&body=http%3A%2F%2F127.0.0.1%2F`,
        });
      },
    );
  });

  it('should navigate the user to eth-phishing-detect to dispute a block from MetaMask', async function () {
    // Must be site on actual eth-phishing-detect blocklist
    const phishingSite = new URL('https://test.metamask-phishing.io');

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          return setupPhishingDetectionMocks(mockServer, {
            statusCode: 200,
            blockProvider: BlockProvider.MetaMask,
            blocklist: [phishingSite.hostname],
            c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
            blocklistPaths: [],
          });
        },
        dappOptions: { numberOfTestDapps: 1 },
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await waitForPhishingBlocklistToBeLoaded(driver);
        await driver.openNewPage(phishingSite.href);

        await driver.switchToWindowWithTitle('MetaMask Phishing Detection');
        const phishingWarningPage = new PhishingWarningPage(driver);
        await phishingWarningPage.checkPageIsLoaded();
        await phishingWarningPage.clickReportDetectionProblemLink();

        // wait for page to load before checking URL.
        await new MockedPage(driver).checkDisplayedMessage(
          `Empty page by ${BlockProvider.MetaMask}`,
        );
        await driver.waitForUrl({
          url: `https://github.com/MetaMask/eth-phishing-detect/issues/new?title=[Legitimate%20Site%20Blocked]%20${encodeURIComponent(
            phishingSite.hostname,
          )}&body=${encodeURIComponent(`${phishingSite.origin}/`)}`,
        });
      },
    );
  });

  it('should open MetaMask Portfolio when clicking back to safety button', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          return setupPhishingDetectionMocks(mockServer, {
            statusCode: 200,
            blockProvider: BlockProvider.MetaMask,
            blocklist: ['127.0.0.1'],
            c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
            blocklistPaths: [],
          });
        },
        dappOptions: {
          customDappPaths: [
            './tests/phishing-controller/mock-page-with-disallowed-iframe',
          ],
        },
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await waitForPhishingBlocklistToBeLoaded(driver);
        await driver.openNewPage(
          `http://localhost:8080?extensionUrl=${driver.extensionUrl}`,
        );

        const phishingWarningPage = new PhishingWarningPage(driver);
        await phishingWarningPage.clickOpenWarningInNewTabLinkOnIframe();
        await driver.switchToWindowWithTitle('MetaMask Phishing Detection');
        await phishingWarningPage.checkPageIsLoaded();
        await phishingWarningPage.clickBackToSafetyButton();

        await driver.waitForUrl({
          url: `https://app.metamask.io/?metamaskEntry=phishing_page_portfolio_button`,
        });
      },
    );
  });

  it('should block a website that makes a websocket connection to a malicious command and control server', async function () {
    const testPageURL = 'http://localhost:8080';
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockServer.forAnyWebSocket().thenEcho();
          await setupPhishingDetectionMocks(mockServer, {
            statusCode: 200,
            blockProvider: BlockProvider.MetaMask,
            blocklist: ['127.0.0.1'],
            c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
            blocklistPaths: [],
          });
        },
        dappOptions: { numberOfTestDapps: 1 },
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await waitForPhishingBlocklistToBeLoaded(driver);

        await driver.openNewPage(testPageURL);

        await createWebSocketConnection(driver, 'malicious.localhost');

        await driver.switchToWindowWithTitle('MetaMask Phishing Detection');
        const phishingWarningPage = new PhishingWarningPage(driver);
        await phishingWarningPage.checkPageIsLoaded();
        await phishingWarningPage.clickBackToSafetyButton();

        await driver.waitForUrl({
          url: `https://app.metamask.io/?metamaskEntry=phishing_page_portfolio_button`,
        });
      },
    );
  });

  it('should not block a website that makes a safe WebSocket connection', async function () {
    const testPageURL = 'http://localhost:8080/';
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockServer.forAnyWebSocket().thenEcho();
          await setupPhishingDetectionMocks(mockServer, {
            statusCode: 200,
            blockProvider: BlockProvider.MetaMask,
            blocklist: ['127.0.0.1'],
            c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
            blocklistPaths: [],
          });
        },
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await waitForPhishingBlocklistToBeLoaded(driver);

        await driver.openNewPage(testPageURL);

        await createWebSocketConnection(driver, 'safe.localhost');

        await driver.wait(until.titleIs(WINDOW_TITLES.TestDApp), 10000);

        await driver.waitForUrl({
          url: testPageURL,
        });
      },
    );
  });
});
