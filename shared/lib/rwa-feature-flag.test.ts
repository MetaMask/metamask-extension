import semver from 'semver';
import { isRWAFeatureEnabled, RWAFeatureFlag } from './rwa-feature-flag';

jest.mock('semver');
jest.mock('../../package.json', () => ({
  version: '12.5.0',
}));

describe('rwa-feature-flag', () => {
  const semverGteMock = semver.gte as jest.MockedFunction<typeof semver.gte>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isRWAFeatureEnabled', () => {
    describe('falsy input', () => {
      it('returns false when flagValue is null', () => {
        expect(isRWAFeatureEnabled(null)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when flagValue is undefined', () => {
        expect(isRWAFeatureEnabled(undefined)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when flagValue is an empty string', () => {
        expect(isRWAFeatureEnabled('')).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when flagValue is 0', () => {
        expect(isRWAFeatureEnabled(0)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });
    });

    describe('boolean flags (backward compatibility)', () => {
      it('returns true when flagValue is true', () => {
        expect(isRWAFeatureEnabled(true)).toBe(true);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when flagValue is false', () => {
        expect(isRWAFeatureEnabled(false)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });
    });

    describe('object flags with version gating', () => {
      describe('enabled is false', () => {
        it('returns false when enabled is false regardless of version', () => {
          const flag: RWAFeatureFlag = {
            enabled: false,
            minimumVersion: '12.0.0',
          };

          expect(isRWAFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).not.toHaveBeenCalled();
        });

        it('returns false when enabled is false even if minimumVersion is empty', () => {
          const flag = {
            enabled: false,
            minimumVersion: '',
          };

          expect(isRWAFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).not.toHaveBeenCalled();
        });
      });

      describe('enabled is true', () => {
        it('returns true when enabled is true and version check passes', () => {
          semverGteMock.mockReturnValue(true);

          const flag: RWAFeatureFlag = {
            enabled: true,
            minimumVersion: '12.0.0',
          };

          expect(isRWAFeatureEnabled(flag)).toBe(true);
          expect(semverGteMock).toHaveBeenCalledTimes(1);
          expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.0.0');
        });

        it('returns false when enabled is true and version check fails', () => {
          semverGteMock.mockReturnValue(false);

          const flag: RWAFeatureFlag = {
            enabled: true,
            minimumVersion: '13.0.0',
          };

          expect(isRWAFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).toHaveBeenCalledTimes(1);
          expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '13.0.0');
        });

        it('returns false when enabled is true but minimumVersion is empty', () => {
          const flag = {
            enabled: true,
            minimumVersion: '',
          };

          expect(isRWAFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).not.toHaveBeenCalled();
        });

        it('returns false when enabled is true but minimumVersion is missing', () => {
          const flag = {
            enabled: true,
          };

          expect(isRWAFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).not.toHaveBeenCalled();
        });
      });

      describe('missing or invalid properties', () => {
        it('returns false when enabled is missing', () => {
          const flag = {
            minimumVersion: '12.0.0',
          };

          expect(isRWAFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).not.toHaveBeenCalled();
        });

        it('returns false when minimumVersion is missing', () => {
          const flag = {
            enabled: true,
          };

          expect(isRWAFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).not.toHaveBeenCalled();
        });

        it('returns false for an empty object', () => {
          expect(isRWAFeatureEnabled({})).toBe(false);
          expect(semverGteMock).not.toHaveBeenCalled();
        });
      });

      describe('error handling', () => {
        it('returns false when semver comparison throws an error', () => {
          semverGteMock.mockImplementation(() => {
            throw new Error('Invalid version');
          });

          const flag: RWAFeatureFlag = {
            enabled: true,
            minimumVersion: 'invalid-version',
          };

          expect(isRWAFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).toHaveBeenCalledTimes(1);
          expect(semverGteMock).toHaveBeenCalledWith(
            '12.5.0',
            'invalid-version',
          );
        });

        it('returns false when semver throws a non-Error exception', () => {
          semverGteMock.mockImplementation(() => {
            // eslint-disable-next-line no-throw-literal
            throw 'Some string error';
          });

          const flag: RWAFeatureFlag = {
            enabled: true,
            minimumVersion: '12.0.0',
          };

          expect(isRWAFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).toHaveBeenCalledTimes(1);
        });
      });

      describe('edge cases', () => {
        it('handles exact version match', () => {
          semverGteMock.mockReturnValue(true);

          const flag: RWAFeatureFlag = {
            enabled: true,
            minimumVersion: '12.5.0',
          };

          expect(isRWAFeatureEnabled(flag)).toBe(true);
          expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.5.0');
        });

        it('handles prerelease versions', () => {
          semverGteMock.mockReturnValue(true);

          const flag: RWAFeatureFlag = {
            enabled: true,
            minimumVersion: '12.5.0-beta.1',
          };

          expect(isRWAFeatureEnabled(flag)).toBe(true);
          expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.5.0-beta.1');
        });
      });
    });

    describe('unsupported types', () => {
      it('returns false for a number', () => {
        expect(isRWAFeatureEnabled(42)).toBe(false);
      });

      it('returns false for a string', () => {
        expect(isRWAFeatureEnabled('true')).toBe(false);
      });

      it('returns false for an array', () => {
        expect(isRWAFeatureEnabled([true])).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false for a function', () => {
        expect(isRWAFeatureEnabled(() => true)).toBe(false);
      });
    });
  });
});
