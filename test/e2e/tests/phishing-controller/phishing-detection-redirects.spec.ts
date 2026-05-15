import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { createDeferredPromise } from '@metamask/utils';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import { setupPhishingDetectionMocks } from './mocks';
import {
  DEFAULT_BLOCKED_DOMAIN,
  BlockProvider,
  waitForPhishingBlocklistToBeLoaded,
} from './helpers';

describe('Phishing Detection - Redirect protections', function (this: Suite) {
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
              // Delay the canary to avoid a race condition for HTTP 200
              // responses: the browser renders the body before the phishing
              // content script can redirect, so a synchronous alert() fires
              // before the extension has a chance to act. The setTimeout
              // yields to the event loop, giving the redirect time to land.
              setTimeout(() => {
                alert("trying to prevent phishing protection");
                while(true){}
              }, 500);
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
        fixtures: new FixtureBuilderV2().build(),
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
    await login(driver);
    const homePage = new HomePage(driver);
    await homePage.checkPageIsLoaded();
    await waitForPhishingBlocklistToBeLoaded(driver);
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
