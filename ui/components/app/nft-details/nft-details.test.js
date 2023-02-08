import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import copyToClipboard from 'copy-to-clipboard';
import { startNewDraftTransaction } from '../../../ducks/send';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { DEFAULT_ROUTE, SEND_ROUTE } from '../../../helpers/constants/routes';
import { AssetType } from '../../../../shared/constants/transaction';
import {
  removeAndIgnoreNft,
  setRemoveCollectibleMessage,
} from '../../../store/actions';
import CollectibleDetails from './nft-details';

jest.mock('copy-to-clipboard');

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(() => ({ search: '' })),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

jest.mock('../../../ducks/send/index.js', () => ({
  ...jest.requireActual('../../../ducks/send/index.js'),
  startNewDraftTransaction: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue()),
}));

jest.mock('../../../store/actions.ts', () => ({
  ...jest.requireActual('../../../store/actions.ts'),
  checkAndUpdateSingleNftOwnershipStatus: jest.fn().mockReturnValue(jest.fn()),
  removeAndIgnoreNft: jest.fn().mockReturnValue(jest.fn()),
  setRemoveCollectibleMessage: jest.fn().mockReturnValue(jest.fn()),
}));

describe('Collectible Details', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  const collectibles =
    mockState.metamask.allNftContracts[mockState.metamask.selectedAddress][5];

  const props = {
    collectible: collectibles[5],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should match minimal props and state snapshot', () => {
    const { container } = renderWithProvider(
      <CollectibleDetails {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it(`should route to '/' route when the back button is clicked`, () => {
    const { queryByTestId } = renderWithProvider(
      <CollectibleDetails {...props} />,
      mockStore,
    );

    const backButton = queryByTestId('asset__back');

    fireEvent.click(backButton);

    expect(mockHistoryPush).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it(`should call removeAndIgnoreNft with proper collectible details and route to '/' when removing collectible`, () => {
    const { queryByTestId } = renderWithProvider(
      <CollectibleDetails {...props} />,
      mockStore,
    );

    const openOptionMenuButton = queryByTestId('collectible-options__button');
    fireEvent.click(openOptionMenuButton);

    const removeCollectibleButton = queryByTestId('collectible-item-remove');
    fireEvent.click(removeCollectibleButton);

    expect(removeAndIgnoreNft).toHaveBeenCalledWith(
      collectibles[5].address,
      collectibles[5].tokenId,
    );
    expect(setRemoveCollectibleMessage).toHaveBeenCalledWith('success');
    expect(mockHistoryPush).toHaveBeenCalledWith(DEFAULT_ROUTE);
  });

  it('should copy collectible address', async () => {
    const { queryByTestId } = renderWithProvider(
      <CollectibleDetails {...props} />,
      mockStore,
    );

    const copyAddressButton = queryByTestId('collectible-address-copy');
    fireEvent.click(copyAddressButton);

    expect(copyToClipboard).toHaveBeenCalledWith(collectibles[5].address);
  });

  it('should navigate to draft transaction send route with ERC721 data', async () => {
    const { queryByTestId } = renderWithProvider(
      <CollectibleDetails {...props} />,
      mockStore,
    );

    const collectibleSendButton = queryByTestId('collectible-send-button');
    fireEvent.click(collectibleSendButton);

    await waitFor(() => {
      expect(startNewDraftTransaction).toHaveBeenCalledWith({
        type: AssetType.NFT,
        details: collectibles[5],
      });

      expect(mockHistoryPush).toHaveBeenCalledWith(SEND_ROUTE);
    });
  });

  it('should not render send button if isCurrentlyOwned is false', () => {
    const sixthCollectibleProps = {
      collectible: collectibles[6],
    };
    collectibles[6].isCurrentlyOwned = false;

    const { queryByTestId } = renderWithProvider(
      <CollectibleDetails {...sixthCollectibleProps} />,
      mockStore,
    );

    const collectibleSendButton = queryByTestId('collectible-send-button');
    expect(collectibleSendButton).not.toBeInTheDocument();
  });

  describe(`Alternative Networks' OpenSea Links`, () => {
    it('should open opeasea link with goeli testnet chainId', async () => {
      global.platform = { openTab: jest.fn() };

      const { queryByTestId } = renderWithProvider(
        <CollectibleDetails {...props} />,
        mockStore,
      );

      const openOptionMenuButton = queryByTestId('collectible-options__button');
      fireEvent.click(openOptionMenuButton);

      const openOpenSea = queryByTestId('collectible-options__view-on-opensea');
      fireEvent.click(openOpenSea);

      await waitFor(() => {
        expect(global.platform.openTab).toHaveBeenCalledWith({
          url: `https://testnets.opensea.io/assets/${collectibles[5].address}/${collectibles[5].tokenId}`,
        });
      });
    });

    it('should open tab to mainnet opensea url with collectible info', async () => {
      global.platform = { openTab: jest.fn() };

      const mainnetState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          provider: {
            chainId: '0x1',
          },
        },
      };
      const mainnetMockStore = configureMockStore([thunk])(mainnetState);

      const { queryByTestId } = renderWithProvider(
        <CollectibleDetails {...props} />,
        mainnetMockStore,
      );

      const openOptionMenuButton = queryByTestId('collectible-options__button');
      fireEvent.click(openOptionMenuButton);

      const openOpenSea = queryByTestId('collectible-options__view-on-opensea');
      fireEvent.click(openOpenSea);

      await waitFor(() => {
        expect(global.platform.openTab).toHaveBeenCalledWith({
          url: `https://opensea.io/assets/${collectibles[5].address}/${collectibles[5].tokenId}`,
        });
      });
    });

    it('should open tab to polygon opensea url with collectible info', async () => {
      const polygonState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          provider: {
            chainId: '0x89',
          },
        },
      };
      const polygonMockStore = configureMockStore([thunk])(polygonState);

      const { queryByTestId } = renderWithProvider(
        <CollectibleDetails {...props} />,
        polygonMockStore,
      );

      const openOptionMenuButton = queryByTestId('collectible-options__button');
      fireEvent.click(openOptionMenuButton);

      const openOpenSea = queryByTestId('collectible-options__view-on-opensea');
      fireEvent.click(openOpenSea);

      await waitFor(() => {
        expect(global.platform.openTab).toHaveBeenCalledWith({
          url: `https://opensea.io/assets/matic/${collectibles[5].address}/${collectibles[5].tokenId}`,
        });
      });
    });

    it('should open tab to sepolia opensea url with collectible info', async () => {
      const sepoliaState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          provider: {
            chainId: '0xaa36a7',
          },
        },
      };
      const sepoliaMockStore = configureMockStore([thunk])(sepoliaState);

      const { queryByTestId } = renderWithProvider(
        <CollectibleDetails {...props} />,
        sepoliaMockStore,
      );

      const openOptionMenuButton = queryByTestId('collectible-options__button');
      fireEvent.click(openOptionMenuButton);

      const openOpenSea = queryByTestId('collectible-options__view-on-opensea');
      fireEvent.click(openOpenSea);

      await waitFor(() => {
        expect(global.platform.openTab).toHaveBeenCalledWith({
          url: `https://testnets.opensea.io/assets/${collectibles[5].address}/${collectibles[5].tokenId}`,
        });
      });
    });

    it('should not render opensea redirect button', async () => {
      const randomNetworkState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          provider: {
            chainId: '0x99',
          },
        },
      };
      const randomNetworkMockStore = configureMockStore([thunk])(
        randomNetworkState,
      );

      const { queryByTestId } = renderWithProvider(
        <CollectibleDetails {...props} />,
        randomNetworkMockStore,
      );

      const openOptionMenuButton = queryByTestId('collectible-options__button');
      fireEvent.click(openOptionMenuButton);

      const openOpenSea = queryByTestId('collectible-options__view-on-opensea');
      await waitFor(() => {
        expect(openOpenSea).not.toBeInTheDocument();
      });
    });
  });
});
