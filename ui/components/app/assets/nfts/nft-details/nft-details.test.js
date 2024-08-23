import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import copyToClipboard from 'copy-to-clipboard';
import { toHex } from '@metamask/controller-utils';
import { startNewDraftTransaction } from '../../../../../ducks/send';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import {
  DEFAULT_ROUTE,
  SEND_ROUTE,
} from '../../../../../helpers/constants/routes';
import { COPY_OPTIONS } from '../../../../../../shared/constants/copy';
import { AssetType } from '../../../../../../shared/constants/transaction';
import {
  removeAndIgnoreNft,
  setRemoveNftMessage,
} from '../../../../../store/actions';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { mockNetworkState } from '../../../../../../test/stub/networks';
import NftDetails from './nft-details';

jest.mock('copy-to-clipboard');

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(() => ({ search: '' })),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

jest.mock('../../../../../ducks/send/index.js', () => ({
  ...jest.requireActual('../../../../../ducks/send/index.js'),
  startNewDraftTransaction: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue()),
}));

jest.mock('../../../../../store/actions.ts', () => ({
  ...jest.requireActual('../../../../../store/actions.ts'),
  checkAndUpdateSingleNftOwnershipStatus: jest.fn().mockReturnValue(jest.fn()),
  removeAndIgnoreNft: jest.fn().mockReturnValue(jest.fn()),
  setRemoveNftMessage: jest.fn().mockReturnValue(jest.fn()),
}));

