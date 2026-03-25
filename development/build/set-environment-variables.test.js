/**
 * @jest-environment node
 */

jest.mock('node:fs', () => ({
  readFileSync: jest.fn(() => 'mocked-svg'),
}));

const { Variables } = require('../lib/variables');
const { ENVIRONMENT } = require('./constants');
const { setEnvironmentVariables } = require('./set-environment-variables');

const DECLARED_VARIABLES = [
  'SEEDLESS_ONBOARDING_ENABLED',
  'DEBUG',
  'EIP_4337_ENTRYPOINT',
  'IN_TEST',
  'INFURA_PROJECT_ID',
  'INFURA_ENV_KEY_REF',
  'INFURA_PROD_PROJECT_ID',
  'METAMASK_DEBUG',
  'METAMASK_BUILD_NAME',
  'METAMASK_BUILD_APP_ID',
  'METAMASK_BUILD_ICON',
  'METAMASK_ENVIRONMENT',
  'METAMASK_VERSION',
  'METAMASK_BUILD_TYPE',
  'NODE_ENV',
  'PHISHING_WARNING_PAGE_URL',
  'SEGMENT_WRITE_KEY',
  'SEGMENT_WRITE_KEY_REF',
  'SEGMENT_PROD_WRITE_KEY',
  'TEST_GAS_FEE_FLOWS',
  'DEEP_LINK_HOST',
  'DEEP_LINK_PUBLIC_KEY',
  'METAMASK_SHIELD_ENABLED',
  'PERPS_ENABLED',
  'GOOGLE_CLIENT_ID',
  'APPLE_CLIENT_ID',
  'GOOGLE_CLIENT_ID_REF',
  'APPLE_CLIENT_ID_REF',
  'GOOGLE_PROD_CLIENT_ID',
  'APPLE_PROD_CLIENT_ID',
  'GOOGLE_CLIENT_ID_UAT',
  'APPLE_CLIENT_ID_UAT',
  'GOOGLE_CLIENT_ID_FLASK_UAT',
  'APPLE_CLIENT_ID_FLASK_UAT',
];

function getVariables(overrides = {}) {
  const variables = new Variables(DECLARED_VARIABLES);

  variables.set({
    SEEDLESS_ONBOARDING_ENABLED: 'true',
    DEBUG: false,
    EIP_4337_ENTRYPOINT: undefined,
    INFURA_PROJECT_ID: 'dev-infura-project-id',
    INFURA_ENV_KEY_REF: 'INFURA_PROD_PROJECT_ID',
    INFURA_PROD_PROJECT_ID: 'prod-infura-project-id',
    METAMASK_DEBUG: false,
    PHISHING_WARNING_PAGE_URL: 'https://example.com/',
    SEGMENT_WRITE_KEY: 'segment-dev-write-key',
    SEGMENT_WRITE_KEY_REF: 'SEGMENT_PROD_WRITE_KEY',
    SEGMENT_PROD_WRITE_KEY: 'segment-prod-write-key',
    TEST_GAS_FEE_FLOWS: false,
    DEEP_LINK_HOST: undefined,
    DEEP_LINK_PUBLIC_KEY: undefined,
    METAMASK_SHIELD_ENABLED: false,
    PERPS_ENABLED: false,
    GOOGLE_CLIENT_ID: 'google-dev-client-id',
    APPLE_CLIENT_ID: 'apple-dev-client-id',
    GOOGLE_CLIENT_ID_REF: 'GOOGLE_PROD_CLIENT_ID',
    APPLE_CLIENT_ID_REF: 'APPLE_PROD_CLIENT_ID',
    GOOGLE_PROD_CLIENT_ID: 'google-prod-client-id',
    APPLE_PROD_CLIENT_ID: 'apple-prod-client-id',
    GOOGLE_CLIENT_ID_UAT: 'google-uat-client-id',
    APPLE_CLIENT_ID_UAT: 'apple-uat-client-id',
    GOOGLE_CLIENT_ID_FLASK_UAT: 'google-flask-uat-client-id',
    APPLE_CLIENT_ID_FLASK_UAT: 'apple-flask-uat-client-id',
    ...overrides,
  });

  return variables;
}

function runSetEnvironmentVariables({
  buildType = 'main',
  environment = ENVIRONMENT.TESTING,
  isDevBuild = false,
  isTestBuild = false,
  variables: variablesOverrides = {},
} = {}) {
  const variables = getVariables(variablesOverrides);

  setEnvironmentVariables({
    buildName: 'test-build',
    isDevBuild,
    isTestBuild,
    buildType,
    environment,
    variables,
    version: '1.0.0',
  });

  return variables;
}

describe('setEnvironmentVariables', () => {
  describe('when seedless onboarding is enabled', () => {
    it.each([ENVIRONMENT.PRODUCTION, ENVIRONMENT.RELEASE_CANDIDATE])(
      'loads referenced OAuth client IDs for %s builds',
      (environment) => {
        const variables = runSetEnvironmentVariables({
          environment,
        });

        expect(variables.get('GOOGLE_CLIENT_ID')).toBe('google-prod-client-id');
        expect(variables.get('APPLE_CLIENT_ID')).toBe('apple-prod-client-id');
      },
    );

    it('loads direct OAuth client IDs for test builds', () => {
      const variables = runSetEnvironmentVariables({
        environment: ENVIRONMENT.TESTING,
        isTestBuild: true,
      });

      expect(variables.get('GOOGLE_CLIENT_ID')).toBe('google-dev-client-id');
      expect(variables.get('APPLE_CLIENT_ID')).toBe('apple-dev-client-id');
    });

    it.each([
      ['main', 'google-uat-client-id', 'apple-uat-client-id'],
      ['flask', 'google-flask-uat-client-id', 'apple-flask-uat-client-id'],
    ])(
      'loads UAT OAuth client IDs for %s dist builds',
      (buildType, expectedGoogleClientId, expectedAppleClientId) => {
        const variables = runSetEnvironmentVariables({
          buildType,
          environment: ENVIRONMENT.STAGING,
        });

        expect(variables.get('GOOGLE_CLIENT_ID')).toBe(expectedGoogleClientId);
        expect(variables.get('APPLE_CLIENT_ID')).toBe(expectedAppleClientId);
      },
    );
  });
});
