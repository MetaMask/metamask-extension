import {
  isVersionGatedFeatureFlag,
  isProgressiveRolloutWrapper,
  hasMinimumRequiredVersion,
  unwrapVersionGatedFeatureFlag,
  validatedVersionGatedFeatureFlag,
  getBooleanFeatureFlag,
} from './remote-feature-flag-utils';

// Mock semver to control version comparison
jest.mock('semver', () => ({
  gte: jest.fn(),
}));

// Mock package.json version
jest.mock('../../package.json', () => ({
  version: '12.5.0',
}));

const mockSemverGte = jest.requireMock('semver').gte as jest.Mock;

describe('remote-feature-flag-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isVersionGatedFeatureFlag', () => {
    it('returns true for valid VersionGatedFeatureFlag structure', () => {
      expect(
        isVersionGatedFeatureFlag({ enabled: true, minimumVersion: '12.0.0' }),
      ).toBe(true);
      expect(
        isVersionGatedFeatureFlag({ enabled: false, minimumVersion: '12.5.0' }),
      ).toBe(true);
    });

    it('returns false for null or undefined', () => {
      expect(isVersionGatedFeatureFlag(null)).toBe(false);
      expect(isVersionGatedFeatureFlag(undefined)).toBe(false);
    });

    it('returns false for primitive types', () => {
      expect(isVersionGatedFeatureFlag(true)).toBe(false);
      expect(isVersionGatedFeatureFlag(false)).toBe(false);
      expect(isVersionGatedFeatureFlag('string')).toBe(false);
      expect(isVersionGatedFeatureFlag(123)).toBe(false);
    });

    it('returns false for objects missing required properties', () => {
      expect(isVersionGatedFeatureFlag({ enabled: true })).toBe(false);
      expect(isVersionGatedFeatureFlag({ minimumVersion: '12.0.0' })).toBe(
        false,
      );
      expect(isVersionGatedFeatureFlag({})).toBe(false);
    });

    it('returns false for objects with wrong property types', () => {
      expect(
        isVersionGatedFeatureFlag({
          enabled: 'true',
          minimumVersion: '12.0.0',
        }),
      ).toBe(false);
      expect(
        isVersionGatedFeatureFlag({ enabled: true, minimumVersion: 12 }),
      ).toBe(false);
    });

    it('allows additional properties', () => {
      expect(
        isVersionGatedFeatureFlag({
          enabled: true,
          minimumVersion: '12.0.0',
          extraProp: 'value',
        }),
      ).toBe(true);
    });
  });

  describe('isProgressiveRolloutWrapper', () => {
    it('returns true for objects with value property containing an object', () => {
      expect(
        isProgressiveRolloutWrapper({
          value: { enabled: true, minimumVersion: '12.0.0' },
        }),
      ).toBe(true);
      expect(
        isProgressiveRolloutWrapper({
          name: 'rollout-50',
          value: { enabled: true, minimumVersion: '12.0.0' },
        }),
      ).toBe(true);
    });

    it('returns false for null or undefined', () => {
      expect(isProgressiveRolloutWrapper(null)).toBe(false);
      expect(isProgressiveRolloutWrapper(undefined)).toBe(false);
    });

    it('returns false for objects without value property', () => {
      expect(isProgressiveRolloutWrapper({})).toBe(false);
      expect(isProgressiveRolloutWrapper({ name: 'test' })).toBe(false);
    });

    it('returns false when value is not an object', () => {
      expect(isProgressiveRolloutWrapper({ value: true })).toBe(false);
      expect(isProgressiveRolloutWrapper({ value: 'string' })).toBe(false);
      expect(isProgressiveRolloutWrapper({ value: 123 })).toBe(false);
    });

    it('returns false when value is null', () => {
      expect(isProgressiveRolloutWrapper({ value: null })).toBe(false);
    });
  });

  describe('hasMinimumRequiredVersion', () => {
    it('returns true when current version >= minimum version', () => {
      mockSemverGte.mockReturnValue(true);
      expect(hasMinimumRequiredVersion('12.0.0')).toBe(true);
      expect(mockSemverGte).toHaveBeenCalledWith('12.5.0', '12.0.0');
    });

    it('returns false when current version < minimum version', () => {
      mockSemverGte.mockReturnValue(false);
      expect(hasMinimumRequiredVersion('13.0.0')).toBe(false);
      expect(mockSemverGte).toHaveBeenCalledWith('12.5.0', '13.0.0');
    });

    it('returns false for empty minimum version', () => {
      expect(hasMinimumRequiredVersion('')).toBe(false);
      expect(mockSemverGte).not.toHaveBeenCalled();
    });

    it('returns false when semver throws an error', () => {
      mockSemverGte.mockImplementation(() => {
        throw new Error('Invalid version');
      });
      expect(hasMinimumRequiredVersion('invalid')).toBe(false);
    });
  });

  describe('unwrapVersionGatedFeatureFlag', () => {
    it('returns direct VersionGatedFeatureFlag as-is', () => {
      const flag = { enabled: true, minimumVersion: '12.0.0' };
      expect(unwrapVersionGatedFeatureFlag(flag)).toStrictEqual(flag);
    });

    it('unwraps progressive rollout wrapper with name', () => {
      const wrapped = {
        name: 'rollout-50',
        value: { enabled: true, minimumVersion: '12.0.0' },
      };
      expect(unwrapVersionGatedFeatureFlag(wrapped)).toStrictEqual({
        enabled: true,
        minimumVersion: '12.0.0',
      });
    });

    it('unwraps progressive rollout wrapper without name', () => {
      const wrapped = {
        value: { enabled: false, minimumVersion: '13.0.0' },
      };
      expect(unwrapVersionGatedFeatureFlag(wrapped)).toStrictEqual({
        enabled: false,
        minimumVersion: '13.0.0',
      });
    });

    it('returns undefined for invalid structures', () => {
      expect(unwrapVersionGatedFeatureFlag(null)).toBeUndefined();
      expect(unwrapVersionGatedFeatureFlag(undefined)).toBeUndefined();
      expect(unwrapVersionGatedFeatureFlag(true)).toBeUndefined();
      expect(unwrapVersionGatedFeatureFlag('string')).toBeUndefined();
      expect(unwrapVersionGatedFeatureFlag({})).toBeUndefined();
    });

    it('returns undefined for wrapper with invalid inner value', () => {
      expect(
        unwrapVersionGatedFeatureFlag({
          value: { enabled: true }, // missing minimumVersion
        }),
      ).toBeUndefined();
      expect(
        unwrapVersionGatedFeatureFlag({
          value: 'not-an-object',
        }),
      ).toBeUndefined();
    });
  });

  describe('validatedVersionGatedFeatureFlag', () => {
    it('returns true for enabled flag with met version requirement', () => {
      mockSemverGte.mockReturnValue(true);
      const flag = { enabled: true, minimumVersion: '12.0.0' };
      expect(validatedVersionGatedFeatureFlag(flag)).toBe(true);
    });

    it('returns false for enabled flag with unmet version requirement', () => {
      mockSemverGte.mockReturnValue(false);
      const flag = { enabled: true, minimumVersion: '13.0.0' };
      expect(validatedVersionGatedFeatureFlag(flag)).toBe(false);
    });

    it('returns false for disabled flag regardless of version', () => {
      mockSemverGte.mockReturnValue(true);
      const flag = { enabled: false, minimumVersion: '10.0.0' };
      expect(validatedVersionGatedFeatureFlag(flag)).toBe(false);
    });

    it('handles progressive rollout wrapper correctly', () => {
      mockSemverGte.mockReturnValue(true);
      const wrapped = {
        name: 'rollout-100',
        value: { enabled: true, minimumVersion: '12.0.0' },
      };
      expect(validatedVersionGatedFeatureFlag(wrapped)).toBe(true);
    });

    it('returns undefined for invalid flag structures', () => {
      expect(validatedVersionGatedFeatureFlag(null)).toBeUndefined();
      expect(validatedVersionGatedFeatureFlag(undefined)).toBeUndefined();
      expect(validatedVersionGatedFeatureFlag(true)).toBeUndefined();
      expect(validatedVersionGatedFeatureFlag({})).toBeUndefined();
    });
  });

  describe('getBooleanFeatureFlag', () => {
    it('returns boolean value for simple boolean flags', () => {
      expect(getBooleanFeatureFlag(true, false)).toBe(true);
      expect(getBooleanFeatureFlag(false, true)).toBe(false);
    });

    it('returns validated result for version-gated flags', () => {
      mockSemverGte.mockReturnValue(true);
      const flag = { enabled: true, minimumVersion: '12.0.0' };
      expect(getBooleanFeatureFlag(flag, false)).toBe(true);
    });

    it('returns default for invalid flags', () => {
      expect(getBooleanFeatureFlag(null, true)).toBe(true);
      expect(getBooleanFeatureFlag(undefined, false)).toBe(false);
      expect(getBooleanFeatureFlag({}, true)).toBe(true);
    });

    it('returns default when version requirement not met', () => {
      mockSemverGte.mockReturnValue(false);
      const flag = { enabled: true, minimumVersion: '99.0.0' };
      expect(getBooleanFeatureFlag(flag, true)).toBe(false);
    });

    it('handles progressive rollout wrapper', () => {
      mockSemverGte.mockReturnValue(true);
      const wrapped = {
        value: { enabled: true, minimumVersion: '12.0.0' },
      };
      expect(getBooleanFeatureFlag(wrapped, false)).toBe(true);
    });

    it('returns false for disabled flag regardless of default', () => {
      mockSemverGte.mockReturnValue(true);
      const flag = { enabled: false, minimumVersion: '1.0.0' };
      expect(getBooleanFeatureFlag(flag, true)).toBe(false);
    });
  });
});
