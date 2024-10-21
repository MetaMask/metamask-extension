const { strict: assert } = require('assert');
const { createServer } = require('node:http');
const { createDeferredPromise } = require('@metamask/utils');
const { until } = require('selenium-webdriver');

const {
  defaultGanacheOptions,
  withFixtures,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
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

/** @typedef {import('../../webdriver/driver').Driver} Driver */
/** @typedef {import('node:http').Server} Server */

describe('Phishing Detection', function () {
  describe('Phishing Detection Mock', function () {
    it('should be updated to use v1 of the API', function () {
      // Update the fixture in phishing-controller/mocks.js if this test fails
      assert.equal(
        METAMASK_STALELIST_URL,
        'https://phishing-detection.api.cx.metamask.io/v1/stalelist',
      );
      assert.equal(
        METAMASK_HOTLIST_DIFF_URL,
        'https://phishing-detection.api.cx.metamask.io/v1/diffsSince',
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
        await driver.wait(until.titleIs(WINDOW_TITLES.TestDApp), 10000);
      },
    );
  });

  describe('Via Iframe', function () {
    const DAPP_WITH_IFRAMED_PAGE_ON_BLOCKLIST = 'http://localhost:8080/';
    const IFRAMED_HOSTNAME = '127.0.0.1';

    const getFixtureOptions = (overrides) => {
      return {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        testSpecificMock: async (mockServer) => {
          return setupPhishingDetectionMocks(mockServer, {
            blockProvider: BlockProvider.MetaMask,
            blocklist: [IFRAMED_HOSTNAME],
          });
        },
        dapp: true,
        dappOptions: {
          numberOfDapps: 2,
        },
        ...overrides,
      };
    };

    function getTest(expectIframe = false) {
      return async ({ driver }) => {
        await unlockWallet(driver);
        await driver.openNewPage(DAPP_WITH_IFRAMED_PAGE_ON_BLOCKLIST);

        if (expectIframe) {
          const iframe = await driver.findElement('iframe');

          await driver.switchToFrame(iframe);
          await driver.clickElement({
            text: 'Open this warning in a new tab',
          });
        }

        await driver.switchToWindowWithTitle('MetaMask Phishing Detection');
        await driver.clickElement({
          text: 'continue to the site.',
        });

        await driver.wait(until.titleIs(WINDOW_TITLES.TestDApp), 10000);
      };
    }

    it('should redirect users to the the MetaMask Phishing Detection page when an iframe domain is on the phishing blocklist', async function () {
      await withFixtures(
        getFixtureOptions({
          title: this.test.fullTitle(),
          dappPaths: ['./tests/phishing-controller/mock-page-with-iframe'],
        }),
        // we don't expect the iframe because early-phishing-detection redirects
        // the top level frame automatically.
        getTest(false),
      );
    });

    it('should display the MetaMask Phishing Detection page in an iframe and take the user to the blocked page if they continue', async function () {
      await withFixtures(
        getFixtureOptions({
          title: this.test.fullTitle(),
          dappPaths: [
            './tests/phishing-controller/mock-page-with-iframe-but-disable-early-detection',
          ],
        }),
        getTest(true),
      );
    });
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
        dappPaths: [
          './tests/phishing-controller/mock-page-with-disallowed-iframe',
        ],
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
        dappPaths: [
          './tests/phishing-controller/mock-page-with-disallowed-iframe',
        ],
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

    /**
     * @type {Server | undefined}
     */
    let server;

    /**
     * @type {Driver | undefined}
     */
    let driver;

    /**
     * @type {Promise<void> | undefined}
     */
    let fixturePromise;

    /**
     *  Handle requests by setting the given header values and status code.
     *
     * @param {string} name - The name of the header to set.
     * @param {string} value - The value of the header to set.
     * @param {typeof redirectableStatusCodes[number]} code - The status code
     * @returns {void}
     */
    function handleRequests(name, value, code) {
      server.once('request', async function (_request, response) {
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
        server.close(() => resolve());
        // We need to close all connections to stop the server quickly
        // Otherwise it takes a few seconds for it to close
        server.closeAllConnections();
        await promise;
      }
    });
    before('Set up fixtures', async function () {
      /**
       * @type {{ promise: Promise<Driver>, resolve: (driver: Driver) => void } | undefined
       */
      const { promise, resolve } = createDeferredPromise();
      fixturePromise = withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
          testSpecificMock: async (mockServer) => {
            await setupPhishingDetectionMocks(mockServer, {
              blockProvider: BlockProvider.MetaMask,
              blocklist: [blocked],
            });
          },
        },
        async (fixtures) => {
          resolve(fixtures.driver); // resolve this `beforeEach`
          await deferredTestSuite.promise; // now wait for all tests to complete
        },
      );
      driver = await promise;

      // required to ensure MetaMask is fully started before running tests
      // if we had a way of detecting when the offscreen/background were ready
      // we could remove this
      await unlockWallet(driver);
    });
    after('Shut down fixtures', async function () {
      deferredTestSuite.resolve(); // let the fixtures know tests are complete
      await fixturePromise; // wait for fixtures to shutdown
    });
    afterEach('Ensure listeners are torn down between tests', function () {
      server.removeAllListeners('request');
    });
    afterEach('Reset current window to about:blank', async function () {
      await driver.openNewURL(`about:blank`);
    });
    /* eslint-enable mocha/no-hooks-for-single-case, mocha/no-sibling-hooks */

    for (const code of redirectableStatusCodes) {
      // This rule is flagging unsafe references to `server` and `driver`, but
      // they are being used safely here. We are intentionally sharing one
      // instance for each test.
      // eslint-disable-next-line no-loop-func
      it(`should display the MetaMask Phishing Detection page if a blocked site redirects via HTTP Status Code ${code} to another page`, async function () {
        const { port } = server.address();
        const refresh = { name: 'Refresh', value: `0;url="${destination}"` };
        const location = { name: 'Location', value: destination };
        const { name, value } = code === 200 ? refresh : location;
        handleRequests(name, value, code);
        // navigate to the blocked site (it tries to redirect to the destination)
        const blockedUrl = `http://${blocked}:${port}/`;
        await driver.openNewURL(blockedUrl);
        // check that the redirect was ultimately _not_ followed and instead
        // went to our "MetaMask Phishing Detection" site
        assert.equal(
          await driver.getCurrentUrl(),
          // http://localhost:9999 is the Phishing Warning page
          `http://localhost:9999/#hostname=${blocked}&href=http%3A%2F%2F${blocked}%3A${port}%2F`,
        );
      });
    }
  });
});
