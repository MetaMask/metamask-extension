import { Variables } from '../lib/variables';
import { ENVIRONMENT } from './constants';
import {
  getOAuthClientId,
  setEnvironmentVariables,
} from './set-environment-variables';

type ProviderConfig = {
  clientIdEnv: string;
  directClientId: string;
  clientIdRefEnv: string;
  referencedClientIdEnv: string;
  referencedClientId: string;
  uatClientIdEnv: string;
  uatClientId: string;
  flaskUatClientIdEnv: string;
  flaskUatClientId: string;
};

type Provider = 'GOOGLE' | 'APPLE' | 'TELEGRAM';

const PROVIDER_CONFIG: Record<Provider, ProviderConfig> = {
  GOOGLE: {
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    directClientId: 'google-dev-client-id',
    clientIdRefEnv: 'GOOGLE_CLIENT_ID_REF',
    referencedClientIdEnv: 'GOOGLE_PROD_CLIENT_ID',
    referencedClientId: 'google-prod-client-id',
    uatClientIdEnv: 'GOOGLE_CLIENT_ID_UAT',
    uatClientId: 'google-uat-client-id',
    flaskUatClientIdEnv: 'GOOGLE_CLIENT_ID_FLASK_UAT',
    flaskUatClientId: 'google-flask-uat-client-id',
  },
  APPLE: {
    clientIdEnv: 'APPLE_CLIENT_ID',
    directClientId: 'apple-dev-client-id',
    clientIdRefEnv: 'APPLE_CLIENT_ID_REF',
    referencedClientIdEnv: 'APPLE_PROD_CLIENT_ID',
    referencedClientId: 'apple-prod-client-id',
    uatClientIdEnv: 'APPLE_CLIENT_ID_UAT',
    uatClientId: 'apple-uat-client-id',
    flaskUatClientIdEnv: 'APPLE_CLIENT_ID_FLASK_UAT',
    flaskUatClientId: 'apple-flask-uat-client-id',
  },
  TELEGRAM: {
    clientIdEnv: 'TELEGRAM_CLIENT_ID',
    directClientId: 'telegram-dev-client-id',
    clientIdRefEnv: 'TELEGRAM_CLIENT_ID_REF',
    referencedClientIdEnv: 'TELEGRAM_PROD_CLIENT_ID',
    referencedClientId: 'telegram-prod-client-id',
    uatClientIdEnv: 'TELEGRAM_CLIENT_ID_UAT',
    uatClientId: 'telegram-uat-client-id',
    flaskUatClientIdEnv: 'TELEGRAM_CLIENT_ID_FLASK_UAT',
    flaskUatClientId: 'telegram-flask-uat-client-id',
  },
};

type VariablesOverrides = Record<string, string>;

type GetVariablesArgs = {
  overrides?: VariablesOverrides;
  omitted?: string[];
};

type RunGetOAuthClientIdArgs = {
  provider?: Provider;
  buildType?: string;
  environment?: string;
  testing?: boolean;
  development?: boolean;
  overrides?: VariablesOverrides;
  omitted?: string[];
};

const DECLARED_VARIABLES = Object.values(PROVIDER_CONFIG).flatMap(
  ({
    clientIdEnv,
    clientIdRefEnv,
    referencedClientIdEnv,
    uatClientIdEnv,
    flaskUatClientIdEnv,
  }) => [
    clientIdEnv,
    clientIdRefEnv,
    referencedClientIdEnv,
    uatClientIdEnv,
    flaskUatClientIdEnv,
  ],
);

function getVariables({ overrides = {}, omitted = [] }: GetVariablesArgs = {}) {
  const variables = new Variables(DECLARED_VARIABLES);
  const defaults = Object.values(PROVIDER_CONFIG).reduce<
    Record<string, string>
  >((result, config) => {
    result[config.clientIdEnv] = config.directClientId;
    result[config.clientIdRefEnv] = config.referencedClientIdEnv;
    result[config.referencedClientIdEnv] = config.referencedClientId;
    result[config.uatClientIdEnv] = config.uatClientId;
    result[config.flaskUatClientIdEnv] = config.flaskUatClientId;
    return result;
  }, {});

  omitted.forEach((envName) => {
    delete defaults[envName];
  });

  variables.set({
    ...defaults,
    ...overrides,
  });

  return variables;
}

function runGetOAuthClientId({
  provider = 'GOOGLE',
  buildType = 'main',
  environment = ENVIRONMENT.TESTING,
  testing = false,
  development = false,
  overrides = {},
  omitted = [],
}: RunGetOAuthClientIdArgs = {}) {
  return getOAuthClientId({
    provider,
    buildType,
    variables: getVariables({ overrides, omitted }),
    environment,
    testing,
    development,
  });
}

const providerEntries = Object.entries(PROVIDER_CONFIG) as [
  Provider,
  ProviderConfig,
][];

