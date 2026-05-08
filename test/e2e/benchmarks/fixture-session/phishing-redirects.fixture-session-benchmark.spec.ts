import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { createDeferredPromise } from '@metamask/utils';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { configureFixtureSession } from '../../helpers/fixture-session';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import type { Driver } from '../../webdriver/driver';
import { setupPhishingDetectionMocks } from '../../tests/phishing-controller/mocks';
import {
  DEFAULT_BLOCKED_DOMAIN,
  BlockProvider,
} from '../../tests/phishing-controller/helpers';

/* eslint-disable mocha/no-top-level-hooks, mocha/no-sibling-hooks */

type BenchmarkMode =
  | 'withFixtures'
  | 'sharedReset'
  | 'sharedResetNoPreload'
  | 'sharedNoReset';

const benchmarkMode = process.env
  .FIXTURE_SESSION_BENCHMARK_MODE as BenchmarkMode;
const benchmarkModes = [
  'withFixtures',
  'sharedReset',
  'sharedResetNoPreload',
  'sharedNoReset',
];

if (!benchmarkModes.includes(benchmarkMode)) {
  throw new Error(
    `Expected FIXTURE_SESSION_BENCHMARK_MODE to be one of ${benchmarkModes.join(
      ', ',
    )}; received "${benchmarkMode}".`,
  );
}

const PROFILE_MARKER = '[fixture-benchmark-profile] ';
const redirectableStatusCodes = [200, 301, 302, 303, 307, 308] as const;
const destination = 'https://metamask.github.io/test-dapp/';
const blocked = '127.0.0.1';
const fixtureState = new FixtureBuilderV2().build();

function recordProfile(event: Record<string, unknown>): void {
  if (process.env.FIXTURE_SESSION_BENCHMARK_PROFILE !== 'true') {
    return;
  }

  console.log(
    `${PROFILE_MARKER}${JSON.stringify({
      mode: benchmarkMode,
      ...event,
    })}`,
  );
}

async function profilePhase<Result>(
  phase: string,
  operation: () => Promise<Result>,
  extra: Record<string, unknown> = {},
): Promise<Result> {
  const startedAt = Date.now();
  try {
    return await operation();
  } finally {
    recordProfile({ phase, ms: Date.now() - startedAt, ...extra });
  }
}

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
  await profilePhase('unlock.login', () =>
    login(driver, {
      validateBalance: false,
      waitForNonEvmAccounts: false,
    }),
  );
  await profilePhase('unlock.waitForBlocklist', () =>
    driver.wait(async () => {
      const state = await driver.executeScript(
        'return window.stateHooks.getPersistedState()',
      );
      const lists = state?.data?.PhishingController?.phishingLists;
      return Array.isArray(lists) && lists.length > 0;
    }, 90000),
  );
  await profilePhase('unlock.blocklistSettleDelay', () => driver.delay(2500));
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
  await profilePhase('redirect.openBlockedUrl', () =>
    driver.openNewURL(blockedUrl),
  );

  await profilePhase(
    'redirect.waitForPhishingWarningUrl',
    () =>
      driver.waitForUrl({
        url: `http://localhost:9999/#hostname=${blocked}&href=http%3A%2F%2F${blocked}%3A${port}%2F`,
      }),
    { code },
  );
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
          async ({
            driver,
            fixtureServer,
          }: {
            driver: Driver;
            fixtureServer: { getStateRequestStats?: () => unknown };
          }) => {
            await unlockAndWaitForBlocklist(driver);
            await runRedirectCase(driver, getServer(), code);
            recordProfile({
              phase: 'fixtureServer.stateRequests',
              code,
              stats: fixtureServer.getStateRequestStats?.(),
            });
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
      resetAfterEach:
        benchmarkMode === 'sharedReset' ||
        benchmarkMode === 'sharedResetNoPreload',
      resetStrategy:
        benchmarkMode === 'sharedResetNoPreload'
          ? 'reloadSkipFixtureInitialization'
          : 'reload',
      testSpecificMock: setupPhishingMocks,
    },
    ({ getDriver, getFixtures }) => {
      const { getServer, registerHooks } = createRedirectServerHooks();

      registerHooks();

      if (
        benchmarkMode === 'sharedReset' ||
        benchmarkMode === 'sharedResetNoPreload'
      ) {
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

      after('Record fixture server stats', function () {
        recordProfile({
          phase: 'fixtureServer.stateRequests',
          stats: getFixtures().fixtureServer.getStateRequestStats?.(),
        });
      });
    },
  );
}
