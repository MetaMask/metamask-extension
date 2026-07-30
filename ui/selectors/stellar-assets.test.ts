import type { AssetsControllerState } from '@metamask/assets-controller';
import { XlmScope } from '@metamask/keyring-api';
import type { CaipAssetType } from '@metamask/utils';

import {
  getIsAssetRequireActivate,
  getSpendableForAccount,
  getTrustlineAssetInfoForAccount,
  isAssetSupportActivation,
  isAssetSupportSpendableBalance,
} from './stellar-assets';

const ACCOUNT_ID = 'stellar-account-id';
const STELLAR_NATIVE_ASSET_ID =
  `${XlmScope.Pubnet}/slip44:148` as CaipAssetType;
const ETHER_NATIVE_ASSET_ID = 'eip155:1/slip44:60' as CaipAssetType;
const TRUSTLINE_USDC =
  'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' as CaipAssetType;
const SEP41_ASSET_ID =
  'stellar:pubnet/sep41:CBIJBDNZNF4X35BJ4FFZWCDBSCKOP5NB4PLG4SNENRMLAPYG4P5FM6VN' as CaipAssetType;

/** 2.5 XLM in stroops (7 decimals). */
const MINIMUM_RESERVE_BALANCE_STROOPS = '25000000';
/** 7.5 XLM in stroops (7 decimals). */
const SPENDABLE_BALANCE_STROOPS = '75000000';
const STELLAR_DECIMALS = 7;

type AssetsState = {
  metamask: AssetsControllerState;
};

function createMockState(
  assetsBalance: AssetsControllerState['assetsBalance'],
): AssetsState {
  return {
    metamask: { assetsBalance } as unknown as AssetsControllerState,
  };
}

const mockState = createMockState({
  [ACCOUNT_ID]: {
    [STELLAR_NATIVE_ASSET_ID]: {
      amount: '10',
      metadata: {
        minimumReserveBalance: MINIMUM_RESERVE_BALANCE_STROOPS,
        spendableBalance: SPENDABLE_BALANCE_STROOPS,
        decimal: STELLAR_DECIMALS,
      },
    },
    [TRUSTLINE_USDC]: {
      amount: '0',
      metadata: {
        limit: '1000',
      },
    },
  },
});

