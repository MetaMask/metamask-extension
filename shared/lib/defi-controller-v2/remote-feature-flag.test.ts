import {
  isDefiControllerV2Enabled,
  type DefiControllerV2FeatureFlag,
} from './remote-feature-flag';

describe('isDefiControllerV2Enabled', () => {
  it('returns false when featureFlag is undefined', () => {
    expect(isDefiControllerV2Enabled(undefined)).toBe(false);
  });

  it('returns false when featureFlag is null', () => {
    expect(isDefiControllerV2Enabled(null)).toBe(false);
  });

  it('returns false when enabled is false', () => {
    const featureFlag: DefiControllerV2FeatureFlag = { enabled: false };
    expect(isDefiControllerV2Enabled(featureFlag)).toBe(false);
  });

  it('returns false when enabled is absent', () => {
    const featureFlag: DefiControllerV2FeatureFlag = {};
    expect(isDefiControllerV2Enabled(featureFlag)).toBe(false);
  });

  it('returns true when enabled is true', () => {
    const featureFlag: DefiControllerV2FeatureFlag = { enabled: true };
    expect(isDefiControllerV2Enabled(featureFlag)).toBe(true);
  });
});
