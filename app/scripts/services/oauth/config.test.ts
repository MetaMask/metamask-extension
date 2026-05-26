import { Env as ProfileSyncEnv } from '@metamask/profile-sync-controller/sdk';
import { ENVIRONMENT } from '../../../../shared/constants/build';
import {
  BuildTypeEnv,
  getProfilePairingEnv,
  isDevOrTestBuild,
  isProductionBuild,
  isReleaseCandidateBuild,
  loadOAuthConfig,
  OauthConfigMap,
} from './config';

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

  describe('when the build type is experimental', () => {
    it('returns DevMain when environment is testing', () => {
      expectOAuthConfig({
        buildType: 'experimental',
        environment: ENVIRONMENT.TESTING,
        expectedBuildTypeEnv: BuildTypeEnv.DevMain,
      });
    });

    it('returns ProdMain when environment is production', () => {
      expectOAuthConfig({
        buildType: 'experimental',
        environment: ENVIRONMENT.PRODUCTION,
        expectedBuildTypeEnv: BuildTypeEnv.ProdMain,
      });
    });
  });

  describe('when the build type is unrecognized', () => {
    it('falls back to DevMain', () => {
      expectOAuthConfig({
        buildType: 'unknown',
        environment: ENVIRONMENT.STAGING,
        expectedBuildTypeEnv: BuildTypeEnv.DevMain,
      });
    });
  });
});

describe('build environment helpers', () => {
  const originalEnv = process.env;

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

  describe('isDevOrTestBuild', () => {
    it('returns true in development', () => {
      process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;

      expect(isDevOrTestBuild()).toBe(true);
    });

    it('returns true in testing', () => {
      process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING;

      expect(isDevOrTestBuild()).toBe(true);
    });

    it('returns false outside development and testing', () => {
      process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;

      expect(isDevOrTestBuild()).toBe(false);
    });
  });

  describe('isProductionBuild', () => {
    it('returns true in production', () => {
      process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;

      expect(isProductionBuild()).toBe(true);
    });

    it('returns false outside production', () => {
      process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING;

      expect(isProductionBuild()).toBe(false);
    });
  });

  describe('isReleaseCandidateBuild', () => {
    it('returns true in release candidate', () => {
      process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.RELEASE_CANDIDATE;

      expect(isReleaseCandidateBuild()).toBe(true);
    });

    it('returns false outside release candidate', () => {
      process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.STAGING;

      expect(isReleaseCandidateBuild()).toBe(false);
    });
  });

  describe('getProfilePairingEnv', () => {
    it('returns PRD in production', () => {
      process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;

      expect(getProfilePairingEnv()).toBe(ProfileSyncEnv.PRD);
    });

    it('returns PRD in release candidate', () => {
      process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.RELEASE_CANDIDATE;

      expect(getProfilePairingEnv()).toBe(ProfileSyncEnv.PRD);
    });

    it('returns DEV in development', () => {
      process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;

      expect(getProfilePairingEnv()).toBe(ProfileSyncEnv.DEV);
    });

    it('returns DEV in testing', () => {
      process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING;

      expect(getProfilePairingEnv()).toBe(ProfileSyncEnv.DEV);
    });

    it('returns UAT for other environments', () => {
      process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.STAGING;

      expect(getProfilePairingEnv()).toBe(ProfileSyncEnv.UAT);
    });
  });
});
