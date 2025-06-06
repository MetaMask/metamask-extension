import { SolScope } from '@metamask/keyring-api';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import {
  sendMultichainTransaction,
  setDefaultHomeActiveTabName,
} from '../../../../store/actions';
import { SOLANA_WALLET_SNAP_ID } from '../../../../../shared/lib/accounts/solana-wallet-snap';
import { CONFIRMATION_V_NEXT_ROUTE } from '../../../../helpers/constants/routes';
import { mockMultichainNetworkState } from '../../../../../test/stub/networks';
import { useHandleSendNonEvm } from './useHandleSendNonEvm';

jest.mock('../../../../store/actions', () => ({
  sendMultichainTransaction: jest.fn(),
  setDefaultHomeActiveTabName: jest.fn(),
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

const mockHistory = {
  push: jest.fn(),
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => mockHistory,
}));

const mockState = {
  metamask: {
    ...mockMultichainNetworkState(),
    internalAccounts: {
      accounts: {
        '5132883f-598e-482c-a02b-84eeaa352f5b': {
          id: '5132883f-598e-482c-a02b-84eeaa352f5b',
          address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
          type: 'solana:data-account',
          metadata: {
            snap: {
              id: SOLANA_WALLET_SNAP_ID,
            },
          },
        },
      },
      selectedAccount: '5132883f-598e-482c-a02b-84eeaa352f5b',
    },
    accountsAssets: {
      '5132883f-598e-482c-a02b-84eeaa352f5b': [
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      ],
    },
    networkConfigurationsByChainId: {},
    completedOnboarding: true,
    pendingApprovals: [
      {
        id: '1',
        type: 'snap_dialog',
        origin: SOLANA_WALLET_SNAP_ID,
        requestData: {},
      },
    ],
    defaultHomeActiveTabName: 'activity',
    selectedMultichainNetworkChainId: SolScope.Mainnet,
    isEvmSelected: false,
    remoteFeatureFlags: {
      addSolanaAccount: true,
      addBitcoinAccount: true,
    },
  },
};

describe('useHandleSendNonEvm', () => {
  it('throws an error if the selected account has no snap metadata', async () => {
    const mockStateWithoutSnapMetadata = {
      metamask: {
        ...mockState.metamask,
        internalAccounts: {
          accounts: {
            '5132883f-598e-482c-a02b-84eeaa352f5b': {
              id: '5132883f-598e-482c-a02b-84eeaa352f5b',
              address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
              type: 'solana:data-account',
              metadata: {}, // No snap metadata
            },
          },
          selectedAccount: '5132883f-598e-482c-a02b-84eeaa352f5b',
        },
      },
    };
    const { result } = renderHookWithProvider(
      () => useHandleSendNonEvm(),
      mockStateWithoutSnapMetadata,
    );
    const handleSendNonEvm = result.current;

    await expect(handleSendNonEvm()).rejects.toThrow(
      'Non-EVM needs to be Snap accounts',
    );
  });

  it('throws an error if the selected account is not a Snap account', async () => {
    const mockStateWithoutSnapMetadata = {
      metamask: {
        ...mockState.metamask,
        internalAccounts: {
          accounts: {
            '5132883f-598e-482c-a02b-84eeaa352f5b': {
              id: '5132883f-598e-482c-a02b-84eeaa352f5b',
              address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
              type: 'solana:data-account',
              metadata: {
                snap: {
                  id: 'some-wrong-id',
                },
              },
            },
          },
          selectedAccount: '5132883f-598e-482c-a02b-84eeaa352f5b',
        },
      },
    };
    const { result } = renderHookWithProvider(
      () => useHandleSendNonEvm(),
      mockStateWithoutSnapMetadata,
    );
    const handleSendNonEvm = result.current;

    await expect(handleSendNonEvm()).rejects.toThrow(
      'Non-EVM Snap is not whitelisted: some-wrong-id',
    );
  });

  it('restores the previous tab in case of error with the snap', async () => {
    (sendMultichainTransaction as jest.Mock).mockRejectedValue(
      new Error('Error'),
    );
    const { result } = renderHookWithProvider(
      () => useHandleSendNonEvm(),
      mockState,
    );
    const handleSendNonEvm = result.current;

    await handleSendNonEvm();

    expect(setDefaultHomeActiveTabName).toHaveBeenCalledWith('activity');
  });

  describe('when a caipAssetType is provided', () => {
    it('returns the caipAssetType', async () => {
      const { result } = renderHookWithProvider(
        () =>
          useHandleSendNonEvm(
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          ),
        mockState,
      );
      const handleSendNonEvm = result.current;

      await handleSendNonEvm();

      expect(sendMultichainTransaction).toHaveBeenCalledWith(
        SOLANA_WALLET_SNAP_ID,
        {
          account: '5132883f-598e-482c-a02b-84eeaa352f5b',
          scope: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          assetType:
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },
      );
    });

    it('pushes the confirmation page in history', async () => {
      const { result } = renderHookWithProvider(
        () =>
          useHandleSendNonEvm(
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          ),
        mockState,
      );
      const handleSendNonEvm = result.current;

      await handleSendNonEvm();

      expect(mockHistory.push).toHaveBeenCalledWith(
        `${CONFIRMATION_V_NEXT_ROUTE}/${mockState.metamask.pendingApprovals[0].id}`,
      );
    });
  });

  describe('when a caipAssetType is not provided', () => {
    describe('and the selected account has a native asset', () => {
      it("returns the chain's native asset", async () => {
        const { result } = renderHookWithProvider(
          () => useHandleSendNonEvm(),
          mockState,
        );
        const handleSendNonEvm = result.current;

        await handleSendNonEvm();

        expect(sendMultichainTransaction).toHaveBeenCalledWith(
          SOLANA_WALLET_SNAP_ID,
          {
            account: '5132883f-598e-482c-a02b-84eeaa352f5b',
            scope: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
            assetType: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
          },
        );
      });

      it('pushes the confirmation page in history', async () => {
        const { result } = renderHookWithProvider(
          () => useHandleSendNonEvm(),
          mockState,
        );
        const handleSendNonEvm = result.current;

        await handleSendNonEvm();

        expect(mockHistory.push).toHaveBeenCalledWith(
          `${CONFIRMATION_V_NEXT_ROUTE}/${mockState.metamask.pendingApprovals[0].id}`,
        );
      });
    });

    describe('and the selected account has no native asset', () => {
      it('throws an error', async () => {
        const mockStateWithoutNativeAsset = {
          metamask: {
            ...mockState.metamask,
            accountsAssets: {
              '5132883f-598e-482c-a02b-84eeaa352f5b': [
                // No native asset
                'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
              ],
            },
            multichainNetworkConfigurationsByChainId: {
              ...mockState.metamask.multichainNetworkConfigurationsByChainId,
              [SolScope.Mainnet]: {
                chainId: SolScope.Mainnet,
                name: 'Solana',
                // Intentionally omit attribute to force error
                // nativeCurrency: `${SolScope.Mainnet}/slip44:501`,
                isEvm: false,
              },
            },
          },
        };
        const { result } = renderHookWithProvider(
          () => useHandleSendNonEvm(),
          mockStateWithoutNativeAsset,
        );
        const handleSendNonEvm = result.current;

        await expect(handleSendNonEvm()).rejects.toThrow(
          'No CAIP asset type provided, and could not find a fallback native asset for the selected account',
        );
      });
    });
  });
});