const SET_ENVIRONMENT_VARIABLES_DECLARED_VARIABLES = [
  ...DECLARED_VARIABLES,
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
  'TELEGRAM_LOGIN_ENABLED',
  'PERPS_ENABLED',
  'ASSETS_UNIFIED_STATE_ENABLED',
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
    TELEGRAM_LOGIN_ENABLED: 'true',
    PERPS_ENABLED: 'false',
    ASSETS_UNIFIED_STATE_ENABLED: 'false',
    GOOGLE_CLIENT_ID: 'google-dev-client-id',
    APPLE_CLIENT_ID: 'apple-dev-client-id',
    TELEGRAM_CLIENT_ID: 'telegram-dev-client-id',
    GOOGLE_CLIENT_ID_REF: 'GOOGLE_PROD_CLIENT_ID',
    APPLE_CLIENT_ID_REF: 'APPLE_PROD_CLIENT_ID',
    TELEGRAM_CLIENT_ID_REF: 'TELEGRAM_PROD_CLIENT_ID',
    GOOGLE_PROD_CLIENT_ID: 'google-prod-client-id',
    APPLE_PROD_CLIENT_ID: 'apple-prod-client-id',
    TELEGRAM_PROD_CLIENT_ID: 'telegram-prod-client-id',
    GOOGLE_CLIENT_ID_UAT: 'google-uat-client-id',
    APPLE_CLIENT_ID_UAT: 'apple-uat-client-id',
    TELEGRAM_CLIENT_ID_UAT: 'telegram-uat-client-id',
    GOOGLE_CLIENT_ID_FLASK_UAT: 'google-flask-uat-client-id',
    APPLE_CLIENT_ID_FLASK_UAT: 'apple-flask-uat-client-id',
    TELEGRAM_CLIENT_ID_FLASK_UAT: 'telegram-flask-uat-client-id',
  });

  return variables;
}

describe('getOAuthClientId', () => {
  for (const [provider, config] of providerEntries) {
    describe(`when the provider is ${provider}`, () => {
      for (const environment of [
        ENVIRONMENT.PRODUCTION,
        ENVIRONMENT.RELEASE_CANDIDATE,
      ]) {
        it(`loads referenced client IDs for ${environment} builds`, () => {
          expect(
            runGetOAuthClientId({
              provider,
              environment,
            }),
          ).toBe(config.referencedClientId);
        });

        it(`throws when the referenced client ID is missing for ${environment} builds`, () => {
          expect(() =>
            runGetOAuthClientId({
              provider,
              environment,
              omitted: [config.referencedClientIdEnv],
            }),
          ).toThrow(
            `Tried to access a declared, but not defined environmental variable "${config.referencedClientIdEnv}"`,
          );
        });
      }

      it('prefers referenced client IDs when production environment overlaps with test and development flags', () => {
        expect(
          runGetOAuthClientId({
            provider,
            environment: ENVIRONMENT.PRODUCTION,
            testing: true,
            development: true,
          }),
        ).toBe(config.referencedClientId);
      });

      const directClientIdTestCases = [
        {
          name: 'test',
          environment: ENVIRONMENT.TESTING,
          testing: true,
          development: false,
        },
        {
          name: 'development',
          environment: ENVIRONMENT.DEVELOPMENT,
          testing: false,
          development: true,
        },
      ];

      for (const {
        name,
        environment,
        testing,
        development,
      } of directClientIdTestCases) {
        it(`loads direct client IDs for ${name} builds`, () => {
          expect(
            runGetOAuthClientId({
              provider,
              environment,
              testing,
              development,
            }),
          ).toBe(config.directClientId);
        });
      }

      const stagingBuildTestCases = [
        {
          buildType: 'main',
          expectedClientId: config.uatClientId,
        },
        {
          buildType: 'flask',
          expectedClientId: config.flaskUatClientId,
        },
      ] as const;

      for (const { buildType, expectedClientId } of stagingBuildTestCases) {
        it(`loads UAT client IDs for ${buildType} staging builds`, () => {
          expect(
            runGetOAuthClientId({
              provider,
              buildType,
              environment: ENVIRONMENT.STAGING,
            }),
          ).toBe(expectedClientId);
        });
      }

      it('throws when the direct client ID is missing for test builds', () => {
        expect(() =>
          runGetOAuthClientId({
            provider,
            environment: ENVIRONMENT.TESTING,
            testing: true,
            omitted: [config.clientIdEnv],
          }),
        ).toThrow(
          `${config.clientIdEnv} is not set for seedless onboarding enabled build`,
        );
      });
    });
  }
});

describe('setEnvironmentVariables', () => {
  it('forces TELEGRAM_LOGIN_ENABLED to false for production builds', () => {
    const variables = getVariablesForSetEnvironmentVariables();

    setEnvironmentVariables({
      buildName: 'MetaMask',
      buildType: 'main',
      environment: ENVIRONMENT.PRODUCTION,
      isDevBuild: false,
      isTestBuild: false,
      variables,
      version: '1.0.0',
    });

    expect(variables.get('TELEGRAM_LOGIN_ENABLED')).toBe('false');
  });

  it('forces TELEGRAM_LOGIN_ENABLED to false for release candidate builds', () => {
    const variables = getVariablesForSetEnvironmentVariables();

    setEnvironmentVariables({
      buildName: 'MetaMask',
      buildType: 'main',
      environment: ENVIRONMENT.RELEASE_CANDIDATE,
      isDevBuild: false,
      isTestBuild: false,
      variables,
      version: '1.0.0',
    });

    expect(variables.get('TELEGRAM_LOGIN_ENABLED')).toBe('false');
  });

  it('preserves TELEGRAM_LOGIN_ENABLED outside production and release builds', () => {
    const variables = getVariablesForSetEnvironmentVariables();

    setEnvironmentVariables({
      buildName: 'MetaMask',
      buildType: 'main',
      environment: ENVIRONMENT.TESTING,
      isDevBuild: false,
      isTestBuild: true,
      variables,
      version: '1.0.0',
    });

    expect(variables.get('TELEGRAM_LOGIN_ENABLED')).toBe('true');
  });
});
