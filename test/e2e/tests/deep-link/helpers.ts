import type { Mockttp } from 'mockttp';
import { canonicalize } from '../../../../shared/lib/deep-links/canonicalize';
import {
  SIG_PARAM,
  SIG_PARAMS_PARAM,
} from '../../../../shared/lib/deep-links/constants';
import { emptyHtmlPage } from '../../mock-e2e';
import FixtureBuilder from '../../fixtures/fixture-builder';

/**
 * Generates an ECDSA key pair for signing deep links for testing purposes.
 */
export async function generateECDSAKeyPair() {
  return await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify'],
  );
}

/**
 * Signs a URL using the ECDSA key pair.
 *
 * @param key
 * @param url - The URL to sign.
 * @param withSigParams - Whether to include the `sig_params` query parameter.
 * @returns A signed URL with the `sig` and `sig_params` query parameters appended, and the
 * params sorted and canonicalized.
 */
export async function signDeepLink(
  key: CryptoKey,
  url: string,
  withSigParams = true,
) {
  const canonicalUrl = canonicalize(new URL(url));
  const signedUrl = new URL(canonicalUrl);

  if (withSigParams) {
    const sigParams = [...new Set(signedUrl.searchParams.keys())];

    signedUrl.searchParams.append(SIG_PARAMS_PARAM, sigParams.join(','));
    signedUrl.searchParams.sort();
  }

  const signed = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signedUrl.toString()),
  );
  const sig = bytesToB64Url(signed);

  signedUrl.searchParams.append(SIG_PARAM, sig);

  return signedUrl.toString();
}

/**
 * Converts an ArrayBuffer to a Base64 string.
 *
 * @param bytes - The ArrayBuffer to convert.
 * @returns A Base64 encoded string representation of the input bytes.
 */
export function bytesToB64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

/**
 * Converts an ArrayBuffer to an un-padded URL-safe Base64 string.
 *
 * @param bytes - The ArrayBuffer to convert.
 * @returns A URL-safe Base64 encoded string representation of the input bytes.
 */
export function bytesToB64Url(bytes: ArrayBuffer): string {
  const b64 = bytesToB64(bytes);
  // un-padded URL-Safe base64
  return b64.replace(/[=]/gu, '').replace(/\+/gu, '-').replace(/\//gu, '_');
}

/**
 * Computes the Cartesian product of multiple arrays.
 *
 * @param sets - An array of arrays, where each inner array contains elements to
 * be combined.
 * @returns
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function cartesianProduct<T extends unknown[][]>(...sets: T) {
  return sets.reduce((a, b) =>
    a.flatMap((d) => b.map((e) => [d, e].flat())),
  ) as {
    [K in keyof T]: T[K] extends (infer U)[] ? U : never;
  }[];
}

export type DeepLinkScenario = {
  locked: 'locked' | 'unlocked';
  signed: 'signed with sig_params' | 'signed without sig_params' | 'unsigned';
  route: string;
  action: 'continue';
};

/**
 * Generates test scenarios for the given routes by creating a cartesian product
 * of lock states, signing methods, routes, and actions.
 *
 * @param routes - The routes to generate scenarios for.
 * @returns An array of scenario objects with `locked`, `signed`, `route`, and
 * `action` properties.
 */
export function generateScenariosForRoutes(
  routes: readonly string[],
): DeepLinkScenario[] {
  return cartesianProduct(
    ['locked', 'unlocked'] as const,
    [
      'signed with sig_params',
      'signed without sig_params',
      'unsigned',
    ] as const,
    [...routes],
    ['continue'] as const,
  ).map(([locked, signed, route, action]) => {
    return {
      locked,
      signed,
      route,
      action,
    } as DeepLinkScenario;
  });
}

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
      await mockDeepLinkPages(server);

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

export function getHashParams(url: URL) {
  const hash = url.hash.slice(1); // remove leading '#'
  const hashQuery = hash.split('?')[1] ?? '';
  return new URLSearchParams(hashQuery);
}
