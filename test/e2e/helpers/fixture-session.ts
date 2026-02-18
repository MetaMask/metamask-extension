import { createDeferredPromise } from '@metamask/utils';
import type { Driver } from '../webdriver/driver';
import { withFixtures } from '../helpers';

type WithFixturesOptions = Parameters<typeof withFixtures>[0];
type WithFixturesTestSuite = Parameters<typeof withFixtures>[1];
type FixtureSessionContext = Parameters<WithFixturesTestSuite>[0] & {
  driver: Driver;
};

export type FixtureSessionAccessors = {
  getDriver: () => Driver;
  getFixtures: () => FixtureSessionContext;
};

export function configureFixtureSession(
  suiteTitle: string,
  fixtureOptions: WithFixturesOptions,
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
          'Fixture session is not ready yet. Call getFixtures() or getDriver() inside test or hook bodies after setup.',
        );
      }

      return fixtures;
    };

    const getDriver = (): Driver => {
      return getFixtures().driver;
    };

    before('Set up shared fixture session', async function () {
      const options = {
        ...fixtureOptions,
        // @ts-expect-error - fixtureOptions isn't actually typed correctly yet, we are just pretending it is in this file
        title: fixtureOptions.title ?? suiteTitle,
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

    after('Shut down shared fixture session', async function () {
      suiteFinished.resolve();
      if (fixturePromise) {
        await fixturePromise;
      }
    });

    afterEach('Reset current window to about:blank', async function () {
      await getDriver().openNewURL('about:blank');
    });

    defineSuite({ getDriver, getFixtures });
  });
}