describe('stellar-assets selectors', () => {
  describe('getSpendableForAccount', () => {
    it('returns spendable and minimum reserve from AssetsController balance metadata', () => {
      expect(
        getSpendableForAccount(mockState, ACCOUNT_ID, STELLAR_NATIVE_ASSET_ID),
      ).toStrictEqual({
        minimumReserveBalance: '2.5',
        spendableBalance: '7.5',
      });
    });

    it('returns undefined when accountId is missing', () => {
      expect(
        getSpendableForAccount(mockState, undefined, STELLAR_NATIVE_ASSET_ID),
      ).toBeUndefined();
    });

    it('returns undefined when assetId is missing', () => {
      expect(
        getSpendableForAccount(mockState, ACCOUNT_ID, undefined),
      ).toBeUndefined();
    });

    it('returns undefined when native enrichment is missing', () => {
      expect(
        getSpendableForAccount(
          createMockState({
            [ACCOUNT_ID]: {
              [STELLAR_NATIVE_ASSET_ID]: {
                amount: '10',
              },
            },
          }),
          ACCOUNT_ID,
          STELLAR_NATIVE_ASSET_ID,
        ),
      ).toBeUndefined();
    });

    it('returns undefined when spendableBalance is missing from metadata', () => {
      expect(
        getSpendableForAccount(
          createMockState({
            [ACCOUNT_ID]: {
              [STELLAR_NATIVE_ASSET_ID]: {
                amount: '10',
                metadata: {
                  minimumReserveBalance: MINIMUM_RESERVE_BALANCE_STROOPS,
                  decimal: STELLAR_DECIMALS,
                },
              },
            },
          }),
          ACCOUNT_ID,
          STELLAR_NATIVE_ASSET_ID,
        ),
      ).toBeUndefined();
    });

    it('returns undefined when decimal is missing from metadata', () => {
      expect(
        getSpendableForAccount(
          createMockState({
            [ACCOUNT_ID]: {
              [STELLAR_NATIVE_ASSET_ID]: {
                amount: '10',
                metadata: {
                  minimumReserveBalance: MINIMUM_RESERVE_BALANCE_STROOPS,
                  spendableBalance: SPENDABLE_BALANCE_STROOPS,
                },
              },
            },
          }),
          ACCOUNT_ID,
          STELLAR_NATIVE_ASSET_ID,
        ),
      ).toBeUndefined();
    });

    it('returns undefined for unsupported assets', () => {
      expect(
        getSpendableForAccount(mockState, ACCOUNT_ID, ETHER_NATIVE_ASSET_ID),
      ).toBeUndefined();
    });
  });

  describe('getTrustlineAssetInfoForAccount', () => {
    it('returns trustline metadata for an account/asset pair', () => {
      expect(
        getTrustlineAssetInfoForAccount(mockState, ACCOUNT_ID, TRUSTLINE_USDC),
      ).toStrictEqual({
        limit: '1000',
      });
    });

    it('returns undefined for native asset enrichment', () => {
      expect(
        getTrustlineAssetInfoForAccount(
          mockState,
          ACCOUNT_ID,
          STELLAR_NATIVE_ASSET_ID,
        ),
      ).toBeUndefined();
    });

    it('returns undefined when the account has no balance entry', () => {
      expect(
        getTrustlineAssetInfoForAccount(
          createMockState({}),
          ACCOUNT_ID,
          TRUSTLINE_USDC,
        ),
      ).toBeUndefined();
    });

    it('returns undefined when the asset is missing for the account', () => {
      expect(
        getTrustlineAssetInfoForAccount(mockState, ACCOUNT_ID, SEP41_ASSET_ID),
      ).toBeUndefined();
    });

    it('returns undefined when balance metadata is missing', () => {
      expect(
        getTrustlineAssetInfoForAccount(
          createMockState({
            [ACCOUNT_ID]: {
              [TRUSTLINE_USDC]: {
                amount: '0',
              },
            },
          }),
          ACCOUNT_ID,
          TRUSTLINE_USDC,
        ),
      ).toBeUndefined();
    });
  });

  describe('getIsAssetRequireActivate', () => {
    it('returns false when accountId is missing', () => {
      expect(
        getIsAssetRequireActivate(mockState, undefined, TRUSTLINE_USDC),
      ).toBe(false);
    });

    it('returns false when assetId is missing', () => {
      expect(getIsAssetRequireActivate(mockState, ACCOUNT_ID, undefined)).toBe(
        false,
      );
    });

    it('returns false when trustline limit is active', () => {
      expect(
        getIsAssetRequireActivate(mockState, ACCOUNT_ID, TRUSTLINE_USDC),
      ).toBe(false);
    });

    it('returns true when trustline metadata is missing', () => {
      expect(
        getIsAssetRequireActivate(
          createMockState({
            [ACCOUNT_ID]: {
              [TRUSTLINE_USDC]: {
                amount: '0',
              },
            },
          }),
          ACCOUNT_ID,
          TRUSTLINE_USDC,
        ),
      ).toBe(true);
    });

    it('returns true when trustline limit is "0"', () => {
      expect(
        getIsAssetRequireActivate(
          createMockState({
            [ACCOUNT_ID]: {
              [TRUSTLINE_USDC]: {
                amount: '0',
                metadata: {
                  limit: '0',
                },
              },
            },
          }),
          ACCOUNT_ID,
          TRUSTLINE_USDC,
        ),
      ).toBe(true);
    });

    it('returns false for non-trustline assets', () => {
      expect(
        getIsAssetRequireActivate(
          mockState,
          ACCOUNT_ID,
          STELLAR_NATIVE_ASSET_ID,
        ),
      ).toBe(false);
    });

    it('returns false for SEP-41 assets even with inactive-looking metadata', () => {
      expect(
        getIsAssetRequireActivate(
          createMockState({
            [ACCOUNT_ID]: {
              [SEP41_ASSET_ID]: {
                amount: '0',
                metadata: {
                  limit: '0',
                },
              },
            },
          }),
          ACCOUNT_ID,
          SEP41_ASSET_ID,
        ),
      ).toBe(false);
    });
  });

  describe('isAssetSupportActivation', () => {
    it('returns true for a Stellar classic asset', () => {
      expect(isAssetSupportActivation(TRUSTLINE_USDC)).toBe(true);
    });

    it('returns false for a Stellar SEP-41 asset', () => {
      expect(isAssetSupportActivation(SEP41_ASSET_ID)).toBe(false);
    });

    it('returns false for a non-Stellar asset', () => {
      expect(isAssetSupportActivation(ETHER_NATIVE_ASSET_ID)).toBe(false);
    });

    it('returns false for an empty or undefined assetId', () => {
      expect(isAssetSupportActivation('')).toBe(false);
      expect(isAssetSupportActivation(undefined)).toBe(false);
    });
  });

  describe('isAssetSupportSpendableBalance', () => {
    it('returns true for native XLM', () => {
      expect(isAssetSupportSpendableBalance(STELLAR_NATIVE_ASSET_ID)).toBe(
        true,
      );
    });

    it('returns false for unsupported assets', () => {
      expect(isAssetSupportSpendableBalance(ETHER_NATIVE_ASSET_ID)).toBe(false);
      expect(isAssetSupportSpendableBalance(TRUSTLINE_USDC)).toBe(false);
      expect(isAssetSupportSpendableBalance('')).toBe(false);
      expect(isAssetSupportSpendableBalance(undefined)).toBe(false);
    });
  });
});
