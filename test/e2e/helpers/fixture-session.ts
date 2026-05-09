import { createDeferredPromise } from '@metamask/utils';
import type { Mockttp } from 'mockttp';
import { getServerMochaToBackground } from '../background-socket/server-mocha-to-background';
import type { Driver } from '../webdriver/driver';
import { withFixtures } from '../helpers';

type WithFixturesOptions = Parameters<typeof withFixtures>[0];
type WithFixturesTestSuite = Parameters<typeof withFixtures>[1];
type FixtureResetStrategy =
  | 'inPlace'
  | 'reload'
  | 'reloadSkipFixtureInitialization';
type ServiceWorkerRestart = 'runtimeReload' | 'cdpStopStart';
type ResetFixtureStateResponse = {
  status?: string;
  reloadRequired?: boolean;
  timings?: { phase: string; ms: number }[];
};
type FixtureSessionOptions = WithFixturesOptions & {
  fixtures: unknown;
  resetAfterEach?: boolean;
  resetStrategy?: FixtureResetStrategy;
  serviceWorkerRestart?: ServiceWorkerRestart;
  waitForExtensionStartAfterReset?: boolean;
  testSpecificMock?: (mockServer: Mockttp) => unknown | Promise<unknown>;
};
type FixtureSessionContext = Parameters<WithFixturesTestSuite>[0] & {
  driver: Driver;
};

export type FixtureSessionAccessors = {
  getDriver: () => Driver;
  getFixtures: () => FixtureSessionContext;
};

const RESET_FIXTURE_STATE_STATUS = 'FIXTURE_STATE_RESET';
const OFFSCREEN_PAGE_TITLE = 'MetaMask Offscreen Page';
const PROFILE_MARKER = '[fixture-benchmark-profile] ';
const CHROME_EXTENSION_PROTOCOL = 'chrome-extension://';

function recordFixtureSessionProfile(
  phase: string,
  ms: number,
  extra: Record<string, unknown> = {},
): void {
  if (process.env.FIXTURE_SESSION_BENCHMARK_PROFILE !== 'true') {
    return;
  }

  console.log(
    `${PROFILE_MARKER}${JSON.stringify({
      mode: process.env.FIXTURE_SESSION_BENCHMARK_MODE,
      phase,
      ms,
      ...extra,
    })}`,
  );
}

async function profileFixtureSessionPhase<Result>(
  phase: string,
  operation: () => Promise<Result>,
  extra: Record<string, unknown> = {},
): Promise<Result> {
  const startedAt = Date.now();
  try {
    return await operation();
  } finally {
    recordFixtureSessionProfile(phase, Date.now() - startedAt, extra);
  }
}

function getRunnableTests(suite: Mocha.Suite): Mocha.Test[] {
  return [
    ...suite.tests.filter((test) => !test.pending),
    ...suite.suites.flatMap(getRunnableTests),
  ];
}

function hasNextRunnableTest(
  sharedSuite: Mocha.Suite,
  currentTest: Mocha.Test | undefined,
): boolean {
  if (!currentTest) {
    return true;
  }

  const runnableTests = getRunnableTests(sharedSuite);
  const currentTestIndex = runnableTests.indexOf(currentTest);

  if (currentTestIndex === -1) {
    return true;
  }

  return runnableTests
    .slice(currentTestIndex + 1)
    .some((test) => !test.pending);
}

function shouldResetSharedFixtureSession(
  sharedSuite: Mocha.Suite,
  currentTest: Mocha.Test | undefined,
): boolean {
  return (
    currentTest?.state === 'failed' ||
    hasNextRunnableTest(sharedSuite, currentTest)
  );
}

async function getReloadSurvivorWindow(driver: Driver): Promise<string> {
  const currentWindow = await driver.getCurrentWindowHandle();
  const currentUrl = await driver.getCurrentUrl().catch(() => '');

  if (!currentUrl.startsWith(driver.extensionUrl)) {
    return currentWindow;
  }

  return await driver.openNewPage('about:blank');
}

async function sendChromeDevToolsCommand<Result>(
  driver: Driver,
  command: string,
  params: Record<string, unknown> = {},
): Promise<Result> {
  const seleniumDriver = driver.driver as {
    sendAndGetDevToolsCommand?: (
      commandName: string,
      commandParams?: Record<string, unknown>,
    ) => Promise<unknown>;
  };

  if (!seleniumDriver.sendAndGetDevToolsCommand) {
    throw new Error('Chrome DevTools Protocol is not available.');
  }

  const result = await seleniumDriver.sendAndGetDevToolsCommand(
    command,
    params,
  );
  if (typeof result !== 'string') {
    return result as Result;
  }

  try {
    return JSON.parse(result) as Result;
  } catch {
    return result as Result;
  }
}

