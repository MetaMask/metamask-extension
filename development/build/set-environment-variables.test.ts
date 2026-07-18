import { Variables } from '../lib/variables';
import { ENVIRONMENT } from './constants';
import { setEnvironmentVariables } from './set-environment-variables';

const SET_ENVIRONMENT_VARIABLES_DECLARED_VARIABLES = [
  'DEBUG',
  'EIP_4337_ENTRYPOINT',
  'IN_TEST',
  'INFURA_PROJECT_ID',
  'INFURA_ENV_KEY_REF',
  'INFURA_PROD_PROJECT_ID',
  'METAMASK_DEBUG',
  'SENTRY_DISTRIBUTED_TRACING_DISABLED',
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
  'SEEDLESS_ONBOARDING_ENABLED',
  'METAMASK_SHIELD_ENABLED',
  'PERPS_ENABLED',
  'ASSETS_UNIFIED_STATE_ENABLED',
  'COMPLIANCE_API_URL',
];

function getVariablesForSetEnvironmentVariables() {
  const variables = new Variables(SET_ENVIRONMENT_VARIABLES_DECLARED_VARIABLES);

  variables.set({
    DEBUG: false,
    EIP_4337_ENTRYPOINT: '0x0000000000000000000000000000000000000000',
    INFURA_PROJECT_ID: 'direct-infura-project-id',
    INFURA_ENV_KEY_REF: 'INFURA_PROD_PROJECT_ID',
    INFURA_PROD_PROJECT_ID: 'prod-infura-project-id',
    METAMASK_DEBUG: false,
    SENTRY_DISTRIBUTED_TRACING_DISABLED: false,
    PHISHING_WARNING_PAGE_URL: 'https://example.test/',
    SEGMENT_WRITE_KEY: 'direct-segment-write-key',
    SEGMENT_WRITE_KEY_REF: 'SEGMENT_PROD_WRITE_KEY',
    SEGMENT_PROD_WRITE_KEY: 'prod-segment-write-key',
    TEST_GAS_FEE_FLOWS: false,
    DEEP_LINK_HOST: 'https://deep-link.example.test',
    DEEP_LINK_PUBLIC_KEY: 'public-key',
    SEEDLESS_ONBOARDING_ENABLED: 'false',
    METAMASK_SHIELD_ENABLED: 'false',
    PERPS_ENABLED: 'false',
    ASSETS_UNIFIED_STATE_ENABLED: 'false',
    COMPLIANCE_API_URL: 'https://compliance.example.test',
  });

  return variables;
}

describe('setEnvironmentVariables', () => {
  it('does not inject OAuth client ID env vars', () => {
    const variables = getVariablesForSetEnvironmentVariables();

    variables.set('SEEDLESS_ONBOARDING_ENABLED', 'true');

    expect(() =>
      setEnvironmentVariables({
        buildName: 'MetaMask',
        isDevBuild: true,
        isTestBuild: false,
        buildType: 'main',
        environment: ENVIRONMENT.DEVELOPMENT,
        variables,
        version: '1.0.0',
      }),
    ).not.toThrow();

    expect(variables.isDeclared('GOOGLE_CLIENT_ID')).toBe(false);
    expect(variables.isDeclared('APPLE_CLIENT_ID')).toBe(false);
    expect(variables.isDeclared('TELEGRAM_CLIENT_ID')).toBe(false);
    expect(variables.get('METAMASK_BUILD_NAME')).toBe('MetaMask');
    expect(variables.get('METAMASK_BUILD_TYPE')).toBe('main');
  });
});
