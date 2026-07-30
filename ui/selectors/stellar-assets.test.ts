import type { AssetsControllerState } from '@metamask/assets-controller';
import { AccountGroupType, AccountWalletType } from '@metamask/account-api';
import { XlmScope } from '@metamask/keyring-api';
import type { CaipAssetType } from '@metamask/utils';

import { MOCK_ACCOUNT_STELLAR_PUBNET } from '../../test/data/mock-accounts';
import {
  getIsAssetRequireActivate,
  getSpendableForAccount,
  getTrustlineAssetInfoForAccount,
  isAssetSupportActivation,
  isAssetSupportSpendableBalance,
} from './stellar-assets';

const ACCOUNT_ID = MOCK_ACCOUNT_STELLAR_PUBNET.id;
const WALLET_ID = 'entropy:stellar-test';
const ACCOUNT_GROUP_ID = 'entropy:stellar-test/0';
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
  metamask: AssetsControllerState & {
    selectedAccountGroup?: string | null;
    accountTree?: {
      wallets: Record<string, unknown>;
    };
    internalAccounts?: {
      accounts: Record<string, unknown>;
      selectedAccount: string;
    };
  };
};

function createMockState(
  assetsBalance: AssetsControllerState['assetsBalance'],
  options?: { withSelectedStellarAccount?: boolean },
): AssetsState {
  const metamask: AssetsState['metamask'] = {
    assetsBalance,
    selectedAccountGroup: null,
    accountTree: {
      wallets: {},
    },
    internalAccounts: {
      accounts: {},
      selectedAccount: '',
    },
  } as AssetsState['metamask'];

  if (options?.withSelectedStellarAccount) {
    metamask.internalAccounts = {
      accounts: {
        [ACCOUNT_ID]: MOCK_ACCOUNT_STELLAR_PUBNET,
      },
      selectedAccount: ACCOUNT_ID,
    };
    metamask.accountTree = {
      wallets: {
        [WALLET_ID]: {
          id: WALLET_ID,
          type: AccountWalletType.Entropy,
          status: 'ready',
          groups: {
            [ACCOUNT_GROUP_ID]: {
              id: ACCOUNT_GROUP_ID,
              type: AccountGroupType.MultichainAccount,
              accounts: [ACCOUNT_ID],
              metadata: {
                name: 'Stellar',
                entropy: { groupIndex: 0 },
                pinned: false,
                hidden: false,
                lastSelected: 0,
              },
            },
          },
          metadata: {
            name: 'Stellar Wallet',
            entropy: { id: 'stellar-test' },
          },
        },
      },
    };
    metamask.selectedAccountGroup = ACCOUNT_GROUP_ID;
  }

  return { metamask };
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

const mockStateWithSelectedAccount = createMockState(
  {
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
  },
  { withSelectedStellarAccount: true },
);

describe('stellar-assets selectors', () => {
  describe('getSpendableForAccount', () => {
    it('returns spendable and minimum reserve from AssetsController balance metadata', () => {
      expect(
        getSpendableForAccount(mockState, {
          accountId: ACCOUNT_ID,
          assetId: STELLAR_NATIVE_ASSET_ID,
        }),
      ).toStrictEqual({
        minimumReserveBalance: '2.5',
        spendableBalance: '7.5',
      });
    });

    it('falls back to the selected account when accountId is omitted', () => {
      expect(
        getSpendableForAccount(mockStateWithSelectedAccount, {
          assetId: STELLAR_NATIVE_ASSET_ID,
        }),
      ).toStrictEqual({
        minimumReserveBalance: '2.5',
        spendableBalance: '7.5',
      });
    });

    it('returns undefined when accountId is omitted and no selected account exists', () => {
      expect(
        getSpendableForAccount(mockState, {
          assetId: STELLAR_NATIVE_ASSET_ID,
        }),
      ).toBeUndefined();
    });

    it('returns undefined when assetId is not a CAIP spendable asset', () => {
      expect(
        getSpendableForAccount(mockState, {
          accountId: ACCOUNT_ID,
          assetId: '0xabc',
        }),
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
          {
            accountId: ACCOUNT_ID,
            assetId: STELLAR_NATIVE_ASSET_ID,
          },
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
          {
            accountId: ACCOUNT_ID,
            assetId: STELLAR_NATIVE_ASSET_ID,
          },
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
          {
            accountId: ACCOUNT_ID,
            assetId: STELLAR_NATIVE_ASSET_ID,
          },
        ),
      ).toBeUndefined();
    });

    it('returns undefined for unsupported assets', () => {
      expect(
        getSpendableForAccount(mockState, {
          accountId: ACCOUNT_ID,
          assetId: ETHER_NATIVE_ASSET_ID,
        }),
      ).toBeUndefined();
    });
  });

  describe('getTrustlineAssetInfoForAccount', () => {
    it('returns trustline metadata for an account/asset pair', () => {
      expect(
        getTrustlineAssetInfoForAccount(mockState, {
          accountId: ACCOUNT_ID,
          assetId: TRUSTLINE_USDC,
        }),
      ).toStrictEqual({
        limit: '1000',
      });
    });

    it('falls back to the selected account when accountId is omitted', () => {
      expect(
        getTrustlineAssetInfoForAccount(mockStateWithSelectedAccount, {
          assetId: TRUSTLINE_USDC,
        }),
      ).toStrictEqual({
        limit: '1000',
      });
    });

    it('returns undefined when accountId is omitted and no selected account exists', () => {
      expect(
        getTrustlineAssetInfoForAccount(mockState, {
          assetId: TRUSTLINE_USDC,
        }),
      ).toBeUndefined();
    });

    it('returns undefined for native asset enrichment', () => {
      expect(
        getTrustlineAssetInfoForAccount(mockState, {
          accountId: ACCOUNT_ID,
          assetId: STELLAR_NATIVE_ASSET_ID,
        }),
      ).toBeUndefined();
    });

    it('returns undefined when the account has no balance entry', () => {
      expect(
        getTrustlineAssetInfoForAccount(createMockState({}), {
          accountId: ACCOUNT_ID,
          assetId: TRUSTLINE_USDC,
        }),
      ).toBeUndefined();
    });

    it('returns undefined when the asset is missing for the account', () => {
      expect(
        getTrustlineAssetInfoForAccount(mockState, {
          accountId: ACCOUNT_ID,
          assetId: SEP41_ASSET_ID,
        }),
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
          {
            accountId: ACCOUNT_ID,
            assetId: TRUSTLINE_USDC,
          },
        ),
      ).toBeUndefined();
    });
  });

  describe('getIsAssetRequireActivate', () => {
    it('returns false when accountId is missing and no selected account exists', () => {
      expect(
        getIsAssetRequireActivate(mockState, { assetId: TRUSTLINE_USDC }),
      ).toBe(false);
    });

    it('returns false when assetId is not a CAIP classic asset', () => {
      expect(
        getIsAssetRequireActivate(mockState, {
          accountId: ACCOUNT_ID,
          assetId: '0xabc',
        }),
      ).toBe(false);
    });

    it('falls back to the selected account when accountId is omitted', () => {
      expect(
        getIsAssetRequireActivate(mockStateWithSelectedAccount, {
          assetId: TRUSTLINE_USDC,
        }),
      ).toBe(false);

      expect(
        getIsAssetRequireActivate(
          createMockState(
            {
              [ACCOUNT_ID]: {
                [TRUSTLINE_USDC]: {
                  amount: '0',
                  metadata: {
                    limit: '0',
                  },
                },
              },
            },
            { withSelectedStellarAccount: true },
          ),
          { assetId: TRUSTLINE_USDC },
        ),
      ).toBe(true);
    });

    it('returns false when trustline limit is active', () => {
      expect(
        getIsAssetRequireActivate(mockState, {
          accountId: ACCOUNT_ID,
          assetId: TRUSTLINE_USDC,
        }),
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
          {
            accountId: ACCOUNT_ID,
            assetId: TRUSTLINE_USDC,
          },
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
          {
            accountId: ACCOUNT_ID,
            assetId: TRUSTLINE_USDC,
          },
        ),
      ).toBe(true);
    });

    it('returns false for non-trustline assets', () => {
      expect(
        getIsAssetRequireActivate(mockState, {
          accountId: ACCOUNT_ID,
          assetId: STELLAR_NATIVE_ASSET_ID,
        }),
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
          {
            accountId: ACCOUNT_ID,
            assetId: SEP41_ASSET_ID,
          },
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
