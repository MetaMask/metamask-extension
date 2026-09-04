import { Env } from '@metamask/profile-sync-controller/sdk';
import { ENVIRONMENT } from '../../constants/build';
import { loadAuthenticationConfig } from './config';

const environmentKeys = [
  'FORCE_AUTH_MATCH_BUILD',
  'METAMASK_BUILD_TYPE',
  'METAMASK_ENVIRONMENT',
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

    process.env.FORCE_AUTH_MATCH_BUILD = 'true';
    process.env.METAMASK_BUILD_TYPE = 'beta';
    const forcedDevelopmentEnvironment = loadAuthenticationConfig();

    delete process.env.METAMASK_ENVIRONMENT;
    const betaEnvironment = loadAuthenticationConfig();

    process.env.METAMASK_BUILD_TYPE = 'uat';
    const uatEnvironment = loadAuthenticationConfig();

    process.env.METAMASK_BUILD_TYPE = 'main';
    const productionEnvironment = loadAuthenticationConfig();

    expect({
      defaultEnvironment,
      developmentEnvironment,
      forcedDevelopmentEnvironment,
      betaEnvironment,
      uatEnvironment,
      productionEnvironment,
    }).toMatchInlineSnapshot(`
      {
        "betaEnvironment": "uat",
        "defaultEnvironment": "prd",
        "developmentEnvironment": "dev",
        "forcedDevelopmentEnvironment": "uat",
        "productionEnvironment": "prd",
        "uatEnvironment": "uat",
      }
    `);
  });
});
