import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { useParams } from 'react-router-dom';
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
import {
  getAssetImageURL,
  shortenAddress,
} from '../../../../../helpers/utils/util';
import NftDetails from './nft-details';

jest.mock('../../../../../helpers/utils/util', () => ({
  getAssetImageURL: jest.fn(),
  shortenAddress: jest.fn(),
}));

jest.mock('copy-to-clipboard');

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(() => ({ search: '' })),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
  useParams: jest.fn(),
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

  it('should match minimal props and state snapshot', async () => {
    useParams.mockReturnValue({ chainId: CHAIN_IDS.GOERLI });
    getAssetImageURL.mockResolvedValue(
      'https://bafybeiclzx7zfjvuiuwobn5ip3ogc236bjqfjzoblumf4pau4ep6dqramu.ipfs.dweb.link',
    );
    shortenAddress.mockReturnValue('0xDc738...06414');

    const { container } = renderWithProvider(
      <NftDetails {...props} />,
      mockStore,
    );

    await waitFor(() => {
      expect(container).toMatchSnapshot();
    });
  });

  it(`should route to '/' route when the back button is clicked`, () => {
    useParams.mockReturnValue({ chainId: CHAIN_IDS.MAINNET });
    const { queryByTestId } = renderWithProvider(
      <NftDetails {...props} />,
      mockStore,
    );

    const backButton = queryByTestId('nft__back');

    fireEvent.click(backButton);

    expect(mockHistoryPush).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it(`should call removeAndIgnoreNFT with proper nft details and route to '/' when removing nft`, async () => {
    useParams.mockReturnValue({ chainId: CHAIN_IDS.MAINNET });
    const { queryByTestId } = renderWithProvider(
      <NftDetails {...props} />,
      mockStore,
    );

    const openOptionMenuButton = queryByTestId('nft-options__button');
    fireEvent.click(openOptionMenuButton);

    const removeNftButton = queryByTestId('nft-item-remove')?.firstChild;
    expect(removeNftButton).toBeInTheDocument();
    fireEvent.click(removeNftButton);

    await expect(removeAndIgnoreNft).toHaveBeenCalledWith(
      nfts[5].address,
      nfts[5].tokenId,
      'testNetworkConfigurationId',
    );
    expect(setRemoveNftMessage).toHaveBeenCalledWith('success');
    expect(mockHistoryPush).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it(`should call setRemoveNftMessage with error when removeAndIgnoreNft fails and route to '/'`, async () => {
    useParams.mockReturnValue({ chainId: CHAIN_IDS.MAINNET });
    const { queryByTestId } = renderWithProvider(
      <NftDetails {...props} />,
      mockStore,
    );
    removeAndIgnoreNft.mockImplementation(() => {
      throw new Error('Error');
    });

    const openOptionMenuButton = queryByTestId('nft-options__button');
    fireEvent.click(openOptionMenuButton);

    const removeNftButton = queryByTestId('nft-item-remove')?.firstChild;
    fireEvent.click(removeNftButton);

    await expect(removeAndIgnoreNft).toHaveBeenCalledWith(
      nfts[5].address,
      nfts[5].tokenId,
      'testNetworkConfigurationId',
    );
    expect(setRemoveNftMessage).toHaveBeenCalledWith('error');
    expect(mockHistoryPush).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it('should copy nft address', async () => {
    useParams.mockReturnValue({ chainId: CHAIN_IDS.MAINNET });
    const { queryByTestId } = renderWithProvider(
      <NftDetails {...props} />,
      mockStore,
    );

    const copyAddressButton = queryByTestId('nft-address-copy');
    fireEvent.click(copyAddressButton);

    expect(copyToClipboard).toHaveBeenCalledWith(nfts[5].address, COPY_OPTIONS);
  });

  it('should navigate to draft transaction send route with ERC721 data', async () => {
    useParams.mockReturnValue({ chainId: CHAIN_IDS.MAINNET });
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
        details: { ...nfts[5], tokenId: '1' },
      });

      expect(mockHistoryPush).toHaveBeenCalledWith(SEND_ROUTE);
    });
  });

  it('should not render send button if isCurrentlyOwned is false', () => {
    useParams.mockReturnValue({ chainId: CHAIN_IDS.MAINNET });
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
    useParams.mockReturnValue({ chainId: CHAIN_IDS.MAINNET });
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

  it('should render a single image if there is an array of images in an NFT', async () => {
    const images = [
      'ipfs://bafybeidgklvljyifilhtrxzh77brgnhcy6s2wxoxqc2l73zr2nxlwuxfcy',
      'ipfs://bafybeic26kitpujb3q5h5w7yovmvgmtxl3y4ldsb2pfgual5jq62emsmxq',
    ];
    const mockNft = {
      ...nfts[1],
      image: images,
    };

    getAssetImageURL.mockResolvedValue(
      'https://bafybeidgklvljyifilhtrxzh77brgnhcy6s2wxoxqc2l73zr2nxlwuxfcy.ipfs.dweb.link',
    );

    const { findByTestId } = renderWithProvider(
      <NftDetails nft={mockNft} />,
      mockStore,
    );

    // Assert - Component found
    const image = await findByTestId('nft-image');
    expect(image).toHaveAttribute(
      'src',
      'https://bafybeidgklvljyifilhtrxzh77brgnhcy6s2wxoxqc2l73zr2nxlwuxfcy.ipfs.dweb.link',
    );

    // Assert - modified correct image
    const getAssetImageCall1stParam = getAssetImageURL.mock.calls[0][0];
    expect(getAssetImageCall1stParam).toBe(images[0]);
  });

  describe(`Alternative Networks' OpenSea Links`, () => {
    it('should open opeasea link with goeli testnet chainId', async () => {
      useParams.mockReturnValue({ chainId: CHAIN_IDS.GOERLI });
      global.platform = { openTab: jest.fn() };

      const { queryByTestId } = renderWithProvider(
        <NftDetails {...props} />,
        mockStore,
      );

      const openTabSpy = jest.spyOn(global.platform, 'openTab');

      const openOptionMenuButton = queryByTestId('nft-options__button');
      fireEvent.click(openOptionMenuButton);

      const openOpenSea = queryByTestId('nft-options__view-on-opensea__button');
      fireEvent.click(openOpenSea);

      await waitFor(() => {
        expect(openTabSpy).toHaveBeenCalledWith({
          url: `https://testnets.opensea.io/assets/goerli/${nfts[5].address}/${nfts[5].tokenId}`,
        });
      });
    });

    it('should open tab to mainnet opensea url with nft info', async () => {
      useParams.mockReturnValue({ chainId: CHAIN_IDS.MAINNET });
      global.platform = { openTab: jest.fn() };

      const mainnetState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
      };
      const mainnetMockStore = configureMockStore([thunk])(mainnetState);

      const openTabSpy = jest.spyOn(global.platform, 'openTab');

      const { queryByTestId } = renderWithProvider(
        <NftDetails {...props} />,
        mainnetMockStore,
      );

      const openOptionMenuButton = queryByTestId('nft-options__button');
      fireEvent.click(openOptionMenuButton);

      const openOpenSea = queryByTestId('nft-options__view-on-opensea__button');
      fireEvent.click(openOpenSea);

      await waitFor(() => {
        expect(openTabSpy).toHaveBeenCalledWith({
          url: `https://opensea.io/assets/ethereum/${nfts[5].address}/${nfts[5].tokenId}`,
        });
      });
    });

    it('should open tab to polygon opensea url with nft info', async () => {
      useParams.mockReturnValue({ chainId: CHAIN_IDS.POLYGON });
      const polygonState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({
            chainId: CHAIN_IDS.POLYGON,
            nickname: 'polygon',
          }),
        },
      };
      const polygonMockStore = configureMockStore([thunk])(polygonState);

      const openTabSpy = jest.spyOn(global.platform, 'openTab');

      const { queryByTestId } = renderWithProvider(
        <NftDetails {...props} />,
        polygonMockStore,
      );

      const openOptionMenuButton = queryByTestId('nft-options__button');
      fireEvent.click(openOptionMenuButton);

      const openOpenSea = queryByTestId('nft-options__view-on-opensea__button');
      fireEvent.click(openOpenSea);

      await waitFor(() => {
        expect(openTabSpy).toHaveBeenCalledWith({
          url: `https://opensea.io/assets/matic/${nfts[5].address}/${nfts[5].tokenId}`,
        });
      });
    });

    it('should open tab to sepolia opensea url with nft info', async () => {
      useParams.mockReturnValue({ chainId: CHAIN_IDS.SEPOLIA });
      const sepoliaState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          ...mockNetworkState({
            chainId: CHAIN_IDS.SEPOLIA,
            nickname: 'sepolia',
          }),
        },
      };
      const sepoliaMockStore = configureMockStore([thunk])(sepoliaState);

      const openTabSpy = jest.spyOn(global.platform, 'openTab');

      const { queryByTestId } = renderWithProvider(
        <NftDetails {...props} />,
        sepoliaMockStore,
      );

      const openOptionMenuButton = queryByTestId('nft-options__button');
      fireEvent.click(openOptionMenuButton);

      const openOpenSea = queryByTestId('nft-options__view-on-opensea__button');
      fireEvent.click(openOpenSea);

      await waitFor(() => {
        expect(openTabSpy).toHaveBeenCalledWith({
          url: `https://testnets.opensea.io/assets/sepolia/${nfts[5].address}/${nfts[5].tokenId}`,
        });
      });
    });

    it('should not render opensea redirect button', async () => {
      useParams.mockReturnValue({ chainId: '0x99' });
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

      const openOpenSea = queryByTestId('nft-options__view-on-opensea__button');
      await waitFor(() => {
        expect(openOpenSea).not.toBeInTheDocument();
      });
    });
  });
});
