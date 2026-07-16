import { act } from '@testing-library/react-hooks';
import { AccountGroupType, AccountWalletType } from '@metamask/account-api';
import { XlmScope } from '@metamask/keyring-api';
import { errorCodes } from '@metamask/rpc-errors';
import type { CaipAssetType } from '@metamask/utils';

import { AssetType } from '../../../../shared/constants/transaction';
import { MOCK_ACCOUNT_STELLAR_PUBNET } from '../../../../test/data/mock-accounts';
import initializedMockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { getAssetsBySelectedAccountGroup } from '../../../selectors/assets';
import * as storeActions from '../../../store/actions';
import * as stellarSnapRequests from '../utils/stellar-snap-client-requests';
import { Asset } from '../types/asset';
import { useAssetActivation } from './useAssetActivation';

const PUBNET_USDC_ASSET =
  'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' as CaipAssetType;
const SEP41_ASSET_ID =
  'stellar:pubnet/sep41:CBIJBDNZNF4X35BJ4FFZWCDBSCKOP5NB4PLG4SNENRMLAPYG4P5FM6VN';
const STELLAR_WALLET_ID = 'entropy:stellar-test';
const STELLAR_GROUP_ID = 'entropy:stellar-test/0';
const EVM_SELECTED_GROUP_ID = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0';

const STELLAR_TRUSTLINE_ADD_ERROR =
  'Something went wrong while adding this trustline. Try again.';
const STELLAR_TRUSTLINE_REMOVE_ERROR =
  'Something went wrong while removing this trustline. Try again.';

