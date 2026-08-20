import { createDeferredPromise } from '@metamask/utils';
import type { Mockttp } from 'mockttp';
import { getServerMochaToBackground } from '../background-socket/server-mocha-to-background';
import type { Driver } from '../webdriver/driver';
import { withFixtures } from '../helpers';

type WithFixturesOptions = Parameters<typeof withFixtures>[0];
type WithFixturesTestSuite = Parameters<typeof withFixtures>[1];

type FixtureSessionContext = Parameters<WithFixturesTestSuite>[0] & {
  driver: Driver;
};

/**
 * Options accepted by the default (plain `withFixtures`) runner. Wrappers
 * with richer option shapes (e.g. `withTronFixtures`, whose `testSpecificMock`
 * takes a second `context` argument and whose `fixtures` is optional) pass
 * their own `TRunnerOptions` to `configureFixtureSession` instead of this
 * default.
 */
type BaseFixtureSessionRunnerOptions = WithFixturesOptions & {
  fixtures: unknown;
  testSpecificMock?: (mockServer: Mockttp) => unknown | Promise<unknown>;
};

/**
 * Fixture runner used to start the shared session. Generic so wrappers with
 * richer option/context shapes (e.g. `withTronFixtures`) can be plugged in
 * via `runFixtures` without casting: `TRunnerOptions` is whatever options the
 * runner itself expects, and `TRunnerContext` is the context it hands to the
 * test suite callback.
 */
export type FixtureSessionRunner<
  TRunnerOptions extends object = BaseFixtureSessionRunnerOptions,
  TRunnerContext extends { driver: Driver } = FixtureSessionContext,
> = (
  options: TRunnerOptions,
  testSuite: (context: TRunnerContext) => Promise<void> | void,
) => Promise<void>;

export type FixtureSessionOptions<
  TRunnerOptions extends object = BaseFixtureSessionRunnerOptions,
  TRunnerContext extends { driver: Driver } = FixtureSessionContext,
> = TRunnerOptions & {
  // When true, skip the remaining tests in the suite after the first test
  // failure (fail-fast). Defaults to false.
  failFast?: boolean;
  // When false, the between-test afterEach neither closes auxiliary windows
  // nor navigates to about:blank. Defaults to true (current behavior).
  navigateAfterEach?: boolean;
  resetAfterEach?: boolean;
  // Fixture runner that starts the shared session. Defaults to `withFixtures`.
  runFixtures?: FixtureSessionRunner<TRunnerOptions, TRunnerContext>;
};

export type FixtureSessionAccessors<
  TRunnerContext extends { driver: Driver } = FixtureSessionContext,
> = {
  getDriver: () => Driver;
  getFixtures: () => TRunnerContext;
};

const OFFSCREEN_PAGE_PATH = '/offscreen.html';
const CHROME_EXTENSION_PROTOCOL = 'chrome-extension://';

function getRunnableTests(suite: Mocha.Suite): Mocha.Test[] {
  return [
    ...suite.tests.filter((test) => !test.pending),
    ...suite.suites.flatMap(getRunnableTests),
  ];
}

function hasNextRunnableTest(
  sharedSuite: Mocha.Suite,
  currentTest: Mocha.Test,
): boolean {
  const runnableTests = getRunnableTests(sharedSuite);
  const currentTestIndex = runnableTests.indexOf(currentTest);

  return currentTestIndex < runnableTests.length - 1;
}

function shouldResetSharedFixtureSession(
  sharedSuite: Mocha.Suite,
  currentTest: Mocha.Test,
): boolean {
  return (
    currentTest.state === 'failed' ||
    hasNextRunnableTest(sharedSuite, currentTest)
  );
}

async function getReloadSurvivorWindow(driver: Driver): Promise<string> {
  const currentWindow = await driver.getCurrentWindowHandle();
  const currentUrl = await driver.getCurrentUrl().catch((error) => {
    console.warn(
      'getReloadSurvivorWindow: failed to read the current window URL; ' +
        'falling back to treating it as a non-extension page.',
      error,
    );
    return '';
  });

  if (!currentUrl.startsWith(driver.extensionUrl)) {
    return currentWindow;
  }

  const survivorWindow = await driver.openNewPage('about:blank');
  await driver.switchToWindow(currentWindow);
  return survivorWindow;
}

