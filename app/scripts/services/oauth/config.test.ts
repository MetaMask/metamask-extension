import { ENVIRONMENT } from '../../../../development/build/constants';
import { BuildTypeEnv, loadOAuthConfig, OauthConfigMap } from './config';

describe('loadOAuthConfig', () => {
  const originalEnv = process.env;

  function expectOAuthConfig({
    buildType,
    environment,
    expectedBuildTypeEnv,
  }: {
    buildType: string;
    environment: string;
    expectedBuildTypeEnv: BuildTypeEnv;
  }) {
    process.env.METAMASK_BUILD_TYPE = buildType;
    process.env.METAMASK_ENVIRONMENT = environment;

    expect(loadOAuthConfig()).toStrictEqual(
      OauthConfigMap[expectedBuildTypeEnv],
    );
  }

  beforeEach(() => {
    process.env = {
      ...originalEnv,
    };
  });

  afterEach(() => {
    process.env = {
      ...originalEnv,
    };
  });

  describe('when the build type is main', () => {
    const testCases: {
      environment: string;
      expectedBuildTypeEnv: BuildTypeEnv;
    }[] = [
      {
        environment: ENVIRONMENT.PRODUCTION,
        expectedBuildTypeEnv: BuildTypeEnv.ProdMain,
      },
      {
        environment: ENVIRONMENT.RELEASE_CANDIDATE,
        expectedBuildTypeEnv: BuildTypeEnv.ProdMain,
      },
      {
        environment: ENVIRONMENT.TESTING,
        expectedBuildTypeEnv: BuildTypeEnv.DevMain,
      },
      {
        environment: ENVIRONMENT.STAGING,
        expectedBuildTypeEnv: BuildTypeEnv.UatMain,
      },
    ];

    for (const { environment, expectedBuildTypeEnv } of testCases) {
      it(`returns ${expectedBuildTypeEnv} when environment is ${environment}`, () => {
        expectOAuthConfig({
          buildType: 'main',
          environment,
          expectedBuildTypeEnv,
        });
      });
    }
  });

  describe('when the build type is flask', () => {
    const testCases: {
      environment: string;
      expectedBuildTypeEnv: BuildTypeEnv;
    }[] = [
      {
        environment: ENVIRONMENT.PRODUCTION,
        expectedBuildTypeEnv: BuildTypeEnv.ProdFlask,
      },
      {
        environment: ENVIRONMENT.RELEASE_CANDIDATE,
        expectedBuildTypeEnv: BuildTypeEnv.ProdFlask,
      },
      {
        environment: ENVIRONMENT.TESTING,
        expectedBuildTypeEnv: BuildTypeEnv.DevFlask,
      },
      {
        environment: ENVIRONMENT.STAGING,
        expectedBuildTypeEnv: BuildTypeEnv.UatFlask,
      },
    ];

    for (const { environment, expectedBuildTypeEnv } of testCases) {
      it(`returns ${expectedBuildTypeEnv} when environment is ${environment}`, () => {
        expectOAuthConfig({
          buildType: 'flask',
          environment,
          expectedBuildTypeEnv,
        });
      });
    }
  });

  describe('when the build type is beta', () => {
    const environments = [
      ENVIRONMENT.PRODUCTION,
      ENVIRONMENT.RELEASE_CANDIDATE,
      ENVIRONMENT.TESTING,
      ENVIRONMENT.STAGING,
    ];

    for (const environment of environments) {
      it(`returns Beta when environment is ${environment}`, () => {
        expectOAuthConfig({
          buildType: 'beta',
          environment,
          expectedBuildTypeEnv: BuildTypeEnv.Beta,
        });
      });
    }
  });
});
