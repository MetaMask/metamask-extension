import {
  isAssetsUnifyStateFeatureEnabled,
  ASSETS_UNIFY_STATE_VERSION_1,
} from './remote-feature-flag';

// The global jest setup mocks this module to always return false; unmock it
// here so we can test the real implementation.
jest.unmock('./remote-feature-flag');

describe('isAssetsUnifyStateFeatureEnabled', () => {
  const originalInTest = process.env.IN_TEST;

  afterEach(() => {
    if (originalInTest === undefined) {
      delete process.env.IN_TEST;
    } else {
      process.env.IN_TEST = originalInTest;
    }
  });

  describe('in test environment (IN_TEST=true)', () => {
    it('returns true regardless of the feature flag value', () => {
      process.env.IN_TEST = 'true';
      expect(
        isAssetsUnifyStateFeatureEnabled(
          undefined,
          ASSETS_UNIFY_STATE_VERSION_1,
        ),
      ).toBe(true);
    });
  });

  describe('outside test environment (IN_TEST unset)', () => {
    beforeEach(() => {
      delete process.env.IN_TEST;
    });

    it('returns false when featureFlag is undefined', () => {
      expect(
        isAssetsUnifyStateFeatureEnabled(
          undefined,
          ASSETS_UNIFY_STATE_VERSION_1,
        ),
      ).toBe(false);
    });

    it('returns false when featureFlag is null', () => {
      expect(
        isAssetsUnifyStateFeatureEnabled(null, ASSETS_UNIFY_STATE_VERSION_1),
      ).toBe(false);
    });

    it('returns false when enabled is false', () => {
      expect(
        isAssetsUnifyStateFeatureEnabled(
          { enabled: false, featureVersion: ASSETS_UNIFY_STATE_VERSION_1 },
          ASSETS_UNIFY_STATE_VERSION_1,
        ),
      ).toBe(false);
    });

    it('returns false when enabled but featureVersion does not match', () => {
      expect(
        isAssetsUnifyStateFeatureEnabled(
          { enabled: true, featureVersion: '2' },
          ASSETS_UNIFY_STATE_VERSION_1,
        ),
      ).toBe(false);
    });

    it('returns false when enabled but featureVersion is null', () => {
      expect(
        isAssetsUnifyStateFeatureEnabled(
          { enabled: true, featureVersion: null },
          ASSETS_UNIFY_STATE_VERSION_1,
        ),
      ).toBe(false);
    });

    it('returns true when enabled and featureVersion matches', () => {
      expect(
        isAssetsUnifyStateFeatureEnabled(
          { enabled: true, featureVersion: ASSETS_UNIFY_STATE_VERSION_1 },
          ASSETS_UNIFY_STATE_VERSION_1,
        ),
      ).toBe(true);
    });
  });
});
