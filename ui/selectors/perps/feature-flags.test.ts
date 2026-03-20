import semver from 'semver';
import { PerpsFeatureFlag } from '../../../shared/lib/perps-feature-flags';
import { getIsPerpsIncludedInBuild } from '../../../shared/lib/environment';
import { getIsPerpsExperienceAvailable } from './feature-flags';

jest.mock('semver');
jest.mock('../../../package.json', () => ({
  version: '12.5.0',
}));
jest.mock('../../../shared/lib/environment', () => ({
  ...jest.requireActual<typeof import('../../../shared/lib/environment')>(
    '../../../shared/lib/environment',
  ),
  getIsPerpsIncludedInBuild: jest.fn(),
}));

const getIsPerpsIncludedInBuildMock = jest.mocked(getIsPerpsIncludedInBuild);

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
    getIsPerpsIncludedInBuildMock.mockReturnValue(true);
  });

  describe('getIsPerpsExperienceAvailable', () => {
    describe('compile-time inclusion (PERPS_ENABLED)', () => {
      it('returns false when getIsPerpsIncludedInBuild is false even if remote flag would pass', () => {
        getIsPerpsIncludedInBuildMock.mockReturnValue(false);
        semverGteMock.mockReturnValue(true);

        const state = getMockState({
          enabled: true,
          minimumVersion: '12.0.0',
        });

        expect(getIsPerpsExperienceAvailable(state)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns true when getIsPerpsIncludedInBuild is true and remote flag passes', () => {
        getIsPerpsIncludedInBuildMock.mockReturnValue(true);
        semverGteMock.mockReturnValue(true);

        const state = getMockState({
          enabled: true,
          minimumVersion: '12.0.0',
        });

        expect(getIsPerpsExperienceAvailable(state)).toBe(true);
        expect(semverGteMock).toHaveBeenCalledTimes(1);
      });
    });

    describe('undefined or missing remote flag', () => {
      it('returns false when perpsEnabledVersion flag is undefined', () => {
        const state = getMockState(undefined);
        expect(getIsPerpsExperienceAvailable(state)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when remoteFeatureFlags is empty', () => {
        const state = { metamask: { remoteFeatureFlags: {} } };
        expect(getIsPerpsExperienceAvailable(state)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });
    });

    describe('perpsEnabledVersion JSON with version gating', () => {
      it('returns true when enabled is true and version check passes', () => {
        semverGteMock.mockReturnValue(true);

        const state = getMockState({
          enabled: true,
          minimumVersion: '12.0.0',
        });

        expect(getIsPerpsExperienceAvailable(state)).toBe(true);
        expect(semverGteMock).toHaveBeenCalledTimes(1);
        expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.0.0');
      });

      it('returns false when enabled is true but version check fails', () => {
        semverGteMock.mockReturnValue(false);

        const state = getMockState({
          enabled: true,
          minimumVersion: '13.0.0',
        });

        expect(getIsPerpsExperienceAvailable(state)).toBe(false);
        expect(semverGteMock).toHaveBeenCalledTimes(1);
        expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '13.0.0');
      });

      it('returns false when enabled is false regardless of version', () => {
        const state = getMockState({
          enabled: false,
          minimumVersion: '12.0.0',
        });

        expect(getIsPerpsExperienceAvailable(state)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when enabled is true but minimumVersion is missing', () => {
        const state = getMockState({
          enabled: true,
        } as PerpsFeatureFlag);

        expect(getIsPerpsExperienceAvailable(state)).toBe(false);
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

        expect(getIsPerpsExperienceAvailable(state)).toBe(false);
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

        expect(getIsPerpsExperienceAvailable(state)).toBe(true);
        expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.5.0');
      });

      it('handles prerelease versions', () => {
        semverGteMock.mockReturnValue(true);

        const state = getMockState({
          enabled: true,
          minimumVersion: '12.5.0-beta.1',
        });

        expect(getIsPerpsExperienceAvailable(state)).toBe(true);
        expect(semverGteMock).toHaveBeenCalledWith('12.5.0', '12.5.0-beta.1');
      });
    });
  });
});
