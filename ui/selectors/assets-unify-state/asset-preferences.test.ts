import {
  getAssetsControllerAssetPreferences,
  getAssetsControllerCustomAssets,
  isAssetInAccountCustomAssets,
  isAssetHiddenInPreferences,
  isAssetIdHiddenInPreferencesMap,
} from './asset-preferences';

describe('Assets Unify State Asset Preferences', () => {
  describe('getAssetsControllerAssetPreferences', () => {
    it('returns assetPreferences from state.metamask', () => {
      const preferences = {
        'eip155:5/erc20:0xabc': { hidden: false },
      };
      const state = {
        metamask: { assetPreferences: preferences },
      };

      const result = getAssetsControllerAssetPreferences(state);

      expect(result).toBe(preferences);
    });

    it('returns empty frozen object when state.metamask is undefined', () => {
      const state = {};

      const result = getAssetsControllerAssetPreferences(state);

      expect(result).toEqual({});
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('returns empty frozen object when assetPreferences is undefined', () => {
      const state = { metamask: {} };

      const result = getAssetsControllerAssetPreferences(state);

      expect(result).toEqual({});
      expect(Object.isFrozen(result)).toBe(true);
    });
  });

  describe('getAssetsControllerCustomAssets', () => {
    it('returns customAssets from state.metamask', () => {
      const customAssets = {
        'account-1': ['eip155:5/erc20:0xabc'],
      };
      const state = {
        metamask: { customAssets },
      };

      const result = getAssetsControllerCustomAssets(state);

      expect(result).toBe(customAssets);
    });

    it('returns undefined when state.metamask is undefined', () => {
      const state = {};

      const result = getAssetsControllerCustomAssets(state);

      expect(result).toBeUndefined();
    });

    it('returns undefined when customAssets is undefined', () => {
      const state = { metamask: {} };

      const result = getAssetsControllerCustomAssets(state);

      expect(result).toBeUndefined();
    });
  });

  describe('isAssetInAccountCustomAssets', () => {
    const accountId = 'account-1';
    const assetId = 'eip155:5/erc20:0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4';

    it('returns true when assetId is in the account list (exact match)', () => {
      const customAssets = {
        [accountId]: [assetId],
      };

      expect(
        isAssetInAccountCustomAssets(customAssets, accountId, assetId),
      ).toBe(true);
    });

    it('returns true when assetId matches case-insensitively', () => {
      const customAssets = {
        [accountId]: [
          'eip155:5/erc20:0x617B3F8050A0BD94B6B1DA02B4384EE5B4DF13F4',
        ],
      };

      expect(
        isAssetInAccountCustomAssets(customAssets, accountId, assetId),
      ).toBe(true);
    });

    it('returns false when customAssets is undefined', () => {
      expect(isAssetInAccountCustomAssets(undefined, accountId, assetId)).toBe(
        false,
      );
    });

    it('returns false when account has no list', () => {
      const customAssets = { [accountId]: [] };

      expect(
        isAssetInAccountCustomAssets(customAssets, accountId, assetId),
      ).toBe(false);
    });

    it('returns false when account is missing', () => {
      const customAssets = { otherAccount: [assetId] };

      expect(
        isAssetInAccountCustomAssets(customAssets, accountId, assetId),
      ).toBe(false);
    });

    it('returns false when assetId is not in the list', () => {
      const customAssets = {
        [accountId]: ['eip155:5/erc20:0xother'],
      };

      expect(
        isAssetInAccountCustomAssets(customAssets, accountId, assetId),
      ).toBe(false);
    });
  });

  describe('isAssetIdHiddenInPreferencesMap', () => {
    it('returns true when assetId has exact key match with hidden: true', () => {
      const assetId = 'eip155:5/erc20:0xabc';
      const assetPreferences = {
        [assetId]: { hidden: true },
      };

      expect(isAssetIdHiddenInPreferencesMap(assetPreferences, assetId)).toBe(
        true,
      );
    });

    it('returns true when assetId matches case-insensitively and hidden: true', () => {
      const assetPreferences = {
        'eip155:5/erc20:0xABC': { hidden: true },
      };

      expect(
        isAssetIdHiddenInPreferencesMap(
          assetPreferences,
          'eip155:5/erc20:0xabc',
        ),
      ).toBe(true);
    });

    it('returns false when assetId has hidden: false', () => {
      const assetId = 'eip155:5/erc20:0xabc';
      const assetPreferences = {
        [assetId]: { hidden: false },
      };

      expect(isAssetIdHiddenInPreferencesMap(assetPreferences, assetId)).toBe(
        false,
      );
    });

    it('returns false when assetId is not in preferences', () => {
      const assetPreferences = {
        'eip155:5/erc20:0xother': { hidden: true },
      };

      expect(
        isAssetIdHiddenInPreferencesMap(
          assetPreferences,
          'eip155:5/erc20:0xabc',
        ),
      ).toBe(false);
    });

    it('returns false when entry has no hidden property', () => {
      const assetId = 'eip155:5/erc20:0xabc';
      const assetPreferences = {
        [assetId]: {},
      };

      expect(isAssetIdHiddenInPreferencesMap(assetPreferences, assetId)).toBe(
        false,
      );
    });
  });

  describe('isAssetHiddenInPreferences', () => {
    it('returns true when state has assetPreferences with asset hidden', () => {
      const assetId = 'eip155:5/erc20:0xabc';
      const state = {
        metamask: {
          assetPreferences: {
            [assetId]: { hidden: true },
          },
        },
      };

      expect(isAssetHiddenInPreferences(state, assetId)).toBe(true);
    });

    it('returns false when state has no assetPreferences', () => {
      const state = { metamask: {} };

      expect(
        isAssetHiddenInPreferences(
          state,
          'eip155:5/erc20:0x617b3f8050a0bd94b6b1da02b4384ee5b4df13f4',
        ),
      ).toBe(false);
    });

    it('delegates to isAssetIdHiddenInPreferencesMap with state preferences', () => {
      const assetId = 'eip155:5/erc20:0xdef';
      const state = {
        metamask: {
          assetPreferences: {
            [assetId]: { hidden: true },
          },
        },
      };

      expect(isAssetHiddenInPreferences(state, assetId)).toBe(true);
    });
  });
});
