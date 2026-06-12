import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import * as actions from '../../../../store/actions';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { mockNetworkState } from '../../../../../test/stub/networks';
import HideTokenConfirmationModal from '.';

const mockUseNavigate = jest.fn();
const mockHideModal = jest.fn();
const mockHideToken = jest.fn().mockResolvedValue();

const mockHideAsset = jest.fn().mockReturnValue(jest.fn().mockResolvedValue());
const mockRemoveCustomAsset = jest
  .fn()
  .mockReturnValue(jest.fn().mockResolvedValue());

jest.mock('../../../../store/actions.ts', () => ({
  ...jest.requireActual('../../../../store/actions.ts'),
  hideModal: () => mockHideModal,
  hideToken: () => mockHideToken,
  ignoreTokens: jest.fn().mockReturnValue(jest.fn().mockResolvedValue()),
  hideAsset: (...args) => mockHideAsset(...args),
  removeCustomAsset: (...args) => mockRemoveCustomAsset(...args),
}));

const mockGetIsAssetsUnifyStateEnabled = jest.fn().mockReturnValue(false);
jest.mock('../../../../selectors/assets-unify-state/feature-flags', () => ({
  ...jest.requireActual(
    '../../../../selectors/assets-unify-state/feature-flags',
  ),
  getIsAssetsUnifyStateEnabled: (state) =>
    mockGetIsAssetsUnifyStateEnabled(state),
}));

describe('Hide Token Confirmation Modal', () => {
  const tokenState = {
    address: '0xTokenAddress',
    symbol: 'TKN',
    image: '',
  };

  const tokenState2 = {
    address: '0xTokenAddress2',
    symbol: 'TKN2',
    image: '',
    chainId: '0x89',
  };

  const tokenModalState = {
    ...mockState,
    appState: {
      ...mockState.appState,
      modal: {
        modalState: {
          props: {
            navigate: mockUseNavigate,
            token: tokenState,
          },
        },
      },
    },
  };

  const mockStore = configureMockStore([thunk])(tokenModalState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <HideTokenConfirmationModal />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should hide modal', () => {
    const { queryByTestId } = renderWithProvider(
      <HideTokenConfirmationModal />,
      mockStore,
    );

    const cancelButton = queryByTestId('hide-token-confirmation__cancel');

    fireEvent.click(cancelButton);

    expect(mockHideModal).toHaveBeenCalled();
  });

  it('should hide token with token address from state', () => {
    const { queryByTestId } = renderWithProvider(
      <HideTokenConfirmationModal />,
      mockStore,
    );

    const hideButton = queryByTestId('hide-token-confirmation__hide');

    fireEvent.click(hideButton);

    expect(mockHideModal).toHaveBeenCalled();
    expect(actions.ignoreTokens).toHaveBeenCalledWith({
      tokensToIgnore: tokenState.address,
      networkClientId: 'goerli',
      chainId: '0x5',
    });
  });

  it('should hide token from another chain', () => {
    const tokenModalStateWithDifferentChain = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        selectedNetworkClientId: 'bsc',
        ...mockNetworkState({ chainId: '0x89', id: 'bsc' }),
      },
      appState: {
        ...mockState.appState,
        modal: {
          modalState: {
            props: {
              navigate: mockUseNavigate,
              token: tokenState2,
            },
          },
        },
      },
    };

    const mockStoreDifferentChain = configureMockStore([thunk])(
      tokenModalStateWithDifferentChain,
    );

    const { queryByTestId } = renderWithProvider(
      <HideTokenConfirmationModal />,
      mockStoreDifferentChain,
    );

    const hideButton = queryByTestId('hide-token-confirmation__hide');

    fireEvent.click(hideButton);

    expect(mockHideModal).toHaveBeenCalled();
    expect(actions.ignoreTokens).toHaveBeenCalledWith({
      tokensToIgnore: tokenState2.address,
      networkClientId: 'bsc',
      chainId: '0x89',
    });
  });

  describe('assets unify state', () => {
    const SELECTED_ACCOUNT_ID = 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3';
    const TOKEN_ADDRESS = '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4';
    const CHAIN_ID_GOERLI = '0x5';
    // toAssetId produces CAIP-19 format with slash: chainId/assetType:reference
    const ASSET_ID_GOERLI =
      'eip155:5/erc20:0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4';

    const tokenWithValidAddress = {
      address: TOKEN_ADDRESS,
      symbol: 'TKN',
      image: '',
      chainId: CHAIN_ID_GOERLI,
    };

    const baseUnifyState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        remoteFeatureFlags: {
          ...mockState.metamask.remoteFeatureFlags,
          assetsUnifyState: {
            enabled: true,
            featureVersion: '1',
            minimumVersion: null,
          },
        },
        internalAccounts: {
          ...mockState.metamask.internalAccounts,
          accounts: {
            ...mockState.metamask.internalAccounts.accounts,
            [SELECTED_ACCOUNT_ID]: {
              ...mockState.metamask.internalAccounts.accounts[
                SELECTED_ACCOUNT_ID
              ],
              scopes: ['eip155:0', 'eip155:5'],
            },
          },
        },
      },
      appState: {
        ...mockState.appState,
        modal: {
          modalState: {
            props: {
              navigate: mockUseNavigate,
              token: tokenWithValidAddress,
            },
          },
        },
      },
    };

    beforeEach(() => {
      mockGetIsAssetsUnifyStateEnabled.mockReturnValue(true);
      mockHideAsset.mockClear();
      mockRemoveCustomAsset.mockClear();
    });

    it('dispatches removeCustomAsset when unify enabled and asset is in customAssets', async () => {
      const stateWithCustomAsset = {
        ...baseUnifyState,
        metamask: {
          ...baseUnifyState.metamask,
          customAssets: {
            [SELECTED_ACCOUNT_ID]: [ASSET_ID_GOERLI],
          },
        },
      };
      const store = configureMockStore([thunk])(stateWithCustomAsset);
      const { queryByTestId } = renderWithProvider(
        <HideTokenConfirmationModal />,
        store,
      );

      fireEvent.click(queryByTestId('hide-token-confirmation__hide'));

      await waitFor(() => {
        expect(mockRemoveCustomAsset).toHaveBeenCalledWith(
          SELECTED_ACCOUNT_ID,
          ASSET_ID_GOERLI,
        );
        expect(mockHideAsset).not.toHaveBeenCalled();
      });
    });

    it('dispatches hideAsset when unify enabled and asset is not in customAssets', async () => {
      const stateWithoutCustomAsset = {
        ...baseUnifyState,
        metamask: {
          ...baseUnifyState.metamask,
          customAssets: {},
        },
      };
      const store = configureMockStore([thunk])(stateWithoutCustomAsset);
      const { queryByTestId } = renderWithProvider(
        <HideTokenConfirmationModal />,
        store,
      );

      fireEvent.click(queryByTestId('hide-token-confirmation__hide'));

      await waitFor(() => {
        expect(mockHideAsset).toHaveBeenCalledWith(ASSET_ID_GOERLI);
        expect(mockRemoveCustomAsset).not.toHaveBeenCalled();
      });
    });
  });
});
