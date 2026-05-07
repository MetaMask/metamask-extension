import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { createDeferredPromise } from '@metamask/utils';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { configureFixtureSession } from '../../helpers/fixture-session';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import type { Driver } from '../../webdriver/driver';
import { setupPhishingDetectionMocks } from '../../tests/phishing-controller/mocks';
import {
  DEFAULT_BLOCKED_DOMAIN,
  BlockProvider,
} from '../../tests/phishing-controller/helpers';

/* eslint-disable mocha/no-top-level-hooks, mocha/no-sibling-hooks */

type BenchmarkMode = 'withFixtures' | 'sharedReset' | 'sharedNoReset';

const benchmarkMode = process.env
  .FIXTURE_SESSION_BENCHMARK_MODE as BenchmarkMode;

if (!['withFixtures', 'sharedReset', 'sharedNoReset'].includes(benchmarkMode)) {
  throw new Error(
    `Expected FIXTURE_SESSION_BENCHMARK_MODE to be "withFixtures", "sharedReset", or "sharedNoReset"; received "${benchmarkMode}".`,
  );
}

const redirectableStatusCodes = [200, 301, 302, 303, 307, 308] as const;
const destination = 'https://metamask.github.io/test-dapp/';
const blocked = '127.0.0.1';
const fixtureState = new FixtureBuilderV2().build();

async function setupPhishingMocks(mockServer: Mockttp): Promise<void> {
  await setupPhishingDetectionMocks(mockServer, {
    statusCode: 200,
    blockProvider: BlockProvider.MetaMask,
    blocklist: [blocked],
    c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
    blocklistPaths: [],
  });
}

function createRedirectServerHooks(): {
  getServer: () => Server;
  registerHooks: () => void;
} {
  let server: Server | undefined;

  return {
    getServer: () => {
      if (!server) {
        throw new Error('Redirect server is not ready.');
      }
      return server;
    },
    registerHooks: () => {
      before('Set up redirect server', async function () {
        const { promise, resolve, reject } = createDeferredPromise();
        server = createServer();
        server.on('error', reject);
        server.listen(0, blocked, resolve);
        await promise;
      });

      after('Shut down redirect server', async function () {
        if (server) {
          const { promise, resolve } = createDeferredPromise();
          server.close(() => resolve(undefined));
          server.closeAllConnections();
          await promise;
        }
      });

      afterEach('Ensure listeners are torn down between tests', function () {
        server?.removeAllListeners('request');
      });
    },
  };
}

function handleRequests(
  server: Server,
  name: string,
  value: string,
  code: number,
): void {
  server.once('request', async function (_request, response) {
    response.setHeader(name, value).writeHead(code).end(`
      <!doctype html>
      <html>
        <head>
          <meta http-equiv="Refresh" content="0;url="${destination}"/>
          <title>Phishing test</title>

          <script>
            document.location.href = "${destination}";
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

async function unlockAndWaitForBlocklist(driver: Driver): Promise<void> {
  await login(driver);
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await driver.wait(async () => {
    const state = await driver.executeScript(
      'return window.stateHooks.getPersistedState()',
    );
    const lists = state?.data?.PhishingController?.phishingLists;
    return Array.isArray(lists) && lists.length > 0;
  }, 90000);
  await driver.delay(2500);
}

async function runRedirectCase(driver: Driver, server: Server, code: number) {
  const address = server.address() as { port: number } | null;
  if (!address) {
    throw new Error('Server address is null');
  }

  const { port } = address;
  const refresh = { name: 'Refresh', value: `0;url="${destination}"` };
  const location = { name: 'Location', value: destination };
  const { name, value } = code === 200 ? refresh : location;
  handleRequests(server, name, value, code);

  const blockedUrl = `http://${blocked}:${port}/`;
  await driver.openNewURL(blockedUrl);

  await driver.waitForUrl({
    url: `http://localhost:9999/#hostname=${blocked}&href=http%3A%2F%2F${blocked}%3A${port}%2F`,
  });
}

function defineRedirectTests(getDriver: () => Driver, getServer: () => Server) {
  for (const code of redirectableStatusCodes) {
    // eslint-disable-next-line no-loop-func
    it(`blocks redirect status ${code}`, async function () {
      await runRedirectCase(getDriver(), getServer(), code);
    });
  }
}

if (benchmarkMode === 'withFixtures') {
  describe('Phishing redirect benchmark (withFixtures)', function () {
    const { getServer, registerHooks } = createRedirectServerHooks();

    registerHooks();

    for (const code of redirectableStatusCodes) {
      // eslint-disable-next-line no-loop-func
      it(`blocks redirect status ${code}`, async function () {
        await withFixtures(
          {
            fixtures: fixtureState,
            title: this.test?.fullTitle(),
            testSpecificMock: setupPhishingMocks,
          },
          async ({ driver }: { driver: Driver }) => {
            await unlockAndWaitForBlocklist(driver);
            await runRedirectCase(driver, getServer(), code);
          },
        );
      });
    }
  });
} else {
  configureFixtureSession(
    `Phishing redirect benchmark (${benchmarkMode})`,
    {
      fixtures: fixtureState,
      resetAfterEach: benchmarkMode === 'sharedReset',
      testSpecificMock: setupPhishingMocks,
    },
    ({ getDriver }) => {
      const { getServer, registerHooks } = createRedirectServerHooks();

      registerHooks();

      if (benchmarkMode === 'sharedReset') {
        beforeEach('Unlock extension and wait for blocklist', async function () {
          this.timeout(120000);
          await unlockAndWaitForBlocklist(getDriver());
        });
      } else {
        before('Unlock extension and wait for blocklist', async function () {
          this.timeout(120000);
          await unlockAndWaitForBlocklist(getDriver());
        });
      }

      defineRedirectTests(getDriver, getServer);
    },
  );
}
