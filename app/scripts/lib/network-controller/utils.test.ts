import {
  PRODUCTION_LIKE_ENVIRONMENTS,
  getRpcServiceEventsSampleRate,
} from './utils';

describe('getRpcServiceEventsSampleRate', () => {
  // @ts-expect-error The Mocha types are incorrect.
  describe.each(PRODUCTION_LIKE_ENVIRONMENTS)(
    'if the environment is %s',
    (environment: string) => {
      it('returns 0.01', async () => {
        await withChangesToEnvironmentVariables(() => {
          process.env.METAMASK_ENVIRONMENT = environment;

          expect(getRpcServiceEventsSampleRate()).toBe(0.01);
        });
      });
    },
  );

  describe('if the environment is non-production', () => {
    it('returns 1', async () => {
      await withChangesToEnvironmentVariables(() => {
        process.env.METAMASK_ENVIRONMENT = 'development';

        expect(getRpcServiceEventsSampleRate()).toBe(1);
      });
    });
  });

  describe('if the environment is not set', () => {
    it('returns 0', async () => {
      await withChangesToEnvironmentVariables(() => {
        delete process.env.METAMASK_ENVIRONMENT;

        expect(getRpcServiceEventsSampleRate()).toBe(0);
      });
    });
  });
});

/**
 * Ensures that changes to `process.env` during a test get rolled back after a
 * test.
 *
 * @param testFunction - The test function to execute.
 */
async function withChangesToEnvironmentVariables(
  testFunction: () => void | Promise<void>,
) {
  const originalEnv = { ...process.env };

  await testFunction();

  for (const key of new Set([
    ...Object.keys(originalEnv),
    ...Object.keys(process.env),
  ])) {
    if (originalEnv[key]) {
      process.env[key] = originalEnv[key];
    } else {
      delete process.env[key];
    }
  }
}
