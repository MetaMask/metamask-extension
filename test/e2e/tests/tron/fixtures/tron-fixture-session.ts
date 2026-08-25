import {
  configureFixtureSession,
  type FixtureSessionRunner,
} from '../../../helpers/fixture-session';
import { TronNode } from '../../../seeder/tron/node';
import type { Driver } from '../../../webdriver/driver';
import {
  buildTronNodeOptions,
  withTronFixtures,
  type TronFixturesTestSuiteContext,
  type WithTronFixturesOptions,
} from './with-tron-fixtures';

export type TronFixtureSessionOptions = Omit<
  WithTronFixturesOptions,
  'borrowedTronNode'
> & {
  // Spec-owned, already-started node (for spec files that run several
  // sessions against one node). Passed through as `borrowedTronNode`; the
  // spec manages its lifecycle. When omitted, the session owns one node:
  // started before the shared `withTronFixtures` run and shut down when the
  // suite finishes.
  tronNode?: TronNode;
};

export type TronFixtureSessionContext = TronFixturesTestSuiteContext & {
  driver: Driver;
};

export type TronFixtureSessionAccessors = {
  getDriver: () => Driver;
  getFixtures: () => TronFixtureSessionContext;
};

type TronRunnerOptions = Omit<WithTronFixturesOptions, 'borrowedTronNode'>;

/**
 * Defines a Tron suite that reuses a single browser/extension fixture session
 * across all tests in the suite. Tron shared sessions fail fast (remaining
 * tests are skipped after the first failure) and never reset state or
 * navigate between tests: each test continues from wherever the previous test
 * left the extension page (typically the homepage).
 *
 * @param suiteTitle - The Mocha suite title for the shared-session tests.
 * @param options - The `withTronFixtures` options used to start the shared
 * session (minus `borrowedTronNode`), plus an optional spec-owned `tronNode`.
 * @param defineSuite - Callback that defines the suite's tests and hooks using
 * the shared driver and fixture accessors.
 */
export function configureTronFixtureSession(
  suiteTitle: string,
  options: TronFixtureSessionOptions,
  defineSuite: (accessors: TronFixtureSessionAccessors) => void,
): void {
  const { tronNode, ...tronFixturesOptions } = options;

  const runTronFixtures: FixtureSessionRunner<
    TronRunnerOptions,
    TronFixtureSessionContext
  > = async (tronRunnerOptions, testSuite) => {
    if (tronNode) {
      await withTronFixtures(
        { ...tronRunnerOptions, borrowedTronNode: tronNode },
        testSuite,
      );
      return;
    }

    const sessionNode = new TronNode();
    try {
      await sessionNode.start(buildTronNodeOptions(tronRunnerOptions.accounts));
      await withTronFixtures(
        { ...tronRunnerOptions, borrowedTronNode: sessionNode },
        testSuite,
      );
    } finally {
      await sessionNode.quit();
    }
  };

  configureFixtureSession<TronRunnerOptions, TronFixtureSessionContext>(
    suiteTitle,
    {
      ...tronFixturesOptions,
      failFast: true,
      navigateAfterEach: false,
      resetAfterEach: false,
      runFixtures: runTronFixtures,
    },
    ({ getDriver, getFixtures }) => {
      defineSuite({ getDriver, getFixtures });
    },
  );
}
