import semver from 'semver';
import { isPerpsFeatureEnabled, PerpsFeatureFlag } from './perps-feature-flags';

jest.mock('semver');
jest.mock('../../package.json', () => ({
  version: '12.5.0',
}));

describe('perps-feature-flags', () => {
  const semverGteMock = semver.gte as jest.MockedFunction<typeof semver.gte>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isPerpsFeatureEnabled', () => {
    describe('falsy input', () => {
      it('returns false when flagValue is null', () => {
        expect(isPerpsFeatureEnabled(null)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when flagValue is undefined', () => {
        expect(isPerpsFeatureEnabled(undefined)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when flagValue is an empty string', () => {
        expect(isPerpsFeatureEnabled('')).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when flagValue is 0', () => {
        expect(isPerpsFeatureEnabled(0)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });
    });

    describe('boolean flags (backward compatibility)', () => {
      it('returns true when flagValue is true', () => {
        expect(isPerpsFeatureEnabled(true)).toBe(true);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when flagValue is false', () => {
        expect(isPerpsFeatureEnabled(false)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });
    });

    describe('object flags with version gating', () => {
      describe('enabled is false', () => {
        it('returns false when enabled is false regardless of version', () => {
          const flag: PerpsFeatureFlag = {
            enabled: false,
            minimumVersion: '12.0.0',
          };

          expect(isPerpsFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).not.toHaveBeenCalled();
        });

        it('returns false when enabled is false even if minimumVersion is empty', () => {
          const flag = {
            enabled: false,
            minimumVersion: '',
          };

          expect(isPerpsFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).not.toHaveBeenCalled();
        });
      });

      describe('enabled is true', () => {
        it('returns true when enabled is true and version check passes', () => {
          semverGteMock.mockReturnValue(true);

          const flag: PerpsFeatureFlag = {
            enabled: true,
            minimumVersion: '12.0.0',
          };

          expect(isPerpsFeatureEnabled(flag)).toBe(true);
          expect(semverGteMock).toHaveBeenCalledTimes(1);
          expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.0.0');
        });

        it('returns false when enabled is true and version check fails', () => {
          semverGteMock.mockReturnValue(false);

          const flag: PerpsFeatureFlag = {
            enabled: true,
            minimumVersion: '13.0.0',
          };

          expect(isPerpsFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).toHaveBeenCalledTimes(1);
          expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '13.0.0');
        });

        it('returns false when enabled is true but minimumVersion is empty', () => {
          const flag = {
            enabled: true,
            minimumVersion: '',
          };

          expect(isPerpsFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).not.toHaveBeenCalled();
        });

        it('returns false when enabled is true but minimumVersion is missing', () => {
          const flag = {
            enabled: true,
          };

          expect(isPerpsFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).not.toHaveBeenCalled();
        });
      });

      describe('missing or invalid properties', () => {
        it('returns false when enabled is missing', () => {
          const flag = {
            minimumVersion: '12.0.0',
          };

          expect(isPerpsFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).not.toHaveBeenCalled();
        });

        it('returns false when minimumVersion is missing', () => {
          const flag = {
            enabled: true,
          };

          expect(isPerpsFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).not.toHaveBeenCalled();
        });

        it('returns false for an empty object', () => {
          expect(isPerpsFeatureEnabled({})).toBe(false);
          expect(semverGteMock).not.toHaveBeenCalled();
        });
      });

      describe('error handling', () => {
        it('returns false when semver comparison throws an error', () => {
          semverGteMock.mockImplementation(() => {
            throw new Error('Invalid version');
          });

          const flag: PerpsFeatureFlag = {
            enabled: true,
            minimumVersion: 'invalid-version',
          };

          expect(isPerpsFeatureEnabled(flag)).toBe(false);
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

          const flag: PerpsFeatureFlag = {
            enabled: true,
            minimumVersion: '12.0.0',
          };

          expect(isPerpsFeatureEnabled(flag)).toBe(false);
          expect(semverGteMock).toHaveBeenCalledTimes(1);
        });
      });

      describe('edge cases', () => {
        it('handles exact version match', () => {
          semverGteMock.mockReturnValue(true);

          const flag: PerpsFeatureFlag = {
            enabled: true,
            minimumVersion: '12.5.0',
          };

          expect(isPerpsFeatureEnabled(flag)).toBe(true);
          expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.5.0');
        });

        it('handles prerelease versions', () => {
          semverGteMock.mockReturnValue(true);

          const flag: PerpsFeatureFlag = {
            enabled: true,
            minimumVersion: '12.5.0-beta.1',
          };

          expect(isPerpsFeatureEnabled(flag)).toBe(true);
          expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.5.0-beta.1');
        });
      });
    });

    describe('unsupported types', () => {
      it('returns false for a number', () => {
        expect(isPerpsFeatureEnabled(42)).toBe(false);
      });

      it('returns false for a string', () => {
        expect(isPerpsFeatureEnabled('true')).toBe(false);
      });

      it('returns false for an array', () => {
        expect(isPerpsFeatureEnabled([true])).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false for a function', () => {
        expect(isPerpsFeatureEnabled(() => true)).toBe(false);
      });
    });
  });
});

