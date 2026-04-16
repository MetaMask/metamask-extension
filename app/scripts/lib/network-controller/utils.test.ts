import { generateDeterministicRandomNumber } from '@metamask/remote-feature-flag-controller';

import {
  PRODUCTION_LIKE_ENVIRONMENTS,
  shouldCreateRpcServiceEvents,
} from './utils';

jest.mock('@metamask/remote-feature-flag-controller', () => ({
  ...jest.requireActual('@metamask/remote-feature-flag-controller'),
  // This is the name of the property that turns this into an ES module.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  generateDeterministicRandomNumber: jest.fn(),
}));

const generateDeterministicRandomNumberMock = jest.mocked(
  generateDeterministicRandomNumber,
);

const MOCK_METAMETRICS_ID =
  '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420';

describe('shouldCreateRpcServiceEvents', () => {
  describe('if not given an error', () => {
    const error = undefined;

    describe('if given a MetaMetrics ID', () => {
      // @ts-expect-error The Mocha types are incorrect.
      describe.each(PRODUCTION_LIKE_ENVIRONMENTS)(
        'if the environment is %s',
        (environment: string) => {
          describe('if the user is in the MetaMetrics sample', () => {
            const sampleUserRanking = 0.009999;

            it('returns true', async () => {
              await withChangesToEnvironmentVariables(() => {
                process.env.METAMASK_ENVIRONMENT = environment;
                generateDeterministicRandomNumberMock.mockReturnValue(
                  sampleUserRanking,
                );

                expect(
                  shouldCreateRpcServiceEvents({
                    error,
                    metaMetricsId: MOCK_METAMETRICS_ID,
                  }),
                ).toBe(true);
              });
            });
          });

          describe('if the user is not in the MetaMetrics sample', () => {
            const sampleUserRanking = 0.2;

            it('returns false', async () => {
              await withChangesToEnvironmentVariables(() => {
                process.env.METAMASK_ENVIRONMENT = environment;
                generateDeterministicRandomNumberMock.mockReturnValue(
                  sampleUserRanking,
                );

                expect(
                  shouldCreateRpcServiceEvents({
                    error,
                    metaMetricsId: MOCK_METAMETRICS_ID,
                  }),
                ).toBe(false);
              });
            });
          });
        },
      );

      describe('if the environment is non-production', () => {
        const environment = 'development';

        it('returns true', async () => {
          await withChangesToEnvironmentVariables(() => {
            process.env.METAMASK_ENVIRONMENT = environment;

            expect(
              shouldCreateRpcServiceEvents({
                error,
                metaMetricsId: MOCK_METAMETRICS_ID,
              }),
            ).toBe(true);
          });
        });
      });

      describe('if the environment is not set', () => {
        it('returns false', async () => {
          await withChangesToEnvironmentVariables(() => {
            delete process.env.METAMASK_ENVIRONMENT;

            expect(
              shouldCreateRpcServiceEvents({
                error,
                metaMetricsId: MOCK_METAMETRICS_ID,
              }),
            ).toBe(false);
          });
        });
      });
    });

    describe('if the MetaMetrics ID is undefined', () => {
      const metaMetricsId = undefined;

      it('returns false', async () => {
        expect(
          shouldCreateRpcServiceEvents({
            error: undefined,
            metaMetricsId,
          }),
        ).toBe(false);
      });
    });

    describe('if the MetaMetrics ID is null', () => {
      const metaMetricsId = null;

      it('returns false', async () => {
        expect(
          shouldCreateRpcServiceEvents({
            error: undefined,
            metaMetricsId,
          }),
        ).toBe(false);
      });
    });
  });

  describe('if given a non-connection error', () => {
    const error = new Error('some error');

    describe('if given a MetaMetrics ID', () => {
      // @ts-expect-error The Mocha types are incorrect.
      describe.each(PRODUCTION_LIKE_ENVIRONMENTS)(
        'if the environment is %s',
        (environment: string) => {
          describe('if the user is in the MetaMetrics sample', () => {
            const sampleUserRanking = 0.009999;

            it('returns true', async () => {
              await withChangesToEnvironmentVariables(() => {
                process.env.METAMASK_ENVIRONMENT = environment;
                generateDeterministicRandomNumberMock.mockReturnValue(
                  sampleUserRanking,
                );

                expect(
                  shouldCreateRpcServiceEvents({
                    error,
                    metaMetricsId: MOCK_METAMETRICS_ID,
                  }),
                ).toBe(true);
              });
            });
          });

          describe('if the user is not in the MetaMetrics sample', () => {
            const sampleUserRanking = 0.2;

            it('returns false', async () => {
              await withChangesToEnvironmentVariables(() => {
                process.env.METAMASK_ENVIRONMENT = environment;
                generateDeterministicRandomNumberMock.mockReturnValue(
                  sampleUserRanking,
                );

                expect(
                  shouldCreateRpcServiceEvents({
                    error,
                    metaMetricsId: MOCK_METAMETRICS_ID,
                  }),
                ).toBe(false);
              });
            });
          });
        },
      );

      describe('if the environment is non-production', () => {
        const environment = 'development';

        it('returns true', async () => {
          await withChangesToEnvironmentVariables(() => {
            process.env.METAMASK_ENVIRONMENT = environment;

            expect(
              shouldCreateRpcServiceEvents({
                error,
                metaMetricsId: MOCK_METAMETRICS_ID,
              }),
            ).toBe(true);
          });
        });
      });

      describe('if the environment is not set', () => {
        it('returns false', async () => {
          await withChangesToEnvironmentVariables(() => {
            delete process.env.METAMASK_ENVIRONMENT;

            expect(
              shouldCreateRpcServiceEvents({
                error,
                metaMetricsId: MOCK_METAMETRICS_ID,
              }),
            ).toBe(false);
          });
        });
      });
    });

    describe('if the MetaMetrics ID is undefined', () => {
      const metaMetricsId = undefined;

      it('returns false', async () => {
        expect(
          shouldCreateRpcServiceEvents({
            error: undefined,
            metaMetricsId,
          }),
        ).toBe(false);
      });
    });

    describe('if the MetaMetrics ID is null', () => {
      const metaMetricsId = null;

      it('returns false', async () => {
        expect(
          shouldCreateRpcServiceEvents({
            error: undefined,
            metaMetricsId,
          }),
        ).toBe(false);
      });
    });
  });

  describe('if given a connection error', () => {
    const error = new TypeError('Failed to fetch');

    it('returns false', async () => {
      expect(
        shouldCreateRpcServiceEvents({
          error,
          metaMetricsId: MOCK_METAMETRICS_ID,
        }),
      ).toBe(false);
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
