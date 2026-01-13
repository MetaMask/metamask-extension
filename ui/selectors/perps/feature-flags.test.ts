import semver from 'semver';
import { PerpsFeatureFlag } from '../../../shared/lib/perps-feature-flags';
import { getIsPerpsEnabled } from './feature-flags';

jest.mock('semver');
jest.mock('../../../package.json', () => ({
  version: '12.5.0',
}));

type MockState = {
  metamask: {
    remoteFeatureFlags: {
      perpsEnabledVersion?: PerpsFeatureFlag;
    };
  };
};

const getMockState = (perpsEnabledVersion?: PerpsFeatureFlag): MockState => ({
  metamask: {
    remoteFeatureFlags: {
      perpsEnabledVersion,
    },
  },
});

describe('Perps Feature Flags', () => {
  const semverGteMock = semver.gte as jest.MockedFunction<typeof semver.gte>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getIsPerpsEnabled', () => {
    describe('undefined or missing flag', () => {
      it('returns false when perpsEnabledVersion flag is undefined', () => {
        const state = getMockState(undefined);
        expect(getIsPerpsEnabled(state)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when remoteFeatureFlags is empty', () => {
        const state = { metamask: { remoteFeatureFlags: {} } };
        expect(getIsPerpsEnabled(state)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });
    });

    describe('JSON flags with version gating', () => {
      it('returns true when enabled is true and version check passes', () => {
        semverGteMock.mockReturnValue(true);

        const state = getMockState({
          enabled: true,
          minimumVersion: '12.0.0',
        });

        expect(getIsPerpsEnabled(state)).toBe(true);
        expect(semverGteMock).toHaveBeenCalledTimes(1);
        expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.0.0');
      });

      it('returns false when enabled is true but version check fails', () => {
        semverGteMock.mockReturnValue(false);

        const state = getMockState({
          enabled: true,
          minimumVersion: '13.0.0',
        });

        expect(getIsPerpsEnabled(state)).toBe(false);
        expect(semverGteMock).toHaveBeenCalledTimes(1);
        expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '13.0.0');
      });

      it('returns false when enabled is false regardless of version', () => {
        const state = getMockState({
          enabled: false,
          minimumVersion: '12.0.0',
        });

        expect(getIsPerpsEnabled(state)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when enabled is true but minimumVersion is missing', () => {
        const state = getMockState({
          enabled: true,
        } as PerpsFeatureFlag);

        expect(getIsPerpsEnabled(state)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when semver comparison throws an error', () => {
        semverGteMock.mockImplementation(() => {
          throw new Error('Invalid version');
        });

        const state = getMockState({
          enabled: true,
          minimumVersion: 'invalid-version',
        });

        expect(getIsPerpsEnabled(state)).toBe(false);
        expect(semverGteMock).toHaveBeenCalledTimes(1);
      });
    });

    describe('edge cases', () => {
      it('handles exact version match', () => {
        semverGteMock.mockReturnValue(true);

        const state = getMockState({
          enabled: true,
          minimumVersion: '12.5.0',
        });

        expect(getIsPerpsEnabled(state)).toBe(true);
        expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.5.0');
      });

      it('handles prerelease versions', () => {
        semverGteMock.mockReturnValue(true);

        const state = getMockState({
          enabled: true,
          minimumVersion: '12.5.0-beta.1',
        });

        expect(getIsPerpsEnabled(state)).toBe(true);
        expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.5.0-beta.1');
      });
    });
  });
});
