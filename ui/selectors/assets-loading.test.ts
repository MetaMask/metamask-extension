/**
 * Proof-of-integration test for the transient per-account assets loading
 * state added to `@metamask/assets-controller` in MetaMask/core#10230.
 *
 * This repository consumes that controller through the
 * `@metamask-previews/assets-controller` alias in `package.json`. The
 * selectors exercised below only exist in that preview build, so this suite
 * doubles as a canary: if the alias stops resolving to the preview package,
 * the imports fail to compile and this file fails loudly.
 */
import {
  getAccountGroupLoadingStatus,
  getAccountLoadingStatus,
  getIsAssetsLoadingForSelectedAccountGroup,
  getDefaultAssetsControllerState,
  isAccountGroupLoading,
  isAccountLoading,
} from '@metamask/assets-controller';
import type {
  AccountId,
  AssetsControllerState,
  AssetsLoadingStatus,
} from '@metamask/assets-controller';

type AccountTreeStateParam = Parameters<
  typeof getIsAssetsLoadingForSelectedAccountGroup
>[1];

const ACCOUNT_ID_EVM = 'account-evm';
const ACCOUNT_ID_SOLANA = 'account-solana';
const ACCOUNT_ID_OTHER_GROUP = 'account-other-group';
const WALLET_ID = 'wallet-1';
const SELECTED_GROUP_ID = 'group-selected';
const OTHER_GROUP_ID = 'group-other';

/**
 * Build the AssetsController state slice consumed by the loading selectors.
 *
 * @param assetsLoadingStatus - Per-account loading status map to embed.
 * @returns The AssetsController state slice.
 */
const buildAssetsState = (
  assetsLoadingStatus: Record<AccountId, AssetsLoadingStatus>,
): Pick<AssetsControllerState, 'assetsLoadingStatus'> => ({
  assetsLoadingStatus,
});

/**
 * Build the AccountTreeController state slice consumed by the group-level
 * loading selectors. Only `accountTree.wallets` and `selectedAccountGroup`
 * are read by them; the cast relaxes the branded tree object types.
 *
 * @param selectedAccountGroup - Currently selected account group ID.
 * @returns The AccountTreeController state slice.
 */
const buildAccountTreeState = (
  selectedAccountGroup: string,
): AccountTreeStateParam =>
  ({
    accountTree: {
      wallets: {
        [WALLET_ID]: {
          groups: {
            [SELECTED_GROUP_ID]: {
              accounts: [ACCOUNT_ID_EVM, ACCOUNT_ID_SOLANA],
            },
            [OTHER_GROUP_ID]: {
              accounts: [ACCOUNT_ID_OTHER_GROUP],
            },
          },
        },
      },
    },
    selectedAccountGroup,
  }) as unknown as AccountTreeStateParam;