async function sendChromeDevToolsCommand(
  driver: Driver,
  command: string,
  params: Record<string, unknown> = {},
): Promise<void> {
  const seleniumDriver = driver.driver as {
    sendAndGetDevToolsCommand?: (
      commandName: string,
      commandParams?: Record<string, unknown>,
    ) => Promise<unknown>;
  };

  if (!seleniumDriver.sendAndGetDevToolsCommand) {
    throw new Error('Chrome DevTools Protocol is not available.');
  }

  await seleniumDriver.sendAndGetDevToolsCommand(command, params);
}

async function restartChromeServiceWorker(driver: Driver): Promise<void> {
  const scopeURL = driver.extensionUrl.endsWith('/')
    ? driver.extensionUrl
    : `${driver.extensionUrl}/`;
  const backgroundSocket = getServerMochaToBackground();
  const connectionVersion = backgroundSocket.getConnectionVersion();

  await sendChromeDevToolsCommand(driver, 'ServiceWorker.enable');
  await sendChromeDevToolsCommand(driver, 'ServiceWorker.stopAllWorkers');
  await sendChromeDevToolsCommand(driver, 'ServiceWorker.startWorker', {
    scopeURL,
  });
  await backgroundSocket.waitForConnectionAfter(connectionVersion);
  // The tab that was active before the restart may hold a message port or
  // other reference tied to the now-dead service worker instance. Open a
  // fresh, neutral tab so the session has a live, non-extension page to
  // continue from instead of a stale extension page.
  await driver.openNewPage('about:blank');
}

/**
 * Closes any user-visible auxiliary tabs/windows that were opened during a
 * shared-session test, while preserving the current tab and the MV3 offscreen
 * page.
 *
 * @param driver - The active shared-session driver.
 */
async function closeAuxiliaryWindows(driver: Driver): Promise<void> {
  const currentHandle = await driver.getCurrentWindowHandle();
  const windowHandles = await driver.getAllWindowHandles();
  const offscreenPageUrl = `${driver.extensionUrl}${OFFSCREEN_PAGE_PATH}`;

  for (const handle of windowHandles) {
    if (handle === currentHandle) {
      continue;
    }

    try {
      await driver.switchToWindow(handle);
      // Match the MV3 offscreen page by URL (available immediately via
      // `getCurrentUrl()`) rather than by title: reading the title requires
      // the document to have rendered, so a transiently empty title could
      // misidentify - and close - the offscreen page, poisoning the session.
      const url = await driver.getCurrentUrl();
      if (url !== offscreenPageUrl) {
        await driver.closeWindow();
      }
    } catch (error) {
      // Best-effort cleanup: log so a systemic failure (e.g. every handle
      // erroring) isn't silently invisible, but don't fail the suite over a
      // handle that disappeared during cleanup.
      console.warn(
        `closeAuxiliaryWindows: failed to inspect/close window handle ${handle}.`,
        error,
      );
    } finally {
      await driver.switchToWindow(currentHandle);
    }
  }
}

/**
 * Resets the shared-session extension back to the baseline fixture state
 * without rebuilding the entire E2E environment.
 *
 * @param fixtureContext - The active shared-session fixture context.
 * @param fixtureContext.driver - The active shared-session driver.
 */
async function resetSharedFixtureSession(fixtureContext: {
  driver: Driver;
}): Promise<void> {
  const { driver } = fixtureContext;
  const canRestartWithCdp = driver.extensionUrl.startsWith(
    CHROME_EXTENSION_PROTOCOL,
  );

  if (canRestartWithCdp) {
    await getServerMochaToBackground().resetFixtureState({
      reloadServiceWorker: false,
      waitForReconnect: false,
    });
    await restartChromeServiceWorker(driver);
    return;
  }

  const survivorWindow = await getReloadSurvivorWindow(driver);
  await getServerMochaToBackground().resetFixtureState({
    reloadServiceWorker: true,
    waitForReconnect: true,
  });

  await driver.switchToWindow(survivorWindow);
  if (process.env.SELENIUM_BROWSER === 'firefox') {
    await driver.openNewPage('about:blank');
  }

  await driver.waitForExtensionStart({
    waitForControllers: false,
    waitForLoadingLogoToDisappear: false,
  });
}

/**
 * Defines a suite that reuses a single browser/extension fixture session
 * across all tests in the suite to reduce repeated E2E setup cost.
 *
 * @param suiteTitle - The Mocha suite title for the shared-session tests.
 * @param fixtureOptions - The fixture-runner options used to start the shared
 * session, plus the session behavior flags (`resetAfterEach`, `failFast`,
 * `navigateAfterEach`, `runFixtures`).
 * @param defineSuite - Callback that defines the suite's tests and hooks using
 * the shared driver and fixture accessors.
 */
