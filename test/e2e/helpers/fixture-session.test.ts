import type { Driver } from '../webdriver/driver';
import {
  configureFixtureSession,
  type FixtureSessionRunner,
} from './fixture-session';

type RunnerOptions = {
  customOption: string;
  fixtures: unknown;
};

type RunnerContext = {
  customContext: string;
  driver: Driver;
};

jest.mock('../helpers', () => ({
  withFixtures: jest.fn(
    async (
      _options: unknown,
      testSuite: (context: { driver: Driver }) => Promise<void>,
    ) => {
      await testSuite({
        driver: {
          getAllWindowHandles: jest.fn().mockResolvedValue(['main']),
          getCurrentWindowHandle: jest.fn().mockResolvedValue('main'),
          openNewURL: jest.fn().mockResolvedValue(undefined),
        } as unknown as Driver,
      });
    },
  ),
}));

type MochaHook = (
  title: string,
  callback: () => void | Promise<void>,
) => void;

function wrapJestHook(
  jestHook: (callback: () => void | Promise<void>) => void,
): MochaHook {
  return (_title, callback) => jestHook(callback);
}

const mochaHooks = globalThis as unknown as Record<
  'after' | 'afterEach' | 'before' | 'beforeEach',
  MochaHook
>;
mochaHooks.after = wrapJestHook(afterAll);
mochaHooks.afterEach = wrapJestHook(globalThis.afterEach);
mochaHooks.before = wrapJestHook(beforeAll);
mochaHooks.beforeEach = wrapJestHook(globalThis.beforeEach);

const runnerContext: RunnerContext = {
  customContext: 'runner-context',
  driver: {} as Driver,
};

const runFixtures: FixtureSessionRunner<RunnerOptions, RunnerContext> =
  jest.fn(async (_options, testSuite) => {
    await testSuite(runnerContext);
  });

const fixtureOptions: RunnerOptions = {
  customOption: 'custom-option',
  fixtures: { fixture: 'value' },
};

configureFixtureSession<RunnerOptions, RunnerContext>(
  'custom fixture session runner',
  {
    ...fixtureOptions,
    failFast: true,
    navigateAfterEach: false,
    resetAfterEach: false,
    runFixtures,
  },
  ({ getFixtures }) => {
    it('starts the shared session with the injected runner', () => {
      expect(runFixtures).toHaveBeenCalledTimes(1);
      expect(runFixtures).toHaveBeenCalledWith(
        {
          ...fixtureOptions,
          title: 'custom fixture session runner',
        },
        expect.any(Function),
      );
    });

    it('exposes the injected runner context', () => {
      expect(getFixtures()).toBe(runnerContext);
    });
  },
);