describe('assets-controller loading selectors', () => {
  it('exposes the new assetsLoadingStatus state field', () => {
    // The transient field ships empty by default (and is never persisted).
    expect(getDefaultAssetsControllerState().assetsLoadingStatus).toStrictEqual(
      {},
    );
  });

  describe('getAccountLoadingStatus', () => {
    it("returns 'loading' while an account's assets are loading", () => {
      const state = buildAssetsState({ [ACCOUNT_ID_EVM]: 'loading' });

      expect(getAccountLoadingStatus(state, ACCOUNT_ID_EVM)).toBe('loading');
    });

    it("returns 'loaded' once the account's fetch has settled", () => {
      const state = buildAssetsState({ [ACCOUNT_ID_EVM]: 'loaded' });

      expect(getAccountLoadingStatus(state, ACCOUNT_ID_EVM)).toBe('loaded');
    });

    it('returns undefined for an account with no triggered fetch', () => {
      const state = buildAssetsState({});

      expect(getAccountLoadingStatus(state, ACCOUNT_ID_EVM)).toBeUndefined();
    });
  });

  describe('isAccountLoading', () => {
    it('is true only while the account is loading', () => {
      const state = buildAssetsState({
        [ACCOUNT_ID_EVM]: 'loading',
        [ACCOUNT_ID_SOLANA]: 'loaded',
      });

      expect(isAccountLoading(state, ACCOUNT_ID_EVM)).toBe(true);
      expect(isAccountLoading(state, ACCOUNT_ID_SOLANA)).toBe(false);
      expect(isAccountLoading(state, ACCOUNT_ID_OTHER_GROUP)).toBe(false);
    });
  });

  describe('getAccountGroupLoadingStatus', () => {
    it('returns statuses for group members that have one, omitting the rest', () => {
      const state = buildAssetsState({
        [ACCOUNT_ID_EVM]: 'loading',
        [ACCOUNT_ID_SOLANA]: 'loaded',
      });
      const accountTreeState = buildAccountTreeState(SELECTED_GROUP_ID);

      // ACCOUNT_ID_OTHER_GROUP belongs to the other group and has no entry.
      expect(
        getAccountGroupLoadingStatus(
          state,
          accountTreeState,
          SELECTED_GROUP_ID,
        ),
      ).toStrictEqual({
        [ACCOUNT_ID_EVM]: 'loading',
        [ACCOUNT_ID_SOLANA]: 'loaded',
      });
    });

    it('returns an empty record for a group with no loading entries', () => {
      const state = buildAssetsState({});
      const accountTreeState = buildAccountTreeState(SELECTED_GROUP_ID);

      expect(
        getAccountGroupLoadingStatus(
          state,
          accountTreeState,
          SELECTED_GROUP_ID,
        ),
      ).toStrictEqual({});
    });
  });

  describe('isAccountGroupLoading', () => {
    it('is true when at least one account in the group is loading', () => {
      const state = buildAssetsState({
        [ACCOUNT_ID_EVM]: 'loaded',
        [ACCOUNT_ID_SOLANA]: 'loading',
      });
      const accountTreeState = buildAccountTreeState(SELECTED_GROUP_ID);

      expect(
        isAccountGroupLoading(state, accountTreeState, SELECTED_GROUP_ID),
      ).toBe(true);
    });

    it('is false when no account in the group is loading', () => {
      const state = buildAssetsState({
        [ACCOUNT_ID_EVM]: 'loaded',
      });
      const accountTreeState = buildAccountTreeState(SELECTED_GROUP_ID);

      expect(
        isAccountGroupLoading(state, accountTreeState, SELECTED_GROUP_ID),
      ).toBe(false);
    });
  });

  describe('getIsAssetsLoadingForSelectedAccountGroup', () => {
    it('is true when the selected group has a loading account', () => {
      const state = buildAssetsState({
        [ACCOUNT_ID_EVM]: 'loading',
      });
      const accountTreeState = buildAccountTreeState(SELECTED_GROUP_ID);

      expect(
        getIsAssetsLoadingForSelectedAccountGroup(state, accountTreeState),
      ).toBe(true);
    });

    it('is false when the selected group is fully loaded', () => {
      const state = buildAssetsState({
        [ACCOUNT_ID_EVM]: 'loaded',
      });
      const accountTreeState = buildAccountTreeState(SELECTED_GROUP_ID);

      expect(
        getIsAssetsLoadingForSelectedAccountGroup(state, accountTreeState),
      ).toBe(false);
    });

    it('is false when loading is happening in a group that is not selected', () => {
      const state = buildAssetsState({
        [ACCOUNT_ID_OTHER_GROUP]: 'loading',
      });
      const accountTreeState = buildAccountTreeState(SELECTED_GROUP_ID);

      expect(
        getIsAssetsLoadingForSelectedAccountGroup(state, accountTreeState),
      ).toBe(false);
    });

    it('is false when no group is selected', () => {
      const state = buildAssetsState({
        [ACCOUNT_ID_EVM]: 'loading',
      });
      const accountTreeState = buildAccountTreeState('');

      expect(
        getIsAssetsLoadingForSelectedAccountGroup(state, accountTreeState),
      ).toBe(false);
    });
  });
});
