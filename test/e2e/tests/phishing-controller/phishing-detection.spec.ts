import { strict as assert } from 'assert';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { createDeferredPromise } from '@metamask/utils';
import { until } from 'selenium-webdriver';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import {
  withFixtures,
  createWebSocketConnection,
  veryLargeDelayMs,
} from '../../helpers';
import { WINDOW_TITLES } from '../../constants';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import MockedPage from '../../page-objects/pages/mocked-page';
import PhishingWarningPage from '../../page-objects/pages/phishing-warning-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import {
  setupPhishingDetectionMocks,
  mockConfigLookupOnWarningPage,
} from './mocks';
import {
  METAMASK_HOTLIST_DIFF_URL,
  METAMASK_STALELIST_URL,
  BlockProvider,
} from './helpers';

// Common test constants
const DEFAULT_BLOCKED_DOMAIN =
  'a379a6f6eeafb9a55e378c118034e2751e682fab9f2d30ab13d2125586ce1947';

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
        fixtures: new FixtureBuilder().build(),
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
        await loginWithBalanceValidation(driver);
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
        fixtures: new FixtureBuilder().build(),
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
          await loginWithBalanceValidation(driver);
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
          await loginWithBalanceValidation(driver);
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
        fixtures: new FixtureBuilder().build(),
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
        await loginWithBalanceValidation(driver);
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
        fixtures: new FixtureBuilder().build(),
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
        await loginWithBalanceValidation(driver);
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
        fixtures: new FixtureBuilder().build(),
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
        await loginWithBalanceValidation(driver);
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
        fixtures: new FixtureBuilder().build(),
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
        await loginWithBalanceValidation(driver);
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
        fixtures: new FixtureBuilder().build(),
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
        await loginWithBalanceValidation(driver);

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
        fixtures: new FixtureBuilder().build(),
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
        await loginWithBalanceValidation(driver);

        await driver.openNewPage(testPageURL);

        await createWebSocketConnection(driver, 'safe.localhost');

        await driver.wait(until.titleIs(WINDOW_TITLES.TestDApp), 10000);

        await driver.waitForUrl({
          url: testPageURL,
        });
      },
    );
  });

  describe('Phishing redirect protections', function () {
    /**
     * Status codes 305 (via Location header) and 306 (Set-Proxy) header do not
     * automatically forward user agents to the new location, so we don't test
     * these status codes. Status code 304 (Not Modified) is not a redirect
     * status code.
     *
     * 201 _does_ require a Location header, but it also doesn't get
     * automatically redirected by the user-agent, so we don't test it either.
     *
     * 200 is only included in order to test the `Refresh` header.
     *
     * @type {readonly [200 | 301 | 302 | 303 | 307 | 308]}
     */
    const redirectableStatusCodes = [200, 301, 302, 303, 307, 308];

    const destination = 'https://metamask.github.io/test-dapp/';
    const blocked = '127.0.0.1';

    let server: Server | undefined;
    let driver: Driver | undefined;
    let fixturePromise: Promise<void> | undefined;

    /**
     * Handle requests by setting the given header values and status code.
     *
     * @param name - The name of the header to set.
     * @param value - The value of the header to set.
     * @param code - The status code
     */
    function handleRequests(name: string, value: string, code: number): void {
      server?.once('request', async function (_request, response) {
        response.setHeader(name, value).writeHead(code).end(`
        <!doctype html>
        <html>
          <head>
            <meta http-equiv="Refresh" content="0;url="${destination}"/>
            <title>Phishing test</title>

            <script>
              // this script should not run.
              // it is meant to test for regressions in our redirect
              // protection due to changes in either MetaMask or browsers.
              document.location.href = "${destination}";
              alert("trying to prevent phishing protection");
              while(true){}
            </script>
          </head>
          <body>
            <h1>Redirecting...</h1>
          </body>
        </html>
        `);
      });
    }

    const deferredTestSuite = createDeferredPromise();

    /*  eslint-disable mocha/no-hooks-for-single-case, mocha/no-sibling-hooks */
    before('Set up redirect server', async function () {
      const { promise, resolve, reject } = createDeferredPromise();
      server = createServer();
      server.listen(0, blocked, resolve);
      server.on('error', reject);
      await promise;
    });
    after('Shut down redirect server', async function () {
      if (server) {
        const { promise, resolve } = createDeferredPromise();
        server.close(() => resolve(undefined));
        // We need to close all connections to stop the server quickly
        // Otherwise it takes a few seconds for it to close
        server.closeAllConnections();
        await promise;
      }
    });
    before('Set up fixtures', async function () {
      const { promise, resolve } = createDeferredPromise<Driver>();
      fixturePromise = withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: async (mockServer: Mockttp) => {
            await setupPhishingDetectionMocks(mockServer, {
              statusCode: 200,
              blockProvider: BlockProvider.MetaMask,
              blocklist: [blocked],
              c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
              blocklistPaths: [],
            });
          },
        },
        async (fixtures: { driver: Driver }) => {
          resolve(fixtures.driver); // resolve this `beforeEach`
          await deferredTestSuite.promise; // now wait for all tests to complete
        },
      );
      driver = await promise;

      // required to ensure MetaMask is fully started before running tests
      // if we had a way of detecting when the offscreen/background were ready
      // we could remove this
      await loginWithBalanceValidation(driver);
    });
    after('Shut down fixtures', async function () {
      deferredTestSuite.resolve(); // let the fixtures know tests are complete
      await fixturePromise; // wait for fixtures to shutdown
    });
    afterEach('Ensure listeners are torn down between tests', function () {
      server?.removeAllListeners('request');
    });
    afterEach('Reset current window to about:blank', async function () {
      await driver?.openNewURL(`about:blank`);
    });
    /* eslint-enable mocha/no-hooks-for-single-case, mocha/no-sibling-hooks */

    for (const code of redirectableStatusCodes) {
      // This rule is flagging unsafe references to `server` and `driver`, but
      // they are being used safely here. We are intentionally sharing one
      // instance for each test.
      // eslint-disable-next-line no-loop-func
      it(`should display the MetaMask Phishing Detection page if a blocked site redirects via HTTP Status Code ${code} to another page`, async function () {
        const address = server?.address() as { port: number } | null;
        if (!address) {
          throw new Error('Server address is null');
        }
        const { port } = address;
        const refresh = { name: 'Refresh', value: `0;url="${destination}"` };
        const location = { name: 'Location', value: destination };
        const { name, value } = code === 200 ? refresh : location;
        handleRequests(name, value, code);
        // navigate to the blocked site (it tries to redirect to the destination)
        const blockedUrl = `http://${blocked}:${port}/`;
        await driver?.openNewURL(blockedUrl);
        // check that the redirect was ultimately _not_ followed and instead
        // went to our "MetaMask Phishing Detection" site

        await driver?.waitForUrl({
          url:
            // http://localhost:9999 is the Phishing Warning page
            `http://localhost:9999/#hostname=${blocked}&href=http%3A%2F%2F${blocked}%3A${port}%2F`,
        });
      });
    }
  });

  describe('Path-based URLs', function () {
    describe('blocklisted paths', function () {
      it('displays the MetaMask Phishing Detection page when accessing a blocklisted path', async function () {
        await withFixtures(
          {
            fixtures: new FixtureBuilder().build(),
            title: this.test?.fullTitle(),
            testSpecificMock: async (mockServer: Mockttp) => {
              return setupPhishingDetectionMocks(mockServer, {
                statusCode: 200,
                blockProvider: BlockProvider.MetaMask,
                blocklist: [],
                c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
                blocklistPaths: ['127.0.0.1/path1'],
              });
            },
            dappOptions: {
              customDappPaths: [
                './tests/phishing-controller/mock-page-with-paths',
              ],
            },
          },
          async ({ driver }) => {
            await loginWithBalanceValidation(driver);

            await driver.openNewPage('http://127.0.0.1:8080/path1/');
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Phishing);
            const phishingWarningPage = new PhishingWarningPage(driver);
            await phishingWarningPage.checkPageIsLoaded();
          },
        );
      });

      it('blocks access to blocklisted subpaths', async function () {
        await withFixtures(
          {
            fixtures: new FixtureBuilder().build(),
            title: this.test?.fullTitle(),
            testSpecificMock: async (mockServer: Mockttp) => {
              return setupPhishingDetectionMocks(mockServer, {
                statusCode: 200,
                blockProvider: BlockProvider.MetaMask,
                blocklist: [],
                c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
                blocklistPaths: ['127.0.0.1/path1'],
              });
            },
            dappOptions: {
              customDappPaths: [
                './tests/phishing-controller/mock-page-with-paths',
              ],
            },
          },
          async ({ driver }) => {
            await loginWithBalanceValidation(driver);

            await driver.openNewPage('http://127.0.0.1:8080/path1/path2');

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Phishing);
            const phishingWarningPage = new PhishingWarningPage(driver);
            await phishingWarningPage.checkPageIsLoaded();
          },
        );
      });
    });

    describe('whitelisted paths', function () {
      it('does not display the MetaMask Phishing Detection page when accessing a whitelisted path', async function () {
        if (process.env.SELENIUM_BROWSER === 'firefox') {
          this.skip();
        }
        await withFixtures(
          {
            fixtures: new FixtureBuilder().build(),
            title: this.test?.fullTitle(),
            testSpecificMock: async (mockServer: Mockttp) => {
              return setupPhishingDetectionMocks(mockServer, {
                statusCode: 200,
                blockProvider: BlockProvider.MetaMask,
                blocklist: [],
                c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
                blocklistPaths: ['127.0.0.1/path1'],
              });
            },
            dappOptions: {
              customDappPaths: [
                './tests/phishing-controller/mock-page-with-paths',
              ],
            },
          },
          async ({ driver }) => {
            await loginWithBalanceValidation(driver);

            await driver.openNewPage('http://127.0.0.1:8080/path1/');
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Phishing);
            const phishingWarningPage = new PhishingWarningPage(driver);
            await phishingWarningPage.checkPageIsLoaded();
            await phishingWarningPage.clickProceedAnywayButton();

            // Wait for navigation to complete
            await driver.waitForWindowWithTitleToBePresent(
              'Mock E2E Phishing Page: Path 1',
              15000,
            );
            await driver.switchToWindowWithTitle(
              'Mock E2E Phishing Page: Path 1',
            );
          },
        );
      });

      it('when the subpath is whitelisted, the phishing warning page is not displayed for the blocklisted path and all subpaths', async function () {
        if (process.env.SELENIUM_BROWSER === 'firefox') {
          this.skip();
        }
        await withFixtures(
          {
            fixtures: new FixtureBuilder().build(),
            title: this.test?.fullTitle(),
            testSpecificMock: async (mockServer: Mockttp) => {
              return setupPhishingDetectionMocks(mockServer, {
                statusCode: 200,
                blockProvider: BlockProvider.MetaMask,
                blocklist: [],
                c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
                blocklistPaths: ['127.0.0.1/path1'],
              });
            },
            dappOptions: {
              customDappPaths: [
                './tests/phishing-controller/mock-page-with-paths',
              ],
            },
          },
          async ({ driver }) => {
            await loginWithBalanceValidation(driver);

            await driver.openNewPage('http://127.0.0.1:8080/path1/path2');
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Phishing);
            const phishingWarningPage = new PhishingWarningPage(driver);
            await phishingWarningPage.checkPageIsLoaded();
            await phishingWarningPage.clickProceedAnywayButton();
            await driver.waitForWindowWithTitleToBePresent(
              'Mock E2E Phishing Page: Path 2',
              15000,
            );
            await driver.switchToWindowWithTitle(
              'Mock E2E Phishing Page: Path 2',
            );

            await driver.openNewPage('http://127.0.0.1:8080/path1');
            await driver.wait(
              until.titleIs('Mock E2E Phishing Page: Path 1'),
              10000,
            );
          },
        );
      });
    });
  });
});
