import semver from 'semver';
import { ENABLE_DMK_FEATURE_FLAG } from '../../../shared/lib/hardware-wallets/feature-flags';
import { getIsDmkEnabled } from './feature-flags';

jest.mock('semver');
jest.mock('../../../package.json', () => ({
  version: '13.42.0',
}));

type DmkFlag = {
  enabled?: boolean;
  minimumVersion?: string | null;
  featureVersion?: string | null;
};

type MockState = {
  metamask: {
    remoteFeatureFlags: {
      [ENABLE_DMK_FEATURE_FLAG]?: DmkFlag;
    };
  };
};

const getMockState = (flag?: DmkFlag): MockState => ({
  metamask: {
    remoteFeatureFlags: {
      [ENABLE_DMK_FEATURE_FLAG]: flag,
    },
  },
});

describe('Hardware Wallet Feature Flags', () => {
  const semverGteMock = semver.gte as jest.MockedFunction<typeof semver.gte>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getIsDmkEnabled', () => {
    describe('disabled variant (production default)', () => {
      it('returns false for the disabled variant', () => {
        const state = getMockState({
          enabled: false,
          featureVersion: null,
          minimumVersion: null,
        });

        expect(getIsDmkEnabled(state)).toBe(false);
        // minimumVersion is null, so isVersionGatedFeatureFlag rejects the
        // shape and getBooleanFeatureFlag falls back to the default without
        // invoking semver.
        expect(semverGteMock).not.toHaveBeenCalled();
      });
    });

    describe('enabled variant', () => {
      it('returns true when enabled is true and version check passes', () => {
        semverGteMock.mockReturnValue(true);

        const state = getMockState({
          enabled: true,
          featureVersion: '13.42.0',
          minimumVersion: '13.42.0',
        });

        expect(getIsDmkEnabled(state)).toBe(true);
        expect(semverGteMock).toHaveBeenCalledTimes(1);
        expect(semverGteMock).toHaveBeenCalledWith('13.42.0', '13.42.0');
      });

      it('returns false when enabled is true but version check fails', () => {
        semverGteMock.mockReturnValue(false);

        const state = getMockState({
          enabled: true,
          featureVersion: '100.0.0',
          minimumVersion: '100.0.0',
        });

        expect(getIsDmkEnabled(state)).toBe(false);
        expect(semverGteMock).toHaveBeenCalledWith('13.42.0', '100.0.0');
      });

      it('returns false when enabled is false regardless of minimumVersion', () => {
        const state = getMockState({
          enabled: false,
          minimumVersion: '12.0.0',
        });

        // isVersionGatedFeatureFlag accepts the shape, but enabled === false
        // short-circuits validatedVersionGatedFeatureFlag before calling semver.
        expect(getIsDmkEnabled(state)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });
    });

    describe('missing or malformed flag', () => {
      it('returns false when the flag is undefined', () => {
        const state: MockState = { metamask: { remoteFeatureFlags: {} } };

        expect(getIsDmkEnabled(state)).toBe(false);
        expect(semverGteMock).not.toHaveBeenCalled();
      });

      it('returns false when the flag value is a plain boolean', () => {
        const state = {
          metamask: {
            remoteFeatureFlags: { [ENABLE_DMK_FEATURE_FLAG]: true },
          },
        };

        // Plain boolean true → getBooleanFeatureFlag returns true.
        expect(getIsDmkEnabled(state)).toBe(true);
      });

      it('returns false for a plain boolean false', () => {
        const state = {
          metamask: {
            remoteFeatureFlags: { [ENABLE_DMK_FEATURE_FLAG]: false },
          },
        };

        expect(getIsDmkEnabled(state)).toBe(false);
      });
    });
  });
});
