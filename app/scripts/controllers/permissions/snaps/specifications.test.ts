import { ASSETS_UNIFY_STATE_FLAG } from '../../../../../shared/lib/assets-unify-state/remote-feature-flag';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../../../shared/lib/environment';
import { getSnapPermissionSpecifications } from './specifications';

// Opt out of the global `isAssetsUnifyStateFeatureEnabled` mock (see test/jest/setup.js)
// and provide the pure flag-evaluation logic without the IN_TEST bypass
// (test/helpers/setup-helper.js sets process.env.IN_TEST=true for all unit tests,
// so using jest.requireActual here would make the function always return true,
// breaking tests that exercise the disabled-flag path).
jest.mock(
  '../../../../../shared/lib/assets-unify-state/remote-feature-flag',
  () => ({
    ...jest.requireActual(
      '../../../../../shared/lib/assets-unify-state/remote-feature-flag',
    ),
    isAssetsUnifyStateFeatureEnabled: jest.fn(
      (
        featureFlag:
          | { enabled: boolean; featureVersion: string }
          | undefined
          | null,
        featureVersion: string,
      ) =>
        Boolean(featureFlag?.enabled) &&
        featureFlag?.featureVersion === featureVersion,
    ),
  }),
);

jest.mock('../../../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../../../shared/lib/environment'),
  getIsAssetsUnifiedStateIncludedInBuild: jest.fn(),
}));

// Capture the hooks passed to buildSnapRestrictedMethodSpecifications so we
// can call getPreferences() directly without spinning up a full messenger.
let capturedHooks: Record<string, () => unknown> = {};
jest.mock('@metamask/snaps-rpc-methods', () => ({
  buildSnapEndowmentSpecifications: jest.fn(() => ({})),
  buildSnapRestrictedMethodSpecifications: jest.fn((_excluded, hooks) => {
    capturedHooks = hooks;
    return {};
  }),
}));

const BASE_PREFERENCES_STATE = {
  currentLocale: 'en',
  openSeaEnabled: false,
  preferences: { privacyMode: false, showTestNetworks: false },
  securityAlertsEnabled: false,
  useCurrencyRateCheck: false,
  usePhishDetect: false,
  useTransactionSimulations: false,
  useTokenDetection: false,
  useMultiAccountBalanceChecker: false,
  useNftDetection: false,
};

function buildMessenger(
  overrides: Partial<Record<string, () => unknown>> = {},
) {
  const defaults: Record<string, () => unknown> = {
    'RemoteFeatureFlagController:getState': () => ({
      remoteFeatureFlags: {},
    }),
    'AssetsController:getState': () => ({ selectedCurrency: 'eur' }),
    'CurrencyRateController:getState': () => ({ currentCurrency: 'usd' }),
    'PreferencesController:getState': () => BASE_PREFERENCES_STATE,
    ...overrides,
  };

  return {
    call: jest.fn((action: string) => defaults[action]?.()),
  };
}

describe('getSnapPermissionSpecifications', () => {
  describe('getPreferences – currency source', () => {
    it('uses AssetsController selectedCurrency when assetsUnifyState is enabled', () => {
      jest.mocked(getIsAssetsUnifiedStateIncludedInBuild).mockReturnValue(true);

      const messenger = buildMessenger({
        'RemoteFeatureFlagController:getState': () => ({
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: { enabled: true, featureVersion: '1' },
          },
        }),
        'AssetsController:getState': () => ({ selectedCurrency: 'eur' }),
      });

      getSnapPermissionSpecifications(messenger as never);
      const result = capturedHooks.getPreferences();

      expect(result).toMatchObject({ currency: 'eur' });
    });

    it('uses CurrencyRateController currentCurrency when assetsUnifyState is disabled', () => {
      jest.mocked(getIsAssetsUnifiedStateIncludedInBuild).mockReturnValue(true);

      const messenger = buildMessenger({
        'RemoteFeatureFlagController:getState': () => ({
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: { enabled: false, featureVersion: null },
          },
        }),
        'CurrencyRateController:getState': () => ({ currentCurrency: 'gbp' }),
      });

      getSnapPermissionSpecifications(messenger as never);
      const result = capturedHooks.getPreferences();

      expect(result).toMatchObject({ currency: 'gbp' });
    });

    it('uses CurrencyRateController currentCurrency when assetsUnifyState build flag is off', () => {
      jest
        .mocked(getIsAssetsUnifiedStateIncludedInBuild)
        .mockReturnValue(false);

      const messenger = buildMessenger({
        'RemoteFeatureFlagController:getState': () => ({
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: { enabled: true, featureVersion: '1' },
          },
        }),
        'CurrencyRateController:getState': () => ({ currentCurrency: 'usd' }),
      });

      getSnapPermissionSpecifications(messenger as never);
      const result = capturedHooks.getPreferences();

      expect(result).toMatchObject({ currency: 'usd' });
    });
  });
});