async function restartExtensionServiceWorkerWithCdp(
  driver: Driver,
  connectionVersion: number,
  resetStrategy: FixtureResetStrategy,
): Promise<void> {
  if (!driver.extensionUrl.startsWith(CHROME_EXTENSION_PROTOCOL)) {
    throw new Error('CDP service-worker restart is only supported in Chrome.');
  }

  const scopeURL = driver.extensionUrl.endsWith('/')
    ? driver.extensionUrl
    : `${driver.extensionUrl}/`;
  const backgroundSocket = getServerMochaToBackground();

  await profileFixtureSessionPhase(
    'reset.cdp.enableServiceWorker',
    () => sendChromeDevToolsCommand(driver, 'ServiceWorker.enable'),
    { resetStrategy },
  );
  await profileFixtureSessionPhase(
    'reset.cdp.stopAllWorkers',
    () => sendChromeDevToolsCommand(driver, 'ServiceWorker.stopAllWorkers'),
    { resetStrategy },
  );
  await profileFixtureSessionPhase(
    'reset.cdp.startWorker',
    () =>
      sendChromeDevToolsCommand(driver, 'ServiceWorker.startWorker', {
        scopeURL,
      }),
    { resetStrategy },
  );
  await profileFixtureSessionPhase(
    'reset.cdp.waitForBackgroundSocketReconnect',
    () => backgroundSocket.waitForConnectionAfter(connectionVersion),
    { resetStrategy },
  );
}

/**
 * Sends the test-only background message that resets persisted fixture-backed
 * state.
 *
 * @param _driver - The active shared-session driver.
 * @param strategy - How the background script should reset fixture state.
 * @param restartServiceWorker
 */
async function requestFixtureStateReset(
  _driver: Driver,
  strategy: FixtureResetStrategy,
  restartServiceWorker: ServiceWorkerRestart,
): Promise<ResetFixtureStateResponse> {
  const response = await getServerMochaToBackground().resetFixtureState(
    strategy,
    {
      reloadServiceWorker: restartServiceWorker === 'runtimeReload',
      waitForReconnect: restartServiceWorker === 'runtimeReload',
    },
  );

  if (response?.status !== RESET_FIXTURE_STATE_STATUS) {
    throw new Error(
      `Unexpected shared fixture reset response: ${JSON.stringify(response)}`,
    );
  }

  for (const timing of response.timings ?? []) {
    recordFixtureSessionProfile(timing.phase, timing.ms, { strategy });
  }

  return response;
}

/**
 * Closes any user-visible auxiliary tabs/windows that were opened during a
 * shared-session test, while preserving the current tab and the MV3 offscreen
 * page.
 *
 * @param driver - The active shared-session driver.
 */
