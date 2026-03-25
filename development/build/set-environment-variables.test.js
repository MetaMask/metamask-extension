/**
 * @jest-environment node
 */

const { Variables } = require('../lib/variables');
const { ENVIRONMENT } = require('./constants');
const { getOAuthClientId } = require('./set-environment-variables');

const PROVIDER_CONFIG = {
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

function getVariables({ overrides = {}, omitted = [] } = {}) {
  const variables = new Variables(DECLARED_VARIABLES);
  const defaults = Object.values(PROVIDER_CONFIG).reduce((result, config) => {
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
} = {}) {
  return getOAuthClientId({
    provider,
    buildType,
    variables: getVariables({ overrides, omitted }),
    environment,
    testing,
    development,
  });
}

describe('getOAuthClientId', () => {
  describe.each(Object.entries(PROVIDER_CONFIG))(
    'when the provider is %s',
    (provider, config) => {
      it.each([ENVIRONMENT.PRODUCTION, ENVIRONMENT.RELEASE_CANDIDATE])(
        'loads referenced client IDs for %s builds',
        (environment) => {
          expect(
            runGetOAuthClientId({
              provider,
              environment,
            }),
          ).toBe(config.referencedClientId);
        },
      );

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

      it.each([
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
      ])(
        'loads direct client IDs for $name builds',
        ({ environment, testing, development }) => {
          expect(
            runGetOAuthClientId({
              provider,
              environment,
              testing,
              development,
            }),
          ).toBe(config.directClientId);
        },
      );

      it.each([
        {
          buildType: 'main',
          expectedClientId: config.uatClientId,
        },
        {
          buildType: 'flask',
          expectedClientId: config.flaskUatClientId,
        },
      ])(
        'loads UAT client IDs for $buildType staging builds',
        ({ buildType, expectedClientId }) => {
          expect(
            runGetOAuthClientId({
              provider,
              buildType,
              environment: ENVIRONMENT.STAGING,
            }),
          ).toBe(expectedClientId);
        },
      );

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
    },
  );
});
