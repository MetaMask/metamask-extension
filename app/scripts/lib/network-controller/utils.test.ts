import { generateDeterministicRandomNumber } from '@metamask/remote-feature-flag-controller';

import { QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME } from '../../../../shared/constants/network';
import {
  KNOWN_CUSTOM_ENDPOINTS,
  PRODUCTION_LIKE_ENVIRONMENTS,
  getIsQuicknodeEndpointUrl,
  getIsMetaMaskInfuraEndpointUrl,
  shouldCreateRpcServiceEvents,
} from './utils';

jest.mock('@metamask/remote-feature-flag-controller', () => ({
  ...jest.requireActual('@metamask/remote-feature-flag-controller'),
  // This is the name of the property that turns this into an ES module.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  generateDeterministicRandomNumber: jest.fn(),
}));

jest.mock('../../../../shared/constants/network', () => {
  // The network constants file relies on INFURA_PROJECT_ID already being set.
  // If we set it in a test, then it's already too late.
  // Therefore, we have to set it to a known value before loading the file.
  const previousInfuraProjectId = process.env.INFURA_PROJECT_ID;
  // NOTE: This must match MOCK_METAMASK_INFURA_PROJECT_ID below.
  process.env.INFURA_PROJECT_ID = 'metamask-infura-project-id';
  const mod = jest.requireActual('../../../../shared/constants/network');
  process.env.INFURA_PROJECT_ID = previousInfuraProjectId;
  return mod;
});

const generateDeterministicRandomNumberMock = jest.mocked(
  generateDeterministicRandomNumber,
);

const MOCK_METAMASK_INFURA_PROJECT_ID = 'metamask-infura-project-id';

const MOCK_METAMETRICS_ID =
  '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420';

describe('getIsMetaMaskInfuraEndpointUrl', () => {
  it('returns true if the URL has an Infura hostname with some subdomain whose path starts with the MetaMask API key', () => {
    expect(
      getIsMetaMaskInfuraEndpointUrl(
        'https://some-subdomain.infura.io/v3/the-infura-project-id',
        'the-infura-project-id',
      ),
    ).toBe(true);
  });

  it('returns false if the URL has an Infura hostname with some subdomain whose path does not start with the MetaMask API key', () => {
    expect(
      getIsMetaMaskInfuraEndpointUrl(
        'https://some-subdomain.infura.io/v3/a-different-infura-project-id',
        'the-infura-project-id',
      ),
    ).toBe(false);
  });

  it('returns false if the URL does match an Infura URL', () => {
    expect(
      getIsMetaMaskInfuraEndpointUrl(
        'https://a-different-url.com',
        'the-infura-project-id',
      ),
    ).toBe(false);
  });
});

describe('getIsQuicknodeEndpointUrl', () => {
  for (const [infuraNetwork, getQuicknodeEndpointUrl] of Object.entries(
    QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME,
  )) {
    it(`returns true when given the known Quicknode URL for the Infura network '${infuraNetwork}`, async () => {
      await withChangesToEnvironmentVariables(() => {
        process.env.QUICKNODE_MAINNET_URL =
          'https://example.quicknode.com/mainnet';
        process.env.QUICKNODE_LINEA_MAINNET_URL =
          'https://example.quicknode.com/linea-mainnet';
        process.env.QUICKNODE_ARBITRUM_URL =
          'https://example.quicknode.com/arbitrum';
        process.env.QUICKNODE_AVALANCHE_URL =
          'https://example.quicknode.com/avalanche';
        process.env.QUICKNODE_OPTIMISM_URL =
          'https://example.quicknode.com/optimism';
        process.env.QUICKNODE_POLYGON_URL =
          'https://example.quicknode.com/polygon';
        process.env.QUICKNODE_BASE_URL = 'https://example.quicknode.com/base';
        process.env.QUICKNODE_BSC_URL = 'https://example.quicknode.com/bsc';

        // We can assume this is set.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const endpointUrl = getQuicknodeEndpointUrl()!;

        expect(getIsQuicknodeEndpointUrl(endpointUrl)).toBe(true);
      });
    });
  }

  it('returns false when given a non-Quicknode URL', () => {
    expect(getIsQuicknodeEndpointUrl('https://some.random.url')).toBe(false);
  });
});

