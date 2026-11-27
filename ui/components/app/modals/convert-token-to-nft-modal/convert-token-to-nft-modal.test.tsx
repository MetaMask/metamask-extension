import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { hideAsset } from '../../../../store/actions';
import { getCurrentChainId } from '../../../../../shared/lib/selectors/networks';
import { toAssetId } from '../../../../../shared/lib/asset-utils';
import ConvertTokenToNFTModal from './convert-token-to-nft-modal';

const TOKEN_ADDRESS = '0x312BE6a98441F9F6e3F6246B13CA19701e0AC3B9';
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  hideAsset: jest.fn().mockReturnValue(jest.fn().mockResolvedValue(undefined)),
}));

const mockGetNfts = jest.fn();

jest.mock('../../../../ducks/metamask/metamask', () => ({
  ...jest.requireActual('../../../../ducks/metamask/metamask'),
  getNfts: (...args: unknown[]) => mockGetNfts(...args),
}));

const renderModal = () => {
  const state = {
    ...mockState,
    appState: {
      ...mockState.appState,
      modal: {
        ...mockState.appState.modal,
        modalState: {
          name: 'CONVERT_TOKEN_TO_NFT',
          props: { tokenAddress: TOKEN_ADDRESS },
        },
      },
    },
  };
  const store = configureMockStore([thunk])(state);
  renderWithProvider(<ConvertTokenToNFTModal />, store);
  return state;
};

describe('ConvertTokenToNFTModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hides the ERC-20 asset and navigates to the NFT when it was already added as an NFT', async () => {
    mockGetNfts.mockReturnValue([{ address: TOKEN_ADDRESS, tokenId: '7' }]);

    const state = renderModal();
    fireEvent.click(screen.getByRole('button', { name: messages.yes.message }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
    const chainId = getCurrentChainId(state as never);
    expect(hideAsset).toHaveBeenCalledWith(toAssetId(TOKEN_ADDRESS, chainId));
    expect(mockNavigate).toHaveBeenCalledWith(`/asset/${TOKEN_ADDRESS}/7`);
  });

  it('does not hide the asset and routes to the import NFT page when the NFT is not yet added', async () => {
    mockGetNfts.mockReturnValue([]);

    renderModal();
    fireEvent.click(screen.getByRole('button', { name: messages.yes.message }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
    expect(hideAsset).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(expect.any(String), {
      state: { tokenAddress: TOKEN_ADDRESS, ignoreErc20Token: true },
    });
  });
});