async function closeAuxiliaryWindows(driver: Driver): Promise<void> {
  const currentHandle = await driver.driver.getWindowHandle();
  const windowHandles = await driver.getAllWindowHandles();

  for (const handle of windowHandles) {
    if (handle === currentHandle) {
      continue;
    }

    try {
      await driver.switchToWindow(handle);
      const title = await driver.driver.getTitle();
      if (title !== OFFSCREEN_PAGE_TITLE) {
        await driver.closeWindow();
      }
    } catch {
      // Ignore handles that disappeared during cleanup.
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
 * @param resetStrategy - How the background script should reset fixture state.
 * @param serviceWorkerRestart - How to restart the extension service worker after reset.
 * @param waitForExtensionStartAfterReset
 */
async function resetSharedFixtureSession(
  fixtureContext: FixtureSessionContext,
  resetStrategy: FixtureResetStrategy,
  serviceWorkerRestart: ServiceWorkerRestart,
  waitForExtensionStartAfterReset: boolean,
): Promise<void> {
  const { driver } = fixtureContext;
  const reloadRequired = resetStrategy !== 'inPlace';
  const usesRuntimeReload =
    reloadRequired && serviceWorkerRestart === 'runtimeReload';
  const usesCdpRestart =
    reloadRequired && serviceWorkerRestart === 'cdpStopStart';
  const connectionVersion = usesCdpRestart
    ? getServerMochaToBackground().getConnectionVersion()
    : undefined;
  const survivorWindow = usesRuntimeReload
    ? await profileFixtureSessionPhase(
        'reset.getReloadSurvivorWindow',
        () => getReloadSurvivorWindow(driver),
        { resetStrategy },
      )
    : undefined;
  const resetResponse = await profileFixtureSessionPhase(
    'reset.requestFixtureStateReset',
    () => requestFixtureStateReset(driver, resetStrategy, serviceWorkerRestart),
    { resetStrategy },
  );
  if (resetResponse.reloadRequired === false) {
    return;
  }

  if (usesCdpRestart) {
    if (connectionVersion === undefined) {
      throw new Error('CDP reset did not capture a background connection.');
    }
    await restartExtensionServiceWorkerWithCdp(
      driver,
      connectionVersion,
      resetStrategy,
    );
    if (!waitForExtensionStartAfterReset) {
      await profileFixtureSessionPhase(
        'reset.openReusableBlankPage',
        () => driver.openNewPage('about:blank'),
        { resetStrategy },
      );
    }
  }

  if (survivorWindow) {
    await profileFixtureSessionPhase(
      'reset.switchToSurvivorWindow',
      () => driver.switchToWindow(survivorWindow),
      { resetStrategy },
    );
    if (process.env.SELENIUM_BROWSER === 'firefox') {
      await profileFixtureSessionPhase(
        'reset.openFirefoxBlankPage',
        () => driver.openNewPage('about:blank'),
        { resetStrategy },
      );
    }
  } else if (!usesCdpRestart) {
    throw new Error('Reload reset did not prepare a survivor window.');
  }

  if (waitForExtensionStartAfterReset) {
    await profileFixtureSessionPhase(
      'reset.waitForExtensionStart',
      () =>
        driver.waitForExtensionStart({
          waitForControllers: false,
          waitForLoadingLogoToDisappear: false,
        }),
      { resetStrategy },
    );
  }
}

/**
 * Defines a suite that reuses a single browser/extension fixture session
 * across all tests in the suite to reduce repeated E2E setup cost.
 *
 * @param suiteTitle - The Mocha suite title for the shared-session tests.
 * @param fixtureOptions - The `withFixtures` options used to start the shared session.
 * @param defineSuite - Callback that defines the suite's tests and hooks using
 * the shared driver and fixture accessors.
 */
export function configureFixtureSession(
  suiteTitle: string,
  fixtureOptions: FixtureSessionOptions,
  defineSuite: (accessors: FixtureSessionAccessors) => void,
): void {
  const sharedSuite = describe(suiteTitle, function () {
    const fixtureSetup = createDeferredPromise<FixtureSessionContext>();
    const suiteFinished = createDeferredPromise<void>();

    let fixturePromise: Promise<void> | undefined;
    let fixtures: FixtureSessionContext | undefined;
    let sessionPoisonedError: Error | undefined;

    const getFixtures = (): FixtureSessionContext => {
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
        resetAfterEach: _resetAfterEach,
        resetStrategy: _resetStrategy,
        serviceWorkerRestart: _serviceWorkerRestart,
        waitForExtensionStartAfterReset: _waitForExtensionStartAfterReset,
        ...withFixturesOptions
      } = fixtureOptions;
      const { title } = withFixturesOptions as { title?: string };
      const options = {
        ...withFixturesOptions,
        title: title ?? suiteTitle,
      };

      fixturePromise = withFixtures(options, async (fixtureContext) => {
        fixtures = fixtureContext as FixtureSessionContext;
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
    });

    defineSuite({ getDriver, getFixtures });

    // Register shared cleanup after the suite so suite-specific teardown can
    // still access the active session before we reset or shut it down.
    afterEach(
      'Reset shared fixture session state between tests',
      async function () {
        if (sessionPoisonedError) {
          return;
        }

        try {
          const fixtureContext = getFixtures();
          const { driver } = fixtureContext;

          if (
            (fixtureOptions.resetAfterEach ?? true) &&
            shouldResetSharedFixtureSession(sharedSuite, this.currentTest)
          ) {
            await resetSharedFixtureSession(
              fixtureContext,
              fixtureOptions.resetStrategy ?? 'inPlace',
              fixtureOptions.serviceWorkerRestart ?? 'runtimeReload',
              fixtureOptions.waitForExtensionStartAfterReset ?? true,
            );
          }

          await profileFixtureSessionPhase(
            'afterEach.closeAuxiliaryWindows',
            () => closeAuxiliaryWindows(driver),
          );
          await profileFixtureSessionPhase('afterEach.openAboutBlank', () =>
            driver.openNewURL('about:blank'),
          );
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