describe('useAssetActivation', () => {
  const createTrustlineAsset = (overrides: Partial<Asset> = {}): Asset =>
    ({
      type: AssetType.token,
      address: PUBNET_USDC_ASSET,
      chainId: XlmScope.Pubnet,
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 7,
      image: '',
      balance: { value: '0', display: '0', fiat: '0' },
      ...overrides,
    }) as Asset;

  const createStellarState = ({
    trustlineLimit,
    includeAssetInState = true,
    selectedAccountGroup = STELLAR_GROUP_ID,
  }: {
    trustlineLimit?: string;
    includeAssetInState?: boolean;
    selectedAccountGroup?: string;
  } = {}) => ({
    ...initializedMockState,
    metamask: {
      ...initializedMockState.metamask,
      internalAccounts: {
        ...initializedMockState.metamask.internalAccounts,
        accounts: {
          ...initializedMockState.metamask.internalAccounts.accounts,
          [MOCK_ACCOUNT_STELLAR_PUBNET.id]: MOCK_ACCOUNT_STELLAR_PUBNET,
        },
      },
      accountTree: {
        ...initializedMockState.metamask.accountTree,
        wallets: {
          ...initializedMockState.metamask.accountTree.wallets,
          [STELLAR_WALLET_ID]: {
            id: STELLAR_WALLET_ID,
            type: AccountWalletType.Entropy,
            status: 'ready',
            groups: {
              [STELLAR_GROUP_ID]: {
                id: STELLAR_GROUP_ID,
                type: AccountGroupType.MultichainAccount,
                accounts: [MOCK_ACCOUNT_STELLAR_PUBNET.id],
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
      },
      selectedAccountGroup,
      accountsAssets: includeAssetInState
        ? {
            [MOCK_ACCOUNT_STELLAR_PUBNET.id]: [PUBNET_USDC_ASSET],
          }
        : {},
      assetsMetadata: includeAssetInState
        ? {
            [PUBNET_USDC_ASSET]: {
              fungible: true,
              iconUrl: '',
              symbol: 'USDC',
              name: 'USD Coin',
              units: [{ decimals: 7, symbol: 'USDC', name: 'USD Coin' }],
            },
          }
        : {},
      balances:
        includeAssetInState && trustlineLimit !== undefined
          ? {
              [MOCK_ACCOUNT_STELLAR_PUBNET.id]: {
                [PUBNET_USDC_ASSET]: {
                  amount: '0',
                  unit: 'USDC',
                  accountAssetInfo: { limit: trustlineLimit },
                },
              },
            }
          : {},
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    getAssetsBySelectedAccountGroup.memoizedResultFunc.clearCache();
    jest
      .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptAdd')
      .mockResolvedValue({ status: true });
    jest
      .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptDelete')
      .mockResolvedValue(undefined);
    jest
      .spyOn(storeActions, 'forceUpdateMetamaskState')
      .mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('canDeactivate', () => {
    it('returns false for a native asset when the asset does not require a trustline', async () => {
      const nativeAsset: Asset = {
        type: AssetType.native,
        isOriginalNativeSymbol: true,
        chainId: XlmScope.Pubnet as unknown as `0x${string}`,
        symbol: 'XLM',
        name: 'Stellar',
        decimals: 7,
        image: '',
      };

      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset: nativeAsset }),
        createStellarState(),
      );

      expect(result.current.canDeactivate).toBeFalsy();

      await act(async () => {
        await result.current.activateAsset();
        await result.current.deactivateAsset();
      });

      expect(
        stellarSnapRequests.requestStellarChangeTrustOptAdd,
      ).not.toHaveBeenCalled();
      expect(
        stellarSnapRequests.requestStellarChangeTrustOptDelete,
      ).not.toHaveBeenCalled();
    });

    it('returns false for a non-trustline token when the asset does not require a trustline', async () => {
      const asset = createTrustlineAsset({
        address: SEP41_ASSET_ID,
      });

      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset }),
        createStellarState(),
      );

      expect(result.current.canDeactivate).toBe(false);

      await act(async () => {
        await result.current.activateAsset();
        await result.current.deactivateAsset();
      });

      expect(
        stellarSnapRequests.requestStellarChangeTrustOptAdd,
      ).not.toHaveBeenCalled();
      expect(
        stellarSnapRequests.requestStellarChangeTrustOptDelete,
      ).not.toHaveBeenCalled();
    });

    it('returns false when the trustline limit is zero', () => {
      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset: createTrustlineAsset() }),
        createStellarState({ trustlineLimit: '0' }),
      );

      expect(result.current.canDeactivate).toBe(false);
    });

    it('returns false when trustline metadata is unavailable', () => {
      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset: createTrustlineAsset() }),
        createStellarState({ includeAssetInState: false }),
      );

      expect(result.current.canDeactivate).toBe(false);
    });

    it('returns true when the trustline limit is greater than zero', () => {
      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset: createTrustlineAsset() }),
        createStellarState({ trustlineLimit: '10' }),
      );

      expect(result.current.canDeactivate).toBe(true);
    });
  });

  describe('activateAsset', () => {
    it('requests trustline add and refreshes state on success', async () => {
      const asset = createTrustlineAsset();
      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset }),
        createStellarState(),
      );

      await act(async () => {
        await result.current.activateAsset();
      });

      expect(
        stellarSnapRequests.requestStellarChangeTrustOptAdd,
      ).toHaveBeenCalledWith({
        accountId: MOCK_ACCOUNT_STELLAR_PUBNET.id,
        assetId: PUBNET_USDC_ASSET,
        scope: XlmScope.Pubnet,
      });
      expect(storeActions.forceUpdateMetamaskState).toHaveBeenCalled();
      expect(result.current.isActivating).toBe(false);
      expect(result.current.errorMessage).toBeNull();
    });

    it('does not refresh state when the snap returns status false', async () => {
      jest
        .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptAdd')
        .mockResolvedValue({ status: false });

      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset: createTrustlineAsset() }),
        createStellarState(),
      );

      await act(async () => {
        await result.current.activateAsset();
      });

      expect(
        stellarSnapRequests.requestStellarChangeTrustOptAdd,
      ).toHaveBeenCalled();
      expect(storeActions.forceUpdateMetamaskState).not.toHaveBeenCalled();
    });

    it('does nothing when account is unavailable', async () => {
      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset: createTrustlineAsset() }),
        createStellarState({ selectedAccountGroup: EVM_SELECTED_GROUP_ID }),
      );

      await act(async () => {
        await result.current.activateAsset();
      });

      expect(
        stellarSnapRequests.requestStellarChangeTrustOptAdd,
      ).not.toHaveBeenCalled();
    });

    it('sets an error message when activation fails', async () => {
      jest
        .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptAdd')
        .mockRejectedValue(new Error('activation failed'));

      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset: createTrustlineAsset() }),
        createStellarState(),
      );

      await act(async () => {
        await result.current.activateAsset();
      });

      expect(result.current.errorMessage).toBe(STELLAR_TRUSTLINE_ADD_ERROR);
    });

    it('does not set an error message when the user rejects activation', async () => {
      jest
        .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptAdd')
        .mockRejectedValue({
          code: errorCodes.provider.userRejectedRequest,
        });

      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset: createTrustlineAsset() }),
        createStellarState(),
      );

      await act(async () => {
        await result.current.activateAsset();
      });

      expect(result.current.errorMessage).toBeNull();
    });
  });

  describe('deactivateAsset', () => {
    it('requests trustline delete and refreshes state on success', async () => {
      const asset = createTrustlineAsset();
      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset }),
        createStellarState({ trustlineLimit: '10' }),
      );

      await act(async () => {
        await result.current.deactivateAsset();
      });

      expect(
        stellarSnapRequests.requestStellarChangeTrustOptDelete,
      ).toHaveBeenCalledWith({
        accountId: MOCK_ACCOUNT_STELLAR_PUBNET.id,
        assetId: PUBNET_USDC_ASSET,
        scope: XlmScope.Pubnet,
      });
      expect(storeActions.forceUpdateMetamaskState).toHaveBeenCalled();
      expect(result.current.isDeactivating).toBe(false);
      expect(result.current.errorMessage).toBeNull();
    });

    it('does nothing when deactivation is not allowed', async () => {
      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset: createTrustlineAsset() }),
        createStellarState({ trustlineLimit: '0' }),
      );

      await act(async () => {
        await result.current.deactivateAsset();
      });

      expect(
        stellarSnapRequests.requestStellarChangeTrustOptDelete,
      ).not.toHaveBeenCalled();
    });

    it('does nothing when balance display is missing', async () => {
      const asset = createTrustlineAsset({ balance: undefined });

      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset }),
        createStellarState({ trustlineLimit: '10' }),
      );

      await act(async () => {
        await result.current.deactivateAsset();
      });

      expect(
        stellarSnapRequests.requestStellarChangeTrustOptDelete,
      ).not.toHaveBeenCalled();
    });

    it('sets a non-zero balance error when deactivation fails with balance', async () => {
      jest
        .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptDelete')
        .mockRejectedValue(new Error('deactivation failed'));

      const asset = createTrustlineAsset({
        balance: { value: '100', display: '1', fiat: '1' },
      });
      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset }),
        createStellarState({ trustlineLimit: '10' }),
      );

      await act(async () => {
        await result.current.deactivateAsset();
      });

      expect(result.current.errorMessage).toBe(
        'You still have 1 USDC in this wallet. You must send or swap it all before deactivating this asset on Stellar.',
      );
    });

    it('sets a generic remove error when deactivation fails with zero balance', async () => {
      jest
        .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptDelete')
        .mockRejectedValue(new Error('deactivation failed'));

      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset: createTrustlineAsset() }),
        createStellarState({ trustlineLimit: '10' }),
      );

      await act(async () => {
        await result.current.deactivateAsset();
      });

      expect(result.current.errorMessage).toBe(STELLAR_TRUSTLINE_REMOVE_ERROR);
    });

    it('does not set an error message when the user rejects deactivation', async () => {
      jest
        .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptDelete')
        .mockRejectedValue({
          code: errorCodes.provider.userRejectedRequest,
        });

      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset: createTrustlineAsset() }),
        createStellarState({ trustlineLimit: '10' }),
      );

      await act(async () => {
        await result.current.deactivateAsset();
      });

      expect(result.current.errorMessage).toBeNull();
    });
  });

  describe('dismissErrorMessage', () => {
    it('clears a previously set error message', async () => {
      jest
        .spyOn(stellarSnapRequests, 'requestStellarChangeTrustOptAdd')
        .mockRejectedValue(new Error('activation failed'));

      const { result } = renderHookWithProvider(
        () => useAssetActivation({ asset: createTrustlineAsset() }),
        createStellarState(),
      );

      await act(async () => {
        await result.current.activateAsset();
      });

      expect(result.current.errorMessage).toBe(STELLAR_TRUSTLINE_ADD_ERROR);

      act(() => {
        result.current.dismissErrorMessage();
      });

      expect(result.current.errorMessage).toBeNull();
    });
  });
});
