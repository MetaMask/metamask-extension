import { generateDeterministicRandomNumber } from '@metamask/remote-feature-flag-controller';

import { ENVIRONMENT } from '../../../../development/build/constants';
import { QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME } from '../../../../shared/constants/network';
import {
  getIsQuicknodeEndpointUrl,
  shouldCreateRpcServiceEvents,
} from './utils';

jest.mock('@metamask/remote-feature-flag-controller', () => {
  return {
    ...jest.requireActual('@metamask/remote-feature-flag-controller'),
    // This is the name of the property that turns this into an ES module.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    generateDeterministicRandomNumber: jest.fn(),
  };
});

const generateDeterministicRandomNumberMock = jest.mocked(
  generateDeterministicRandomNumber,
);

const MOCK_METAMETRICS_ID =
  '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420';

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

describe('shouldCreateRpcServiceEvents', () => {
  // @ts-expect-error The Mocha types are incorrect.
  it.each([ENVIRONMENT.PRODUCTION, ENVIRONMENT.RELEASE_CANDIDATE])(
    'returns false given a connection error, even when given a non-null metametricsId, METAMASK_ENVIRONMENT is "%s", and the user is in the sample',
    async (metamaskEnvironment: string | undefined) => {
      await withChangesToEnvironmentVariables(() => {
        process.env.METAMASK_ENVIRONMENT = metamaskEnvironment;
        generateDeterministicRandomNumberMock.mockReturnValue(0.009999);
        const error = new TypeError('Failed to fetch');
        expect(shouldCreateRpcServiceEvents(error, MOCK_METAMETRICS_ID)).toBe(
          false,
        );
      });
    },
  );

  // @ts-expect-error The Mocha types are incorrect.
  describe.each([
    ['a non-connection error', new Error('some error')],
    ['no error', undefined],
  ])('given %s', (_description: string, error: unknown) => {
    it('returns false given a null metaMetricsId', () => {
      expect(shouldCreateRpcServiceEvents(error, null)).toBe(false);
    });

    it('returns false given a non-null metaMetricsId, but METAMASK_ENVIRONMENT is not set', async () => {
      await withChangesToEnvironmentVariables(() => {
        delete process.env.METAMASK_ENVIRONMENT;

        expect(shouldCreateRpcServiceEvents(error, MOCK_METAMETRICS_ID)).toBe(
          false,
        );
      });
    });

    it('returns true when METAMASK_ENVIRONMENT is not "production" or "release-candidate"', async () => {
      await withChangesToEnvironmentVariables(() => {
        process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;

        expect(shouldCreateRpcServiceEvents(error, MOCK_METAMETRICS_ID)).toBe(
          true,
        );
      });
    });

    // @ts-expect-error The Mocha types are incorrect.
    describe.each([ENVIRONMENT.PRODUCTION, ENVIRONMENT.RELEASE_CANDIDATE])(
      'if METAMASK_ENVIRONMENT is "%s"',
      (metamaskEnvironment: string) => {
        it('returns false when the MetaMetrics user is not within the sample', async () => {
          await withChangesToEnvironmentVariables(() => {
            process.env.METAMASK_ENVIRONMENT = metamaskEnvironment;
            generateDeterministicRandomNumberMock.mockReturnValue(0.2);

            expect(
              shouldCreateRpcServiceEvents(error, MOCK_METAMETRICS_ID),
            ).toBe(false);
          });
        });

        it('returns true when the MetaMetrics user is within the sample', async () => {
          await withChangesToEnvironmentVariables(() => {
            process.env.METAMASK_ENVIRONMENT = metamaskEnvironment;
            generateDeterministicRandomNumberMock.mockReturnValue(0.009999);

            expect(
              shouldCreateRpcServiceEvents(error, MOCK_METAMETRICS_ID),
            ).toBe(true);
          });
        });
      },
    );
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