const ENDPOINTS_TO_TEST = [
  [
    'an Infura endpoint using the MetaMask API key',
    () => `https://mainnet.infura.io/v3/${MOCK_METAMASK_INFURA_PROJECT_ID}`,
  ],
  ...Object.entries(QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME).map(
    ([infuraNetworkName, getUrl]) => [
      `the Quicknode endpoint URL for ${infuraNetworkName}`,
      getUrl,
    ],
  ),
  ...KNOWN_CUSTOM_ENDPOINTS.map(({ name, url }) => [
    `the known custom network ${name} (${url})`,
    () => url,
  ]),
];

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

            // @ts-expect-error The Mocha types are incorrect.
            describe.each(ENDPOINTS_TO_TEST)(
              'if the endpoint URL is %s',
              (_description: string, getEndpointUrl: () => string) => {
                it('returns true', async () => {
                  await withChangesToEnvironmentVariables(() => {
                    process.env.METAMASK_ENVIRONMENT = environment;
                    setQuicknodeEnvironmentVariables();
                    generateDeterministicRandomNumberMock.mockReturnValue(
                      sampleUserRanking,
                    );

                    expect(
                      shouldCreateRpcServiceEvents({
                        endpointUrl: getEndpointUrl(),
                        error,
                        infuraProjectId: MOCK_METAMASK_INFURA_PROJECT_ID,
                        metaMetricsId: MOCK_METAMETRICS_ID,
                      }),
                    ).toBe(true);
                  });
                });
              },
            );
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
                    endpointUrl: 'https://example.com',
                    error,
                    infuraProjectId: MOCK_METAMASK_INFURA_PROJECT_ID,
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

        // @ts-expect-error The Mocha types are incorrect.
        describe.each(ENDPOINTS_TO_TEST)(
          'if the endpoint URL is %s',
          (_description: string, getEndpointUrl: () => string) => {
            it('returns true', async () => {
              await withChangesToEnvironmentVariables(() => {
                process.env.METAMASK_ENVIRONMENT = environment;
                setQuicknodeEnvironmentVariables();

                expect(
                  shouldCreateRpcServiceEvents({
                    endpointUrl: getEndpointUrl(),
                    error,
                    infuraProjectId: MOCK_METAMASK_INFURA_PROJECT_ID,
                    metaMetricsId: MOCK_METAMETRICS_ID,
                  }),
                ).toBe(true);
              });
            });
          },
        );
      });

      describe('if the environment is not set', () => {
        it('returns false', async () => {
          await withChangesToEnvironmentVariables(() => {
            delete process.env.METAMASK_ENVIRONMENT;

            expect(
              shouldCreateRpcServiceEvents({
                endpointUrl: 'https://example.com',
                error,
                infuraProjectId: MOCK_METAMASK_INFURA_PROJECT_ID,
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
            endpointUrl: 'https://example.com',
            error: undefined,
            infuraProjectId: MOCK_METAMASK_INFURA_PROJECT_ID,
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
            endpointUrl: 'https://example.com',
            error: undefined,
            infuraProjectId: MOCK_METAMASK_INFURA_PROJECT_ID,
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

            // @ts-expect-error The Mocha types are incorrect.
            describe.each(ENDPOINTS_TO_TEST)(
              'if the endpoint URL is %s',
              (_description: string, getEndpointUrl: () => string) => {
                it('returns true', async () => {
                  await withChangesToEnvironmentVariables(() => {
                    process.env.METAMASK_ENVIRONMENT = environment;
                    setQuicknodeEnvironmentVariables();
                    generateDeterministicRandomNumberMock.mockReturnValue(
                      sampleUserRanking,
                    );

                    expect(
                      shouldCreateRpcServiceEvents({
                        endpointUrl: getEndpointUrl(),
                        error,
                        infuraProjectId: MOCK_METAMASK_INFURA_PROJECT_ID,
                        metaMetricsId: MOCK_METAMETRICS_ID,
                      }),
                    ).toBe(true);
                  });
                });
              },
            );
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
                    endpointUrl: 'https://example.com',
                    error,
                    infuraProjectId: MOCK_METAMASK_INFURA_PROJECT_ID,
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

        // @ts-expect-error The Mocha types are incorrect.
        describe.each(ENDPOINTS_TO_TEST)(
          'if the endpoint URL is %s',
          (_description: string, getEndpointUrl: () => string) => {
            it('returns true', async () => {
              await withChangesToEnvironmentVariables(() => {
                process.env.METAMASK_ENVIRONMENT = environment;
                setQuicknodeEnvironmentVariables();

                expect(
                  shouldCreateRpcServiceEvents({
                    endpointUrl: getEndpointUrl(),
                    error,
                    infuraProjectId: MOCK_METAMASK_INFURA_PROJECT_ID,
                    metaMetricsId: MOCK_METAMETRICS_ID,
                  }),
                ).toBe(true);
              });
            });
          },
        );
      });

      describe('if the environment is not set', () => {
        it('returns false', async () => {
          await withChangesToEnvironmentVariables(() => {
            delete process.env.METAMASK_ENVIRONMENT;

            expect(
              shouldCreateRpcServiceEvents({
                endpointUrl: 'https://example.com',
                error,
                infuraProjectId: MOCK_METAMASK_INFURA_PROJECT_ID,
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
            endpointUrl: 'https://example.com',
            error: undefined,
            infuraProjectId: MOCK_METAMASK_INFURA_PROJECT_ID,
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
            endpointUrl: 'https://example.com',
            error: undefined,
            infuraProjectId: MOCK_METAMASK_INFURA_PROJECT_ID,
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
          endpointUrl: 'https://example.com',
          error,
          infuraProjectId: MOCK_METAMASK_INFURA_PROJECT_ID,
          metaMetricsId: MOCK_METAMETRICS_ID,
        }),
      ).toBe(false);
    });
  });
});

/**
 * Sets the environment variables that represent all networks that have
 * Quicknode endpoints.
 */
function setQuicknodeEnvironmentVariables() {
  process.env.QUICKNODE_MAINNET_URL = 'https://example.quicknode.com/mainnet';
  process.env.QUICKNODE_LINEA_MAINNET_URL =
    'https://example.quicknode.com/linea-mainnet';
  process.env.QUICKNODE_ARBITRUM_URL = 'https://example.quicknode.com/arbitrum';
  process.env.QUICKNODE_AVALANCHE_URL =
    'https://example.quicknode.com/avalanche';
  process.env.QUICKNODE_OPTIMISM_URL = 'https://example.quicknode.com/optimism';
  process.env.QUICKNODE_POLYGON_URL = 'https://example.quicknode.com/polygon';
  process.env.QUICKNODE_BASE_URL = 'https://example.quicknode.com/base';
  process.env.QUICKNODE_BSC_URL = 'https://example.quicknode.com/bsc';
}

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
