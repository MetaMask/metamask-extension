import * as manifestFlags from '../../../shared/lib/manifestFlags';
import { MUSD_BUYABLE_CHAIN_IDS } from '../../components/app/musd/constants';
import type { MusdFeatureFlags } from '../../pages/musd/types';
import {
  DEFAULT_MUSD_BOOLEAN_FLAG,
  DEFAULT_MUSD_WILDCARD_TOKEN_LIST,
  DEFAULT_MUSD_GEO_BLOCKING_CONFIG,
  DEFAULT_MUSD_MIN_ASSET_BALANCE,
  DEFAULT_MUSD_REMOTE_FEATURE_FLAGS,
} from './constants';
import {
  selectIsMusdConversionFlowEnabled,
  selectIsMusdCtaEnabled,
  selectIsMusdTokenListItemCtaEnabled,
  selectIsMusdAssetOverviewCtaEnabled,
  selectIsMusdRewardsUiEnabled,
  selectIsMerklClaimingEnabled,
  selectMusdCtaTokens,
  selectMusdConvertibleTokensAllowlist,
  selectMusdConvertibleTokensBlocklist,
  selectMusdGeoBlockedCountries,
  selectMusdBlockedRegions,
  selectMusdMinAssetBalanceRequired,
  selectAllMusdFeatureFlags,
  selectShouldShowAnyMusdCta,
  selectMusdBuyableChainIds,
} from './feature-flags';

type MockState = {
  metamask: {
    remoteFeatureFlags: Partial<MusdFeatureFlags>;
  };
};

const getMockState = (
  overrides: Partial<MusdFeatureFlags> = {},
): MockState => ({
  metamask: {
    remoteFeatureFlags: overrides,
  },
});

