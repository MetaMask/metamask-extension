import { createDeferredPromise } from '@metamask/utils';
import type { Mockttp } from 'mockttp';
import { PAGES } from '../webdriver/driver';
import type { Driver } from '../webdriver/driver';
import { withFixtures } from '../helpers';

type WithFixturesOptions = Parameters<typeof withFixtures>[0];
type WithFixturesTestSuite = Parameters<typeof withFixtures>[1];
type FixtureResetStrategy = 'inPlace' | 'reload';
type ResetFixtureStateResponse = {
  status?: string;
  reloadRequired?: boolean;
};
type FixtureSessionOptions = WithFixturesOptions & {
  fixtures: unknown;
  resetAfterEach?: boolean;
  resetStrategy?: FixtureResetStrategy;
  testSpecificMock?: (mockServer: Mockttp) => unknown | Promise<unknown>;
};
type FixtureSessionContext = Parameters<WithFixturesTestSuite>[0] & {
  driver: Driver;
};

export type FixtureSessionAccessors = {
  getDriver: () => Driver;
  getFixtures: () => FixtureSessionContext;
};

const RESET_FIXTURE_STATE_MESSAGE = 'RESET_FIXTURE_STATE';
const RESET_FIXTURE_STATE_STATUS = 'FIXTURE_STATE_RESET';
const OFFSCREEN_PAGE_TITLE = 'MetaMask Offscreen Page';

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

  const survivorWindow = await driver.openNewPage('about:blank');
  await driver.switchToWindow(currentWindow);
  return survivorWindow;
}

/**
 * Sends the test-only background message that resets persisted fixture-backed
 * state.
 *
 * @param driver - The active shared-session driver.
 * @param strategy - How the background script should reset fixture state.
 */
async function requestFixtureStateReset(
  driver: Driver,
  strategy: FixtureResetStrategy,
): Promise<ResetFixtureStateResponse> {
  const result = await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    const runtime = globalThis.browser?.runtime ?? globalThis.chrome?.runtime;

    runtime
      .sendMessage(${JSON.stringify({
        type: RESET_FIXTURE_STATE_MESSAGE,
        strategy,
      })})
      .then((response) => callback({ response }))
      .catch((error) =>
        callback({
          error: error?.message ?? error?.toString?.() ?? String(error),
        }),
      );
  `);

  if (result?.error) {
    throw new Error(`Failed to reset shared fixture state: ${result.error}`);
  }

  if (result?.response?.status !== RESET_FIXTURE_STATE_STATUS) {
    throw new Error(
      `Unexpected shared fixture reset response: ${JSON.stringify(result?.response)}`,
    );
  }

  return result.response;
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
 */
async function resetSharedFixtureSession(
  fixtureContext: FixtureSessionContext,
  resetStrategy: FixtureResetStrategy,
): Promise<void> {
  const { driver } = fixtureContext;

  const extensionWindow = await driver.openNewPage(
    `${driver.extensionUrl}/${PAGES.HOME}.html`,
  );

  await driver.switchToWindow(extensionWindow);
  const resetResponse = await requestFixtureStateReset(driver, resetStrategy);
  if (resetResponse.reloadRequired === false) {
    return;
  }

  const survivorWindow = await getReloadSurvivorWindow(driver);
  await driver.executeScript(
    `(globalThis.browser ?? globalThis.chrome).runtime.reload()`,
  );

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
            );
          }

          await closeAuxiliaryWindows(driver);
          await driver.openNewURL('about:blank');
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
