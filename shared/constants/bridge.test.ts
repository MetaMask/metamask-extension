// eslint-disable-next-line @typescript-eslint/no-shadow
import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  BRIDGE_DEV_API_BASE_URL,
  BRIDGE_PROD_API_BASE_URL,
  BRIDGE_UAT_API_BASE_URL,
} from '@metamask/bridge-controller';
import { ENVIRONMENT } from './build';
import { getBridgeApiBaseUrlForMetaMaskEnv } from './bridge';

describe('getBridgeApiBaseUrlForMetaMaskEnv', () => {
  let originalMetaMaskEnvironment: string | undefined;

  beforeAll(() => {
    originalMetaMaskEnvironment = process.env.METAMASK_ENVIRONMENT;
  });

  afterEach(() => {
    process.env.METAMASK_ENVIRONMENT = originalMetaMaskEnvironment;
  });

  it.each(['exp', ENVIRONMENT.STAGING])(
    'returns the UAT base URL when METAMASK_ENVIRONMENT is "%s"',
    (env) => {
      process.env.METAMASK_ENVIRONMENT = env;
      expect(getBridgeApiBaseUrlForMetaMaskEnv()).toBe(BRIDGE_UAT_API_BASE_URL);
    },
  );

  it.each([
    'e2e',
    'dev',
    'local',
    'test',
    ENVIRONMENT.DEVELOPMENT,
    ENVIRONMENT.TESTING,
    ENVIRONMENT.OTHER,
  ])('returns the dev base URL when METAMASK_ENVIRONMENT is "%s"', (env) => {
    process.env.METAMASK_ENVIRONMENT = env;
    expect(getBridgeApiBaseUrlForMetaMaskEnv()).toBe(BRIDGE_DEV_API_BASE_URL);
  });

  it.each([
    'production',
    'rc',
    'pre-release',
    'beta',
    ENVIRONMENT.RELEASE_CANDIDATE,
    ENVIRONMENT.PRODUCTION,
    ENVIRONMENT.PULL_REQUEST,
  ])(
    'returns the production base URL when METAMASK_ENVIRONMENT is "%s"',
    (env) => {
      process.env.METAMASK_ENVIRONMENT = env;
      expect(getBridgeApiBaseUrlForMetaMaskEnv()).toBe(
        BRIDGE_PROD_API_BASE_URL,
      );
    },
  );

  it('returns the production base URL when METAMASK_ENVIRONMENT is unset', () => {
    delete process.env.METAMASK_ENVIRONMENT;
    expect(getBridgeApiBaseUrlForMetaMaskEnv()).toBe(BRIDGE_PROD_API_BASE_URL);
  });

  it('returns the production base URL when METAMASK_ENVIRONMENT is an unrecognized value', () => {
    process.env.METAMASK_ENVIRONMENT = 'some-unrecognized-environment';
    expect(getBridgeApiBaseUrlForMetaMaskEnv()).toBe(BRIDGE_PROD_API_BASE_URL);
  });
});

describe('BRIDGE_API_BASE_URL', () => {
  let originalMetaMaskEnvironment: string | undefined;
  let originalCustomBaseUrl: string | undefined;

  beforeAll(() => {
    originalMetaMaskEnvironment = process.env.METAMASK_ENVIRONMENT;
    originalCustomBaseUrl = process.env.BRIDGE_USE_CUSTOM_BASE_URL;
  });

  afterEach(() => {
    process.env.METAMASK_ENVIRONMENT = originalMetaMaskEnvironment;
    process.env.BRIDGE_USE_CUSTOM_BASE_URL = originalCustomBaseUrl;
    jest.resetModules();
  });

  /**
   * `BRIDGE_API_BASE_URL` is computed once, at module load time, so it must
   * be re-imported after changing the environment variables it depends on.
   *
   * @returns the freshly loaded `BRIDGE_API_BASE_URL` value
   */
  function loadBridgeApiBaseUrl(): string {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- intentional post-resetModules reload
    const { BRIDGE_API_BASE_URL } = require('./bridge') as {
      BRIDGE_API_BASE_URL: string;
    };
    return BRIDGE_API_BASE_URL;
  }

  it('uses the environment-based mapping when BRIDGE_USE_CUSTOM_BASE_URL is unset', () => {
    delete process.env.BRIDGE_USE_CUSTOM_BASE_URL;
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.STAGING;
    expect(loadBridgeApiBaseUrl()).toBe(BRIDGE_UAT_API_BASE_URL);
  });

  it('uses the environment-based mapping when BRIDGE_USE_CUSTOM_BASE_URL is an empty string', () => {
    process.env.BRIDGE_USE_CUSTOM_BASE_URL = '';
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;
    expect(loadBridgeApiBaseUrl()).toBe(BRIDGE_PROD_API_BASE_URL);
  });

  it('overrides the environment-based mapping when BRIDGE_USE_CUSTOM_BASE_URL is set', () => {
    const customBaseUrl = 'http://localhost:8080';
    process.env.BRIDGE_USE_CUSTOM_BASE_URL = customBaseUrl;
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;
    expect(loadBridgeApiBaseUrl()).toBe(customBaseUrl);
  });
});