export function configureFixtureSession<
  TRunnerOptions extends object = BaseFixtureSessionRunnerOptions,
  TRunnerContext extends { driver: Driver } = FixtureSessionContext,
>(
  suiteTitle: string,
  fixtureOptions: FixtureSessionOptions<TRunnerOptions, TRunnerContext>,
  defineSuite: (accessors: FixtureSessionAccessors<TRunnerContext>) => void,
): void {
  const sharedSuite = describe(suiteTitle, function () {
    const fixtureSetup = createDeferredPromise<TRunnerContext>();
    const suiteFinished = createDeferredPromise<void>();

    let firstTestFailureError: Error | undefined;
    let fixturePromise: Promise<void> | undefined;
    let fixtures: TRunnerContext | undefined;
    let sessionPoisonedError: Error | undefined;

    const getFixtures = (): TRunnerContext => {
      if (!fixtures) {
        throw new Error(
          'Fixture session is not ready yet; call getDriver()/getFixtures() only inside test or hook bodies after the shared fixture session `before` hook has run.',
        );
      }

      return fixtures;
    };

    const getDriver = (): Driver => {
      return getFixtures().driver;
    };

    before('Set up shared fixture session', async function () {
      const {
        failFast: _failFast,
        navigateAfterEach: _navigateAfterEach,
        resetAfterEach: _resetAfterEach,
        // The default runner only matches `TRunnerOptions`/`TRunnerContext`
        // when the caller uses the default type parameters (plain
        // `withFixtures`); callers that pass their own `TRunnerOptions` (e.g.
        // Tron's `withTronFixtures`) always supply their own `runFixtures`.
        runFixtures = withFixtures as unknown as FixtureSessionRunner<
          TRunnerOptions,
          TRunnerContext
        >,
        ...withFixturesOptions
      } = fixtureOptions;
      const { title } = withFixturesOptions as { title?: string };
      const options = {
        ...withFixturesOptions,
        title: title ?? suiteTitle,
      } as TRunnerOptions;

      fixturePromise = runFixtures(options, async (fixtureContext) => {
        fixtures = fixtureContext;
        fixtureSetup.resolve(fixtures);
        await suiteFinished.promise;
      });

      fixturePromise.catch((error: unknown) => {
        fixtureSetup.reject(error);
      });

      await fixtureSetup.promise;
    });

    beforeEach('Ensure shared fixture session is reusable', function () {
      if (sessionPoisonedError) {
        throw new Error(
          `Shared fixture session is no longer reusable because reset failed: ${sessionPoisonedError.message}`,
        );
      }

      if ((fixtureOptions.failFast ?? false) && firstTestFailureError) {
        this.skip();
      }
    });

    defineSuite({ getDriver, getFixtures });

    // Register shared cleanup after the suite so suite-specific teardown can
    // still access the active session before we reset or shut it down.
    afterEach(
      'Reset shared fixture session state between tests',
      async function () {
        if (this.currentTest?.state === 'failed' && !firstTestFailureError) {
          firstTestFailureError =
            this.currentTest.err ??
            new Error(`Test failed: ${this.currentTest.fullTitle()}`);
        }

        if (sessionPoisonedError) {
          return;
        }

        const resetAfterEach = fixtureOptions.resetAfterEach ?? true;
        const navigateAfterEach = fixtureOptions.navigateAfterEach ?? true;
        if (!resetAfterEach && !navigateAfterEach) {
          return;
        }

        try {
          const fixtureContext = getFixtures();
          const { driver } = fixtureContext;

          if (
            resetAfterEach &&
            this.currentTest &&
            shouldResetSharedFixtureSession(sharedSuite, this.currentTest)
          ) {
            await resetSharedFixtureSession(fixtureContext);
          }

          if (navigateAfterEach) {
            await closeAuxiliaryWindows(driver);
            await driver.openNewURL('about:blank');
          }
        } catch (error) {
          sessionPoisonedError =
            error instanceof Error ? error : new Error(String(error));
          suiteFinished.resolve();
          throw sessionPoisonedError;
        }
      },
    );

    after('Shut down shared fixture session', async function () {
      suiteFinished.resolve();
      if (fixturePromise) {
        await fixturePromise;
      }
    });
  });
}
