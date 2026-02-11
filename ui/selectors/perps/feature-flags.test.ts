import { getHip3AllowedSources, getHip3AllowedSourcesSet } from './feature-flags';

// Mock the dependencies
jest.mock('../../../shared/lib/perps-feature-flags', () => ({
  isPerpsFeatureEnabled: jest.fn().mockReturnValue(true),
}));

jest.mock('../remote-feature-flags', () => ({
  getRemoteFeatureFlags: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getRemoteFeatureFlags } = require('../remote-feature-flags');

describe('perps feature-flags selectors', () => {
  beforeEach(() => {
    // Reset memoization between tests
    getHip3AllowedSources.resetRecomputations();
    getHip3AllowedSourcesSet.resetRecomputations();
  });

  describe('getHip3AllowedSources', () => {
    it('returns empty array when flag is not configured', () => {
      const state = {};
      getRemoteFeatureFlags.mockReturnValue({});

      const result = getHip3AllowedSources(state);

      expect(result).toEqual([]);
    });

    it('parses single wildcard pattern from string', () => {
      const state = {};
      getRemoteFeatureFlags.mockReturnValue({
        perpsHip3AllowlistMarkets: 'xyz:*',
      });

      const result = getHip3AllowedSources(state);

      expect(result).toEqual(['xyz']);
    });

    it('parses comma-separated wildcard patterns', () => {
      const state = {};
      getRemoteFeatureFlags.mockReturnValue({
        perpsHip3AllowlistMarkets: 'xyz:*,abc:*',
      });

      const result = getHip3AllowedSources(state);

      expect(result).toEqual(['xyz', 'abc']);
    });

    it('parses plain source identifiers', () => {
      const state = {};
      getRemoteFeatureFlags.mockReturnValue({
        perpsHip3AllowlistMarkets: 'xyz,abc',
      });

      const result = getHip3AllowedSources(state);

      expect(result).toEqual(['xyz', 'abc']);
    });

    it('parses array of patterns', () => {
      const state = {};
      getRemoteFeatureFlags.mockReturnValue({
        perpsHip3AllowlistMarkets: ['xyz:*', 'abc:*'],
      });

      const result = getHip3AllowedSources(state);

      expect(result).toEqual(['xyz', 'abc']);
    });

    it('returns empty array for empty string', () => {
      const state = {};
      getRemoteFeatureFlags.mockReturnValue({
        perpsHip3AllowlistMarkets: '  ',
      });

      const result = getHip3AllowedSources(state);

      expect(result).toEqual([]);
    });

    it('returns empty array for non-string non-array value', () => {
      const state = {};
      getRemoteFeatureFlags.mockReturnValue({
        perpsHip3AllowlistMarkets: 42,
      });

      const result = getHip3AllowedSources(state);

      expect(result).toEqual([]);
    });

    it('filters out empty entries from comma-separated string', () => {
      const state = {};
      getRemoteFeatureFlags.mockReturnValue({
        perpsHip3AllowlistMarkets: 'xyz:*,,abc:*',
      });

      const result = getHip3AllowedSources(state);

      expect(result).toEqual(['xyz', 'abc']);
    });
  });

  describe('getHip3AllowedSourcesSet', () => {
    it('returns a Set from the allowed sources array', () => {
      const state = {};
      getRemoteFeatureFlags.mockReturnValue({
        perpsHip3AllowlistMarkets: 'xyz:*,abc:*',
      });

      const result = getHip3AllowedSourcesSet(state);

      expect(result).toBeInstanceOf(Set);
      expect(result.has('xyz')).toBe(true);
      expect(result.has('abc')).toBe(true);
      expect(result.size).toBe(2);
    });

    it('returns empty Set when no sources configured', () => {
      const state = {};
      getRemoteFeatureFlags.mockReturnValue({});

      const result = getHip3AllowedSourcesSet(state);

      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });
  });
});
