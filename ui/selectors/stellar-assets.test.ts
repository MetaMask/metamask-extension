import { XlmScope } from '@metamask/keyring-api';
import type { CaipAssetType } from '@metamask/utils';

import {
  getStellarBaseReserveForAccountAsset,
  getStellarMinimumReserveForSwap,
  getStellarTrustlineAssetInfoForAccount,
} from './stellar-assets';

const ACCOUNT_ID = 'stellar-account-id';
const STELLAR_NATIVE_ASSET_ID =
  `${XlmScope.Pubnet}/slip44:148` as CaipAssetType;
const ETHER_NATIVE_ASSET_ID = 'eip155:1/slip44:60' as CaipAssetType;
const TRUSTLINE_USDC =
  'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' as CaipAssetType;
const SEP41_ASSET_ID =
  'stellar:pubnet/sep41:CBIJBDNZNF4X35BJ4FFZWCDBSCKOP5NB4PLG4SNENRMLAPYG4P5FM6VN' as CaipAssetType;

const mockState = {
  metamask: {
    accountAssets: {
      [ACCOUNT_ID]: {
        [STELLAR_NATIVE_ASSET_ID]: {
          baseReserve: '2.5',
        },
        [TRUSTLINE_USDC]: {
          limit: '1000',
        },
      },
    },
  },
};

describe('stellar-assets selectors', () => {
  describe('getStellarBaseReserveForAccountAsset', () => {
    it('returns base reserve from StellarAssetsController state', () => {
      expect(
        getStellarBaseReserveForAccountAsset(
          mockState,
          ACCOUNT_ID,
          STELLAR_NATIVE_ASSET_ID,
        ),
      ).toBe('2.5');
    });

    it('defaults base reserve to "0" when native enrichment is missing', () => {
      expect(
        getStellarBaseReserveForAccountAsset(
          {
            metamask: {
              accountAssets: {
                [ACCOUNT_ID]: {},
              },
            },
          },
          ACCOUNT_ID,
          STELLAR_NATIVE_ASSET_ID,
        ),
      ).toBe('0');
    });

    it('returns undefined base reserve for unsupported assets', () => {
      expect(
        getStellarBaseReserveForAccountAsset(
          mockState,
          ACCOUNT_ID,
          ETHER_NATIVE_ASSET_ID,
        ),
      ).toBeUndefined();
    });
  });

  describe('getStellarTrustlineAssetInfoForAccount', () => {
    it('returns trustline metadata for an account/asset pair', () => {
      expect(
        getStellarTrustlineAssetInfoForAccount(
          mockState,
          ACCOUNT_ID,
          TRUSTLINE_USDC,
        ),
      ).toStrictEqual({
        limit: '1000',
      });
    });

    it('returns undefined for native asset enrichment', () => {
      expect(
        getStellarTrustlineAssetInfoForAccount(
          mockState,
          ACCOUNT_ID,
          STELLAR_NATIVE_ASSET_ID,
        ),
      ).toBeUndefined();
    });

    it('returns undefined when the account has no cached enrichment', () => {
      expect(
        getStellarTrustlineAssetInfoForAccount(
          { metamask: { accountAssets: {} } },
          ACCOUNT_ID,
          TRUSTLINE_USDC,
        ),
      ).toBeUndefined();
    });

    it('returns undefined when the asset is missing for the account', () => {
      expect(
        getStellarTrustlineAssetInfoForAccount(
          mockState,
          ACCOUNT_ID,
          SEP41_ASSET_ID,
        ),
      ).toBeUndefined();
    });
  });

  describe('getStellarMinimumReserveForSwap', () => {
    it('returns the base reserve when the destination trustline exists', () => {
      expect(
        getStellarMinimumReserveForSwap(
          mockState,
          ACCOUNT_ID,
          STELLAR_NATIVE_ASSET_ID,
          TRUSTLINE_USDC,
        ),
      ).toBe('2.5');
    });

    it('adds one base reserve when destination trustline metadata is missing', () => {
      const missingTrustlineAsset =
        'stellar:pubnet/asset:EURC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' as CaipAssetType;

      expect(
        getStellarMinimumReserveForSwap(
          mockState,
          ACCOUNT_ID,
          STELLAR_NATIVE_ASSET_ID,
          missingTrustlineAsset,
        ),
      ).toBe('3');
    });

    it('returns zero when native reserve enrichment is missing', () => {
      expect(
        getStellarMinimumReserveForSwap(
          {
            metamask: {
              accountAssets: {
                [ACCOUNT_ID]: {},
              },
            },
          },
          ACCOUNT_ID,
          STELLAR_NATIVE_ASSET_ID,
          TRUSTLINE_USDC,
        ),
      ).toBe('0');
    });

    it('returns zero when native reserve enrichment is zero', () => {
      expect(
        getStellarMinimumReserveForSwap(
          {
            metamask: {
              accountAssets: {
                [ACCOUNT_ID]: {
                  [STELLAR_NATIVE_ASSET_ID]: {
                    baseReserve: '0',
                  },
                },
              },
            },
          },
          ACCOUNT_ID,
          STELLAR_NATIVE_ASSET_ID,
          TRUSTLINE_USDC,
        ),
      ).toBe('0');
    });
  });
});
