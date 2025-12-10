import semver from 'semver';
import {
  getBaseSemVerVersion,
  hasMinimumRequiredVersion,
  validatedVersionGatedFeatureFlag,
  VersionGatedFeatureFlag,
} from './version-gating';

jest.mock('semver');
jest.mock('../../../package.json', () => ({
  version: '12.5.0',
}));

describe('version-gating', () => {
  const semverGteMock = semver.gte as jest.MockedFunction<typeof semver.gte>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasMinimumRequiredVersion', () => {
    it('returns false when minRequiredVersion is null', () => {
      expect(hasMinimumRequiredVersion(null)).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });

    it('returns false when minRequiredVersion is undefined', () => {
      expect(hasMinimumRequiredVersion(undefined)).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });

    it('returns false when minRequiredVersion is an empty string', () => {
      expect(hasMinimumRequiredVersion('')).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });

    it('returns true when current version is greater than required version', () => {
      semverGteMock.mockReturnValue(true);

      expect(hasMinimumRequiredVersion('12.0.0')).toBe(true);
      expect(semverGteMock).toHaveBeenCalledTimes(1);
      expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.0.0');
    });

    it('returns true when current version is equal to required version', () => {
      semverGteMock.mockReturnValue(true);

      expect(hasMinimumRequiredVersion('12.5.0')).toBe(true);
      expect(semverGteMock).toHaveBeenCalledTimes(1);
      expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.5.0');
    });

    it('returns false when current version is less than required version', () => {
      semverGteMock.mockReturnValue(false);

      expect(hasMinimumRequiredVersion('13.0.0')).toBe(false);
      expect(semverGteMock).toHaveBeenCalledTimes(1);
      expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '13.0.0');
    });

    it('returns false when semver.gte throws an error', () => {
      semverGteMock.mockImplementation(() => {
        throw new Error('Invalid version format');
      });

      expect(hasMinimumRequiredVersion('invalid-version')).toBe(false);
      expect(semverGteMock).toHaveBeenCalledTimes(1);
      expect(semverGteMock).toHaveBeenCalledWith('12.5.0', 'invalid-version');
    });

    it('returns false when semver.gte throws a non-Error exception', () => {
      semverGteMock.mockImplementation(() => {
        // eslint-disable-next-line no-throw-literal
        throw 'Some string error';
      });

      expect(hasMinimumRequiredVersion('12.0.0')).toBe(false);
      expect(semverGteMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('validatedVersionGatedFeatureFlag', () => {
    describe('validation failures', () => {
      it('returns undefined when remoteFlag is undefined', () => {
        expect(validatedVersionGatedFeatureFlag(undefined)).toBeUndefined();
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns undefined when remoteFlag is null', () => {
        expect(validatedVersionGatedFeatureFlag(null)).toBeUndefined();
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns undefined when remoteFlag.enabled is not a boolean', () => {
        const invalidFlag = {
          enabled: 'true' as unknown as boolean,
          minimumVersion: '12.0.0',
        };

        expect(validatedVersionGatedFeatureFlag(invalidFlag)).toBeUndefined();
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns undefined when remoteFlag.enabled is missing', () => {
        const invalidFlag = {
          minimumVersion: '12.0.0',
        } as unknown as VersionGatedFeatureFlag;

        expect(validatedVersionGatedFeatureFlag(invalidFlag)).toBeUndefined();
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns undefined when remoteFlag.minimumVersion is not null or string', () => {
        const invalidFlag = {
          enabled: true,
          minimumVersion: 12 as unknown as string,
        };

        expect(validatedVersionGatedFeatureFlag(invalidFlag)).toBeUndefined();
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns undefined when remoteFlag.minimumVersion is an object', () => {
        const invalidFlag = {
          enabled: true,
          minimumVersion: {} as unknown as string,
        };

        expect(validatedVersionGatedFeatureFlag(invalidFlag)).toBeUndefined();
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns undefined when remoteFlag.minimumVersion is an array', () => {
        const invalidFlag = {
          enabled: true,
          minimumVersion: [] as unknown as string,
        };

        expect(validatedVersionGatedFeatureFlag(invalidFlag)).toBeUndefined();
        expect(semverGteMock).not.toHaveBeenCalled();
      });
    });

    describe('enabled is false', () => {
      it('returns false when enabled is false and version check would pass', () => {
        semverGteMock.mockReturnValue(true);

        const flag: VersionGatedFeatureFlag = {
          enabled: false,
          minimumVersion: '12.0.0',
        };

        expect(validatedVersionGatedFeatureFlag(flag)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when enabled is false and version check would fail', () => {
        semverGteMock.mockReturnValue(false);

        const flag: VersionGatedFeatureFlag = {
          enabled: false,
          minimumVersion: '13.0.0',
        };

        expect(validatedVersionGatedFeatureFlag(flag)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when enabled is false and minimumVersion is null', () => {
        const flag: VersionGatedFeatureFlag = {
          enabled: false,
          minimumVersion: null,
        };

        expect(validatedVersionGatedFeatureFlag(flag)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });
    });

    describe('enabled is true', () => {
      it('returns true when enabled is true and version check passes', () => {
        semverGteMock.mockReturnValue(true);

        const flag: VersionGatedFeatureFlag = {
          enabled: true,
          minimumVersion: '12.0.0',
        };

        expect(validatedVersionGatedFeatureFlag(flag)).toBe(true);
        expect(semverGteMock).toHaveBeenCalledTimes(1);
        expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.0.0');
      });

      it('returns false when enabled is true and version check fails', () => {
        semverGteMock.mockReturnValue(false);

        const flag: VersionGatedFeatureFlag = {
          enabled: true,
          minimumVersion: '13.0.0',
        };

        expect(validatedVersionGatedFeatureFlag(flag)).toBe(false);
        expect(semverGteMock).toHaveBeenCalledTimes(1);
        expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '13.0.0');
      });

      it('returns false when enabled is true and minimumVersion is null', () => {
        const flag: VersionGatedFeatureFlag = {
          enabled: true,
          minimumVersion: null,
        };

        expect(validatedVersionGatedFeatureFlag(flag)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when enabled is true and minimumVersion is an empty string', () => {
        const flag: VersionGatedFeatureFlag = {
          enabled: true,
          minimumVersion: '',
        };

        expect(validatedVersionGatedFeatureFlag(flag)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when enabled is true and semver comparison throws an error', () => {
        semverGteMock.mockImplementation(() => {
          throw new Error('Invalid version');
        });

        const flag: VersionGatedFeatureFlag = {
          enabled: true,
          minimumVersion: 'invalid-version',
        };

        expect(validatedVersionGatedFeatureFlag(flag)).toBe(false);
        expect(semverGteMock).toHaveBeenCalledTimes(1);
        expect(semverGteMock).toHaveBeenCalledWith('12.5.0', 'invalid-version');
      });
    });

    describe('edge cases', () => {
      it('handles prerelease versions correctly when version check passes', () => {
        semverGteMock.mockReturnValue(true);

        const flag: VersionGatedFeatureFlag = {
          enabled: true,
          minimumVersion: '12.5.0-beta.1',
        };

        expect(validatedVersionGatedFeatureFlag(flag)).toBe(true);
        expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.5.0-beta.1');
      });

      it('handles exact version match', () => {
        semverGteMock.mockReturnValue(true);

        const flag: VersionGatedFeatureFlag = {
          enabled: true,
          minimumVersion: '12.5.0',
        };

        expect(validatedVersionGatedFeatureFlag(flag)).toBe(true);
        expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.5.0');
      });
    });
  });

  describe('getBaseSemVerVersion', () => {
    const semverParseMock = semver.parse as jest.MockedFunction<
      typeof semver.parse
    >;

    it('returns base version from package.json version', () => {
      semverParseMock.mockReturnValue({
        major: 12,
        minor: 5,
        patch: 0,
      } as semver.SemVer);

      expect(getBaseSemVerVersion()).toBe('12.5.0');
      expect(semverParseMock).toHaveBeenCalledWith('12.5.0');
    });

    it('strips prerelease tag when parsing version', () => {
      semverParseMock.mockReturnValue({
        major: 13,
        minor: 13,
        patch: 0,
        prerelease: ['experimental', 0],
      } as unknown as semver.SemVer);

      expect(getBaseSemVerVersion()).toBe('13.13.0');
    });

    it('strips build metadata when parsing version', () => {
      semverParseMock.mockReturnValue({
        major: 1,
        minor: 0,
        patch: 0,
        build: ['build', '123'],
      } as unknown as semver.SemVer);

      expect(getBaseSemVerVersion()).toBe('1.0.0');
    });

    it('returns unknown when semver.parse returns null', () => {
      semverParseMock.mockReturnValue(null);

      expect(getBaseSemVerVersion()).toBe('unknown');
    });
  });
});
