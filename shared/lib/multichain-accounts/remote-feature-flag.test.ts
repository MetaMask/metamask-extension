import {
  isMultichainAccountsFeatureEnabled,
  MultichainAccountsFeatureFlag,
} from './remote-feature-flag';

describe('remoteFeatureFlag', () => {
  it('should return true when the feature flag is enabled', () => {
    const featureFlag = {
      enabled: true,
      featureVersion: '2',
      minimumVersion: '1.0.0',
    };

    expect(isMultichainAccountsFeatureEnabled(featureFlag, '2')).toBe(true);
  });

  it('should return false when the feature flag is disabled', () => {
    const featureFlag = {
      enabled: false,
      featureVersion: '2',
      minimumVersion: '1.0.0',
    };

    expect(isMultichainAccountsFeatureEnabled(featureFlag, '2')).toBe(false);
  });

  it('should return false when the feature flag is enabled but the feature version is not the same', () => {
    const featureFlag = {
      enabled: true,
      featureVersion: '1',
      minimumVersion: '1.0.0',
    };

    expect(isMultichainAccountsFeatureEnabled(featureFlag, '2')).toBe(false);
  });

  it('should return false when the feature flag is undefined', () => {
    const featureFlag = undefined;

    expect(isMultichainAccountsFeatureEnabled(featureFlag, '2')).toBe(false);
  });

  it('should return false when the feature flag is null', () => {
    const featureFlag = null;

    expect(isMultichainAccountsFeatureEnabled(featureFlag, '2')).toBe(false);
  });

  it('should return false when the feature flag is empty', () => {
    const featureFlag = {};

    expect(
      isMultichainAccountsFeatureEnabled(
        featureFlag as MultichainAccountsFeatureFlag,
        '2',
      ),
    ).toBe(false);
  });

  it('should return false when the feature flag is missing the minimum version', () => {
    const featureFlag = {
      enabled: true,
      featureVersion: '2',
      minimumVersion: null,
    };

    expect(isMultichainAccountsFeatureEnabled(featureFlag, '2')).toBe(false);
  });

  it('should return false when the feature flag is missing the feature version', () => {
    const featureFlag = {
      enabled: true,
      featureVersion: null,
      minimumVersion: '1.0.0',
    };

    expect(isMultichainAccountsFeatureEnabled(featureFlag, '2')).toBe(false);
  });
});
