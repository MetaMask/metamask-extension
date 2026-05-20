import semver from 'semver';
import { isBatchSellEnabled } from './batch-sell-feature-flags';

jest.mock('semver');
jest.mock('../../package.json', () => ({ version: '14.11.0' }));

describe('isBatchSellEnabled', () => {
  const semverGteMock = semver.gte as jest.MockedFunction<typeof semver.gte>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('invalid / missing flag values', () => {
    it('returns false when flagValue is undefined', () => {
      expect(isBatchSellEnabled(undefined)).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });

    it('returns false when flagValue is null', () => {
      expect(isBatchSellEnabled(null)).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });

    it('returns false when flagValue is a plain string', () => {
      expect(isBatchSellEnabled('14.11.0')).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });

    it('returns false when flagValue is a boolean', () => {
      expect(isBatchSellEnabled(true)).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });

    it('returns false when flagValue is an empty object', () => {
      expect(isBatchSellEnabled({})).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });

    it('returns false when minimumVersion is missing', () => {
      expect(isBatchSellEnabled({ otherProp: '14.0.0' })).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });

    it('returns false when minimumVersion is not a string', () => {
      expect(isBatchSellEnabled({ minimumVersion: 14110 })).toBe(false);
      expect(semverGteMock).not.toHaveBeenCalled();
    });
  });

  describe('version gating', () => {
    it('returns true when app version is greater than minimumVersion', () => {
      semverGteMock.mockReturnValue(true);
      expect(isBatchSellEnabled({ minimumVersion: '14.0.0' })).toBe(true);
      expect(semverGteMock).toHaveBeenCalledWith('14.11.0', '14.0.0');
    });

    it('returns true on exact version match', () => {
      semverGteMock.mockReturnValue(true);
      expect(isBatchSellEnabled({ minimumVersion: '14.11.0' })).toBe(true);
      expect(semverGteMock).toHaveBeenCalledWith('14.11.0', '14.11.0');
    });

    it('returns false when app version is below minimumVersion', () => {
      semverGteMock.mockReturnValue(false);
      expect(isBatchSellEnabled({ minimumVersion: '15.0.0' })).toBe(false);
      expect(semverGteMock).toHaveBeenCalledWith('14.11.0', '15.0.0');
    });
  });

  describe('error handling', () => {
    it('returns false when semver.gte throws', () => {
      semverGteMock.mockImplementation(() => {
        throw new Error('Invalid version');
      });
      expect(isBatchSellEnabled({ minimumVersion: 'not-a-semver' })).toBe(
        false,
      );
      expect(semverGteMock).toHaveBeenCalledTimes(1);
    });
  });
});
