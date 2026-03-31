import { createDeferredPromise } from '@metamask/utils';
import { PAGES } from '../webdriver/driver';
import type { Driver } from '../webdriver/driver';
import { withFixtures } from '../helpers';

type WithFixturesOptions = Parameters<typeof withFixtures>[0];
type WithFixturesTestSuite = Parameters<typeof withFixtures>[1];
type FixtureSessionOptions<TOptions extends object = object> = TOptions &
  WithFixturesOptions & {
    resetAfterEach?: boolean;
  };
type FixtureSessionContext = Parameters<WithFixturesTestSuite>[0] & {
  driver: Driver;
};

export type FixtureSessionAccessors = {
  getDriver: () => Driver;
  getFixtures: () => FixtureSessionContext;
};

const RESET_FIXTURE_STATE_MESSAGE = 'RESET_FIXTURE_STATE';
const RESET_FIXTURE_STATE_STATUS = 'FIXTURE_STATE_RESETTING';
const OFFSCREEN_PAGE_TITLE = 'MetaMask Offscreen Page';

/**
 * Sends the test-only background message that resets persisted fixture-backed
 * state and schedules an extension reload.
 *
 * @param driver - The active shared-session driver.
 */
async function requestFixtureStateReset(driver: Driver): Promise<void> {
  const result = await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    const runtime = globalThis.browser?.runtime ?? globalThis.chrome?.runtime;

    runtime
      .sendMessage({ type: '${RESET_FIXTURE_STATE_MESSAGE}' })
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
 * @param driver - The active shared-session driver.
 */
async function resetSharedFixtureSession(driver: Driver): Promise<void> {
  const extensionWindow = await driver.openNewPage(
    `${driver.extensionUrl}/${PAGES.HOME}.html`,
  );
  const blankWindow = await driver.openNewPage('about:blank');

  await driver.switchToWindow(extensionWindow);
  await requestFixtureStateReset(driver);

  await driver.switchToWindow(blankWindow);
  if (process.env.SELENIUM_BROWSER === 'firefox') {
    await driver.openNewPage('about:blank');
  }

  await driver.waitForExtensionStart();
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
export function configureFixtureSession<TOptions extends object>(
  suiteTitle: string,
  fixtureOptions: FixtureSessionOptions<TOptions>,
  defineSuite: (accessors: FixtureSessionAccessors) => void,
): void {
  describe(suiteTitle, function () {
    const fixtureSetup = createDeferredPromise<FixtureSessionContext>();
    const suiteFinished = createDeferredPromise<void>();

    let fixturePromise: Promise<void> | undefined;
    let fixtures: FixtureSessionContext | undefined;

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
      const { resetAfterEach: _resetAfterEach, ...withFixturesOptions } =
        fixtureOptions;
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

    defineSuite({ getDriver, getFixtures });

    // Register shared cleanup after the suite so suite-specific teardown can
    // still access the active session before we reset or shut it down.
    afterEach('Reset shared fixture session state', async function () {
      const driver = getDriver();

      if (fixtureOptions.resetAfterEach ?? true) {
        await resetSharedFixtureSession(driver);
      }

      await closeAuxiliaryWindows(driver);
      await driver.openNewURL('about:blank');
    });

    after('Shut down shared fixture session', async function () {
      suiteFinished.resolve();
      if (fixturePromise) {
        await fixturePromise;
      }
    });
  });
}
