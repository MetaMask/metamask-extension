import { Variables } from '../lib/variables';
import { ENVIRONMENT } from './constants';
import { getOAuthClientId } from './set-environment-variables';

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

type Provider = 'GOOGLE' | 'APPLE';

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
