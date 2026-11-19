import {
  BRIDGE_DEV_API_BASE_URL,
  BRIDGE_PROD_API_BASE_URL,
  BRIDGE_UAT_API_BASE_URL,
} from '@metamask/bridge-controller';
import { ENVIRONMENT } from './build';
import { getBridgeApiBaseUrlForMetaMaskEnv } from './bridge';

/**
 * Replaces `process.env` for the duration of a test with the given overrides
 * applied on top of the current env. Jest tracks this via `jest.replaceProperty`
 * and automatically restores the original `process.env` before the next test
 * (see `restoreMocks: true` in jest.config.js), so no manual cleanup is needed.
 *
 * @param overrides - env vars to set; pass `undefined` to unset a var.
 */
function setEnv(overrides: Record<string, string | undefined>) {
  jest.replaceProperty(process, 'env', {
    ...process.env,
    BRIDGE_USE_CUSTOM_BASE_URL: undefined,
    METAMASK_ENVIRONMENT: undefined,
    ...overrides,
  });
}

describe('getBridgeApiBaseUrlForMetaMaskEnv', () => {
  it('returns the custom base URL when BRIDGE_USE_CUSTOM_BASE_URL is set, regardless of METAMASK_ENVIRONMENT', () => {
    setEnv({
      BRIDGE_USE_CUSTOM_BASE_URL: 'https://custom.bridge.example',
      METAMASK_ENVIRONMENT: ENVIRONMENT.PRODUCTION,
    });

    expect(getBridgeApiBaseUrlForMetaMaskEnv()).toBe(
      'https://custom.bridge.example',
    );
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(['exp', ENVIRONMENT.STAGING])(
    'returns the UAT base URL when METAMASK_ENVIRONMENT is %s',
    (env: string) => {
      setEnv({ METAMASK_ENVIRONMENT: env });

      expect(getBridgeApiBaseUrlForMetaMaskEnv()).toBe(BRIDGE_UAT_API_BASE_URL);
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    'e2e',
    'dev',
    'local',
    ENVIRONMENT.DEVELOPMENT,
    ENVIRONMENT.TESTING,
    ENVIRONMENT.OTHER,
  ])(
    'returns the dev base URL when METAMASK_ENVIRONMENT is %s',
    (env: string) => {
      setEnv({ METAMASK_ENVIRONMENT: env });

      expect(getBridgeApiBaseUrlForMetaMaskEnv()).toBe(BRIDGE_DEV_API_BASE_URL);
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    'rc',
    'pre-release',
    'beta',
    ENVIRONMENT.RELEASE_CANDIDATE,
    ENVIRONMENT.PRODUCTION,
    ENVIRONMENT.PULL_REQUEST,
  ])(
    'returns the prod base URL when METAMASK_ENVIRONMENT is %s',
    (env: string) => {
      setEnv({ METAMASK_ENVIRONMENT: env });

      expect(getBridgeApiBaseUrlForMetaMaskEnv()).toBe(
        BRIDGE_PROD_API_BASE_URL,
      );
    },
  );

  it('returns the prod base URL when METAMASK_ENVIRONMENT is unset', () => {
    setEnv({});

    expect(getBridgeApiBaseUrlForMetaMaskEnv()).toBe(BRIDGE_PROD_API_BASE_URL);
  });

  it('returns the prod base URL when METAMASK_ENVIRONMENT is an unrecognized value', () => {
    setEnv({ METAMASK_ENVIRONMENT: 'some-unknown-environment' });

    expect(getBridgeApiBaseUrlForMetaMaskEnv()).toBe(BRIDGE_PROD_API_BASE_URL);
  });
});