describe('NFT Details', () => {
  const mockStore = configureMockStore([thunk])(mockState);
  const selectedAddress =
    mockState.metamask.internalAccounts.accounts[
      mockState.metamask.internalAccounts.selectedAccount
    ].address;
  const nfts = mockState.metamask.allNfts[selectedAddress][toHex(5)];

  const props = {
    nft: nfts[5],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should match minimal props and state snapshot', () => {
    const { container } = renderWithProvider(
      <NftDetails {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it(`should route to '/' route when the back button is clicked`, () => {
    const { queryByTestId } = renderWithProvider(
      <NftDetails {...props} />,
      mockStore,
    );

    const backButton = queryByTestId('nft__back');

    fireEvent.click(backButton);

    expect(mockHistoryPush).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it(`should call removeAndIgnoreNFT with proper nft details and route to '/' when removing nft`, async () => {
    const { queryByTestId } = renderWithProvider(
      <NftDetails {...props} />,
      mockStore,
    );

    const openOptionMenuButton = queryByTestId('nft-options__button');
    fireEvent.click(openOptionMenuButton);

    const removeNftButton = queryByTestId('nft-item-remove');
    fireEvent.click(removeNftButton);

    await expect(removeAndIgnoreNft).toHaveBeenCalledWith(
      nfts[5].address,
      nfts[5].tokenId,
    );
    expect(setRemoveNftMessage).toHaveBeenCalledWith('success');
    expect(mockHistoryPush).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it(`should call setRemoveNftMessage with error when removeAndIgnoreNft fails and route to '/'`, async () => {
    const { queryByTestId } = renderWithProvider(
      <NftDetails {...props} />,
      mockStore,
    );
    removeAndIgnoreNft.mockImplementation(() => {
      throw new Error('Error');
    });

    const openOptionMenuButton = queryByTestId('nft-options__button');
    fireEvent.click(openOptionMenuButton);

    const removeNftButton = queryByTestId('nft-item-remove');
    fireEvent.click(removeNftButton);

    await expect(removeAndIgnoreNft).toHaveBeenCalledWith(
      nfts[5].address,
      nfts[5].tokenId,
    );
    expect(setRemoveNftMessage).toHaveBeenCalledWith('error');
    expect(mockHistoryPush).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it('should copy nft address', async () => {
    const { queryByTestId } = renderWithProvider(
      <NftDetails {...props} />,
      mockStore,
    );

    const copyAddressButton = queryByTestId('nft-address-copy');
    fireEvent.click(copyAddressButton);

    expect(copyToClipboard).toHaveBeenCalledWith(nfts[5].address, COPY_OPTIONS);
  });

  it('should navigate to draft transaction send route with ERC721 data', async () => {
    const nftProps = {
      nft: nfts[5],
    };
    nfts[5].isCurrentlyOwned = true;
    const { queryByTestId } = renderWithProvider(
      <NftDetails {...nftProps} />,
      mockStore,
    );

    const nftSendButton = queryByTestId('nft-send-button');
    fireEvent.click(nftSendButton);

    await waitFor(() => {
      expect(startNewDraftTransaction).toHaveBeenCalledWith({
        type: AssetType.NFT,
        details: { ...nfts[5], tokenId: 1 },
      });

      expect(mockHistoryPush).toHaveBeenCalledWith(SEND_ROUTE);
    });
  });

  it('should not render send button if isCurrentlyOwned is false', () => {
    const sixthNftProps = {
      nft: nfts[6],
    };
    nfts[6].isCurrentlyOwned = false;

    const { queryByTestId } = renderWithProvider(
      <NftDetails {...sixthNftProps} />,
      mockStore,
    );

    const nftSendButton = queryByTestId('nft-send-button');
    expect(nftSendButton).not.toBeInTheDocument();
  });

  it('should render send button if it is an ERC1155', () => {
    const nftProps = {
      nft: nfts[1],
    };
    nfts[1].isCurrentlyOwned = true;
    const { queryByTestId } = renderWithProvider(
      <NftDetails {...nftProps} />,
      mockStore,
    );

    const nftSendButton = queryByTestId('nft-send-button');

    expect(nftSendButton).not.toBeDisabled();
  });

  describe(`Alternative Networks' OpenSea Links`, () => {
    it('should open opeasea link with goeli testnet chainId', async () => {
      global.platform = { openTab: jest.fn() };

      const { queryByTestId } = renderWithProvider(
        <NftDetails {...props} />,
        mockStore,
      );

      const openOptionMenuButton = queryByTestId('nft-options__button');
      fireEvent.click(openOptionMenuButton);

      const openOpenSea = queryByTestId('nft-options__view-on-opensea');
      fireEvent.click(openOpenSea);

      await waitFor(() => {
        expect(global.platform.openTab).toHaveBeenCalledWith({
          url: `https://testnets.opensea.io/assets/goerli/${nfts[5].address}/${nfts[5].tokenId}`,
        });
      });
    });

    it('should open tab to mainnet opensea url with nft info', async () => {
      global.platform = { openTab: jest.fn() };

      const mainnetState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
      };
      const mainnetMockStore = configureMockStore([thunk])(mainnetState);

      const { queryByTestId } = renderWithProvider(
        <NftDetails {...props} />,
        mainnetMockStore,
      );

      const openOptionMenuButton = queryByTestId('nft-options__button');
      fireEvent.click(openOptionMenuButton);

      const openOpenSea = queryByTestId('nft-options__view-on-opensea');
      fireEvent.click(openOpenSea);

      await waitFor(() => {
        expect(global.platform.openTab).toHaveBeenCalledWith({
          url: `https://opensea.io/assets/ethereum/${nfts[5].address}/${nfts[5].tokenId}`,
        });
      });
    });

    it('should open tab to polygon opensea url with nft info', async () => {
      const polygonState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.POLYGON }),
        },
      };
      const polygonMockStore = configureMockStore([thunk])(polygonState);

      const { queryByTestId } = renderWithProvider(
        <NftDetails {...props} />,
        polygonMockStore,
      );

      const openOptionMenuButton = queryByTestId('nft-options__button');
      fireEvent.click(openOptionMenuButton);

      const openOpenSea = queryByTestId('nft-options__view-on-opensea');
      fireEvent.click(openOpenSea);

      await waitFor(() => {
        expect(global.platform.openTab).toHaveBeenCalledWith({
          url: `https://opensea.io/assets/matic/${nfts[5].address}/${nfts[5].tokenId}`,
        });
      });
    });

    it('should open tab to sepolia opensea url with nft info', async () => {
      const sepoliaState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.SEPOLIA }),
        },
      };
      const sepoliaMockStore = configureMockStore([thunk])(sepoliaState);

      const { queryByTestId } = renderWithProvider(
        <NftDetails {...props} />,
        sepoliaMockStore,
      );

      const openOptionMenuButton = queryByTestId('nft-options__button');
      fireEvent.click(openOptionMenuButton);

      const openOpenSea = queryByTestId('nft-options__view-on-opensea');
      fireEvent.click(openOpenSea);

      await waitFor(() => {
        expect(global.platform.openTab).toHaveBeenCalledWith({
          url: `https://testnets.opensea.io/assets/sepolia/${nfts[5].address}/${nfts[5].tokenId}`,
        });
      });
    });

    it('should not render opensea redirect button', async () => {
      const randomNetworkState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({ chainId: '0x99' }),
        },
      };
      const randomNetworkMockStore = configureMockStore([thunk])(
        randomNetworkState,
      );

      const { queryByTestId } = renderWithProvider(
        <NftDetails {...props} />,
        randomNetworkMockStore,
      );

      const openOptionMenuButton = queryByTestId('nft-options__button');
      fireEvent.click(openOptionMenuButton);

      const openOpenSea = queryByTestId('nft-options__view-on-opensea');
      await waitFor(() => {
        expect(openOpenSea).not.toBeInTheDocument();
      });
    });
  });
});
