import { Env } from '@metamask/profile-sync-controller/sdk';
import { ENVIRONMENT } from '../../constants/build';
import { loadAuthenticationConfig } from './config';

const environmentKeys = [
  'FORCE_AUTH_MATCH_BUILD',
  'METAMASK_BUILD_TYPE',
  'METAMASK_ENVIRONMENT',
  'MM_DEV_API_ENV',
] as const;

describe('loadAuthenticationConfig', () => {
  const originalEnvironment = Object.fromEntries(
    environmentKeys.map((key) => [key, process.env[key]]),
  );

  beforeEach(() => {
    environmentKeys.forEach((key) => delete process.env[key]);
  });

  afterAll(() => {
    environmentKeys.forEach((key) => {
      const value = originalEnvironment[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });

  it('selects the authentication environment from the build configuration', () => {
    const defaultEnvironment = loadAuthenticationConfig();

    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;
    const developmentEnvironment = loadAuthenticationConfig();

    process.env.MM_DEV_API_ENV = 'dev';
    const optedInDevelopmentEnvironment = loadAuthenticationConfig();

    process.env.MM_DEV_API_ENV = 'prod';
    const optedOutDevelopmentEnvironment = loadAuthenticationConfig();

    delete process.env.MM_DEV_API_ENV;
    process.env.FORCE_AUTH_MATCH_BUILD = 'true';
    process.env.METAMASK_BUILD_TYPE = 'beta';
    const betaEnvironment = loadAuthenticationConfig();

    process.env.METAMASK_BUILD_TYPE = 'uat';
    const uatEnvironment = loadAuthenticationConfig();

    process.env.METAMASK_BUILD_TYPE = 'main';
    process.env.MM_DEV_API_ENV = 'dev';
    const forcedMainEnvironment = loadAuthenticationConfig();

    process.env.METAMASK_BUILD_TYPE = 'beta';
    const forcedBetaWithDevFlag = loadAuthenticationConfig();

    expect({
      defaultEnvironment,
      developmentEnvironment,
      optedInDevelopmentEnvironment,
      optedOutDevelopmentEnvironment,
      betaEnvironment,
      uatEnvironment,
      forcedMainEnvironment,
      forcedBetaWithDevFlag,
    }).toMatchInlineSnapshot(`
      {
        "betaEnvironment": "uat",
        "defaultEnvironment": "prd",
        "developmentEnvironment": "prd",
        "forcedBetaWithDevFlag": "uat",
        "forcedMainEnvironment": "prd",
        "optedInDevelopmentEnvironment": "dev",
        "optedOutDevelopmentEnvironment": "prd",
        "uatEnvironment": "uat",
      }
    `);
  });
});
