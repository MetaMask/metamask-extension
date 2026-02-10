import type { Mockttp } from 'mockttp';
import { emptyHtmlPage } from '../../mock-e2e';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { signDeepLink } from './helpers';

const TEST_PAGE = 'https://doesntexist.test/';

/**
 * Options for navigating to a deep link.
 */
export type DeepLinkNavigationOptions = {
  /** The route path to navigate to (e.g., '/home', '/swap') */
  route: string;
  /** Whether the link should be signed */
  signed: 'signed with sig_params' | 'signed without sig_params' | 'unsigned';
  /** The private key to use for signing (required if signed) */
  privateKey?: CryptoKey;
};

/**
 * Configuration options for deep link tests.
 */
export type DeepLinkTestConfigOptions = {
  /** Title of the test for debugging and logging */
  title?: string;
  /** Public key for deep link verification */
  deepLinkPublicKey?: string;
  /** Additional manifest flags to merge */
  manifestFlags?: Record<string, unknown>;
  /** Additional test-specific mocks to add */
  additionalMocks?: (server: Mockttp) => Promise<void>;
};

/**
 * Mocks the deep link domain and test page.
 * This is the common mock setup used across all deep link tests.
 *
 * @param server - The Mockttp server instance.
 */
export const mockDeepLinkPages = async (server: Mockttp): Promise<void> => {
  // Deep Links
  await server
    .forGet(/^https?:\/\/link\.metamask\.io\/.*$/u)
    .thenCallback(() => {
      return {
        statusCode: 200,
        body: emptyHtmlPage(),
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      };
    });
  await server.forGet(TEST_PAGE).thenCallback(() => {
    return {
      statusCode: 200,
      body: emptyHtmlPage(),
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    };
  });
};

/**
 * Generates the configuration for deep link tests, including fixtures,
 * manifest flags, and test-specific mocking.
 *
 * @param options - Configuration options for the deep link test.
 * @returns The test configuration object for use with withFixtures.
 */
export const getConfig = async (options: DeepLinkTestConfigOptions = {}) => {
  const {
    title,
    deepLinkPublicKey,
    manifestFlags = {},
    additionalMocks,
  } = options;

  return {
    fixtures: new FixtureBuilder().build(),
    title,
    manifestFlags: {
      testing: {
        deepLinkPublicKey,
        ...((manifestFlags.testing as Record<string, unknown>) ?? {}),
      },
      ...Object.fromEntries(
        Object.entries(manifestFlags).filter(([key]) => key !== 'testing'),
      ),
    },
    testSpecificMock: async (server: Mockttp) => {
      // Common deep link mocks
      await mockDeepLinkPages(server);

      // Additional test-specific mocks
      if (additionalMocks) {
        await additionalMocks(server);
      }
    },
  };
};

/**
 * Prepares a deep link URL by optionally signing it based on the provided options.
 *
 * @param options - Navigation options including route, signing preference, and private key.
 * @returns The prepared URL string (signed or unsigned).
 */
export const prepareDeepLinkUrl = async (
  options: DeepLinkNavigationOptions,
): Promise<string> => {
  const { route, signed, privateKey } = options;

  const isSigned =
    signed === 'signed with sig_params' ||
    signed === 'signed without sig_params';
  const withSigParams = signed === 'signed with sig_params';

  const rawUrl = `https://link.metamask.io${route}`;

  if (isSigned) {
    if (!privateKey) {
      throw new Error('privateKey is required for signed deep links');
    }
    return await signDeepLink(privateKey, rawUrl, withSigParams);
  }

  return rawUrl;
};

/**
 * Checks if the deep link interstitial should render the skip checkbox
 * based on the signing status.
 *
 * @param signed - The signing status of the deep link.
 * @returns True if the checkbox should be rendered, false otherwise.
 */
export const shouldRenderCheckbox = (
  signed: DeepLinkNavigationOptions['signed'],
): boolean => {
  return (
    signed === 'signed with sig_params' ||
    signed === 'signed without sig_params'
  );
};

/**
 * Mocks the rewards API endpoints for testing.
 *
 * @param server - The Mockttp server instance.
 */
export const mockRewardsApi = async (server: Mockttp): Promise<void> => {
  // Rewards
  await server
    .forPost('https://rewards.uat-api.cx.metamask.io/public/rewards/ois')
    .thenJson(200, {
      ois: [true],
      sids: ['019b2245-9533-7739-a89c-b4c839a3d53a'],
    });

  await server
    .forPost('https://rewards.uat-api.cx.metamask.io/auth/mobile-login')
    .thenJson(200, {
      sessionId: 'yErC0OBAAh9BlS7frZYkjGz6RVyoo4p3R6nz3THmQlc=',
      accessToken: 'yErC0OBAAh9BlS7frZYkjGz6RVyoo4p3R6nz3THmQlc=',
      subscription: {
        id: '019b2245-9533-7739-a89c-b4c839a3d53a',
        createdAt: '2025-12-15T13:49:04.180Z',
        updatedAt: '2025-12-15T13:49:04.180Z',
        referralCode: '4DFZV9',
        accounts: [
          {
            id: 4338,
            address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
            blockchain: 1,
            subscriptionId: '019b2245-9533-7739-a89c-b4c839a3d53a',
            createdAt: '2025-12-15T13:49:04.180Z',
            updatedAt: '2025-12-15T13:49:04.180Z',
          },
        ],
      },
    });
};