describe('MUSD Feature Flag Selectors', () => {
  let getManifestFlagsMock: jest.SpyInstance;

  beforeEach(() => {
    getManifestFlagsMock = jest
      .spyOn(manifestFlags, 'getManifestFlags')
      .mockReturnValue({});

    // reselect caches results; reset between tests so each gets fresh state
    selectIsMusdConversionFlowEnabled.resetRecomputations();
    selectIsMusdCtaEnabled.resetRecomputations();
    selectIsMusdTokenListItemCtaEnabled.resetRecomputations();
    selectIsMusdAssetOverviewCtaEnabled.resetRecomputations();
    selectIsMusdRewardsUiEnabled.resetRecomputations();
    selectIsMerklClaimingEnabled.resetRecomputations();
    selectMusdCtaTokens.resetRecomputations();
    selectMusdConvertibleTokensAllowlist.resetRecomputations();
    selectMusdConvertibleTokensBlocklist.resetRecomputations();
    selectMusdGeoBlockedCountries.resetRecomputations();
    selectMusdBlockedRegions.resetRecomputations();
    selectMusdMinAssetBalanceRequired.resetRecomputations();
    selectAllMusdFeatureFlags.resetRecomputations();
    selectShouldShowAnyMusdCta.resetRecomputations();
    selectMusdBuyableChainIds.resetRecomputations();
  });

  afterEach(() => {
    getManifestFlagsMock.mockRestore();
  });

  // --------------------------------------------------------------------------
  // Boolean selectors
  // --------------------------------------------------------------------------

  describe('selectIsMusdConversionFlowEnabled', () => {
    it('returns true when flag is true', () => {
      const state = getMockState({ earnMusdConversionFlowEnabled: true });
      expect(selectIsMusdConversionFlowEnabled(state as never)).toBe(true);
    });

    it('returns false when flag is false', () => {
      const state = getMockState({ earnMusdConversionFlowEnabled: false });
      expect(selectIsMusdConversionFlowEnabled(state as never)).toBe(false);
    });

    it('defaults to DEFAULT_MUSD_BOOLEAN_FLAG when flag is absent', () => {
      const state = getMockState();
      expect(selectIsMusdConversionFlowEnabled(state as never)).toBe(
        DEFAULT_MUSD_BOOLEAN_FLAG,
      );
    });
  });

  describe('selectIsMusdCtaEnabled', () => {
    it('returns true when flag is true', () => {
      const state = getMockState({ earnMusdCtaEnabled: true });
      expect(selectIsMusdCtaEnabled(state as never)).toBe(true);
    });

    it('returns false when flag is false', () => {
      const state = getMockState({ earnMusdCtaEnabled: false });
      expect(selectIsMusdCtaEnabled(state as never)).toBe(false);
    });

    it('defaults to DEFAULT_MUSD_BOOLEAN_FLAG when flag is absent', () => {
      const state = getMockState();
      expect(selectIsMusdCtaEnabled(state as never)).toBe(
        DEFAULT_MUSD_BOOLEAN_FLAG,
      );
    });
  });

  describe('selectIsMusdTokenListItemCtaEnabled', () => {
    it('returns true when flag is true', () => {
      const state = getMockState({
        earnMusdConversionTokenListItemCtaEnabled: true,
      });
      expect(selectIsMusdTokenListItemCtaEnabled(state as never)).toBe(true);
    });

    it('defaults to DEFAULT_MUSD_BOOLEAN_FLAG when flag is absent', () => {
      const state = getMockState();
      expect(selectIsMusdTokenListItemCtaEnabled(state as never)).toBe(
        DEFAULT_MUSD_BOOLEAN_FLAG,
      );
    });
  });

  describe('selectIsMusdAssetOverviewCtaEnabled', () => {
    it('returns true when flag is true', () => {
      const state = getMockState({
        earnMusdConversionAssetOverviewCtaEnabled: true,
      });
      expect(selectIsMusdAssetOverviewCtaEnabled(state as never)).toBe(true);
    });

    it('defaults to DEFAULT_MUSD_BOOLEAN_FLAG when flag is absent', () => {
      const state = getMockState();
      expect(selectIsMusdAssetOverviewCtaEnabled(state as never)).toBe(
        DEFAULT_MUSD_BOOLEAN_FLAG,
      );
    });
  });

  describe('selectIsMusdRewardsUiEnabled', () => {
    it('returns true when flag is true', () => {
      const state = getMockState({
        earnMusdConversionRewardsUiEnabled: true,
      });
      expect(selectIsMusdRewardsUiEnabled(state as never)).toBe(true);
    });

    it('defaults to DEFAULT_MUSD_BOOLEAN_FLAG when flag is absent', () => {
      const state = getMockState();
      expect(selectIsMusdRewardsUiEnabled(state as never)).toBe(
        DEFAULT_MUSD_BOOLEAN_FLAG,
      );
    });
  });

  describe('selectIsMerklClaimingEnabled', () => {
    it('returns true when flag is true', () => {
      const state = getMockState({ earnMerklCampaignClaiming: true });
      expect(selectIsMerklClaimingEnabled(state as never)).toBe(true);
    });

    it('defaults to DEFAULT_MUSD_BOOLEAN_FLAG when flag is absent', () => {
      const state = getMockState();
      expect(selectIsMerklClaimingEnabled(state as never)).toBe(
        DEFAULT_MUSD_BOOLEAN_FLAG,
      );
    });
  });

  // --------------------------------------------------------------------------
  // Token list selectors
  // --------------------------------------------------------------------------

  describe('selectMusdCtaTokens', () => {
    it('returns the configured token list', () => {
      const tokens = { '*': ['USDC'] };
      const state = getMockState({ earnMusdConversionCtaTokens: tokens });
      expect(selectMusdCtaTokens(state as never)).toStrictEqual(tokens);
    });

    it('defaults to DEFAULT_MUSD_WILDCARD_TOKEN_LIST when flag is absent', () => {
      const state = getMockState();
      expect(selectMusdCtaTokens(state as never)).toStrictEqual(
        DEFAULT_MUSD_WILDCARD_TOKEN_LIST,
      );
    });
  });

  describe('selectMusdConvertibleTokensAllowlist', () => {
    it('returns the configured allowlist', () => {
      const list = { '0x1': ['USDC', 'USDT'] };
      const state = getMockState({ earnMusdConvertibleTokensAllowlist: list });
      expect(
        selectMusdConvertibleTokensAllowlist(state as never),
      ).toStrictEqual(list);
    });

    it('defaults to DEFAULT_MUSD_WILDCARD_TOKEN_LIST when flag is absent', () => {
      const state = getMockState();
      expect(
        selectMusdConvertibleTokensAllowlist(state as never),
      ).toStrictEqual(DEFAULT_MUSD_WILDCARD_TOKEN_LIST);
    });
  });

  describe('selectMusdConvertibleTokensBlocklist', () => {
    it('returns the configured blocklist', () => {
      const list = { '0x1': ['DAI'] };
      const state = getMockState({ earnMusdConvertibleTokensBlocklist: list });
      expect(
        selectMusdConvertibleTokensBlocklist(state as never),
      ).toStrictEqual(list);
    });

    it('defaults to DEFAULT_MUSD_WILDCARD_TOKEN_LIST when flag is absent', () => {
      const state = getMockState();
      expect(
        selectMusdConvertibleTokensBlocklist(state as never),
      ).toStrictEqual(DEFAULT_MUSD_WILDCARD_TOKEN_LIST);
    });
  });

  // --------------------------------------------------------------------------
  // Geo-blocking selectors
  // --------------------------------------------------------------------------

  describe('selectMusdGeoBlockedCountries', () => {
    it('returns the configured geo-blocking config', () => {
      const config = { blockedRegions: ['US', 'CA'] };
      const state = getMockState({
        earnMusdConversionGeoBlockedCountries: config,
      });
      expect(selectMusdGeoBlockedCountries(state as never)).toStrictEqual(
        config,
      );
    });

    it('defaults to DEFAULT_MUSD_GEO_BLOCKING_CONFIG when flag is absent', () => {
      const state = getMockState();
      expect(selectMusdGeoBlockedCountries(state as never)).toStrictEqual(
        DEFAULT_MUSD_GEO_BLOCKING_CONFIG,
      );
    });
  });

  describe('selectMusdBlockedRegions', () => {
    it('returns blockedRegions from the geo config', () => {
      const config = { blockedRegions: ['US', 'GB-ENG'] };
      const state = getMockState({
        earnMusdConversionGeoBlockedCountries: config,
      });
      expect(selectMusdBlockedRegions(state as never)).toStrictEqual([
        'US',
        'GB-ENG',
      ]);
    });

    it('returns default blocked regions when flag is absent', () => {
      const state = getMockState();
      expect(selectMusdBlockedRegions(state as never)).toStrictEqual(
        DEFAULT_MUSD_GEO_BLOCKING_CONFIG.blockedRegions,
      );
    });
  });

  // --------------------------------------------------------------------------
  // Threshold selectors
  // --------------------------------------------------------------------------

  describe('selectMusdMinAssetBalanceRequired', () => {
    it('returns the configured minimum balance', () => {
      const state = getMockState({
        earnMusdConversionMinAssetBalanceRequired: 5,
      });
      expect(selectMusdMinAssetBalanceRequired(state as never)).toBe(5);
    });

    it('defaults to DEFAULT_MUSD_MIN_ASSET_BALANCE when flag is absent', () => {
      const state = getMockState();
      expect(selectMusdMinAssetBalanceRequired(state as never)).toBe(
        DEFAULT_MUSD_MIN_ASSET_BALANCE,
      );
    });
  });

  // --------------------------------------------------------------------------
  // Composite selectors
  // --------------------------------------------------------------------------

  describe('selectAllMusdFeatureFlags', () => {
    it('returns all defaults when no remote flags are set', () => {
      const state = getMockState();
      expect(selectAllMusdFeatureFlags(state as never)).toStrictEqual(
        DEFAULT_MUSD_REMOTE_FEATURE_FLAGS,
      );
    });

    it('merges partial remote flags with defaults', () => {
      const state = getMockState({
        earnMusdConversionFlowEnabled: true,
        earnMusdCtaEnabled: true,
      });
      expect(selectAllMusdFeatureFlags(state as never)).toStrictEqual({
        ...DEFAULT_MUSD_REMOTE_FEATURE_FLAGS,
        earnMusdConversionFlowEnabled: true,
        earnMusdCtaEnabled: true,
      });
    });

    it('overrides all defaults when all flags are set', () => {
      const fullFlags: MusdFeatureFlags = {
        earnMusdConversionFlowEnabled: true,
        earnMusdCtaEnabled: true,
        earnMusdConversionTokenListItemCtaEnabled: true,
        earnMusdConversionAssetOverviewCtaEnabled: true,
        earnMusdConversionRewardsUiEnabled: true,
        earnMusdConversionCtaTokens: { '*': ['*'] },
        earnMusdConvertibleTokensAllowlist: { '0x1': ['USDC'] },
        earnMusdConvertibleTokensBlocklist: { '0x1': ['DAI'] },
        earnMusdConversionGeoBlockedCountries: {
          blockedRegions: ['US'],
        },
        earnMusdConversionMinAssetBalanceRequired: 10,
        earnMerklCampaignClaiming: true,
      };
      const state = getMockState(fullFlags);
      expect(selectAllMusdFeatureFlags(state as never)).toStrictEqual(
        fullFlags,
      );
    });
  });

  describe('selectShouldShowAnyMusdCta', () => {
    it('returns true when flow and primary CTA are enabled', () => {
      const state = getMockState({
        earnMusdConversionFlowEnabled: true,
        earnMusdCtaEnabled: true,
      });
      expect(selectShouldShowAnyMusdCta(state as never)).toBe(true);
    });

    it('returns true when flow and token list CTA are enabled', () => {
      const state = getMockState({
        earnMusdConversionFlowEnabled: true,
        earnMusdConversionTokenListItemCtaEnabled: true,
      });
      expect(selectShouldShowAnyMusdCta(state as never)).toBe(true);
    });

    it('returns true when flow and asset overview CTA are enabled', () => {
      const state = getMockState({
        earnMusdConversionFlowEnabled: true,
        earnMusdConversionAssetOverviewCtaEnabled: true,
      });
      expect(selectShouldShowAnyMusdCta(state as never)).toBe(true);
    });

    it('returns false when flow is disabled', () => {
      const state = getMockState({
        earnMusdConversionFlowEnabled: false,
        earnMusdCtaEnabled: true,
        earnMusdConversionTokenListItemCtaEnabled: true,
        earnMusdConversionAssetOverviewCtaEnabled: true,
      });
      expect(selectShouldShowAnyMusdCta(state as never)).toBe(false);
    });

    it('returns false when flow is enabled but all CTAs are disabled', () => {
      const state = getMockState({
        earnMusdConversionFlowEnabled: true,
        earnMusdCtaEnabled: false,
        earnMusdConversionTokenListItemCtaEnabled: false,
        earnMusdConversionAssetOverviewCtaEnabled: false,
      });
      expect(selectShouldShowAnyMusdCta(state as never)).toBe(false);
    });

    it('returns false when all flags are absent (defaults)', () => {
      const state = getMockState();
      expect(selectShouldShowAnyMusdCta(state as never)).toBe(false);
    });
  });

  describe('selectMusdBuyableChainIds', () => {
    it('returns the buyable chain IDs constant', () => {
      const state = getMockState();
      expect(selectMusdBuyableChainIds(state as never)).toStrictEqual(
        MUSD_BUYABLE_CHAIN_IDS,
      );
    });
  });
});
