import React from 'react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import nock from 'nock';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { AssetPickerModalNftTab } from './asset-picker-modal-nft-tab';

jest.mock('../../../../hooks/useGetAssetImageUrl', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => 'mock-image-url.png',
}));

const defaultProps = {
  searchQuery: '',
  onClose: jest.fn(),
  renderSearch: jest.fn(),
};

const mockAccount = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

const mockNfts = {
  [mockAccount]: {
    [CHAIN_IDS.LINEA_MAINNET]: [
      {
        address: '0x123',
        attributes: [{ key: 'test', value: 'test', kind: 'string' }],
        image: 'mock-image.png',
        name: 'Mock NFT #1',
        standard: 'ERC721',
        tokenId: '1',
        isCurrentlyOwned: true,
        tokenURI: 'https://mock.api/token/1',
        chainId: CHAIN_IDS.LINEA_MAINNET,
      },
      {
        address: '0x123',
        attributes: [{ key: 'test', value: 'test', kind: 'string' }],
        image: 'mock-image.png',
        name: 'Mock NFT #3',
        standard: 'ERC721',
        tokenId: '3',
        isCurrentlyOwned: true,
        tokenURI: 'https://mock.api/token/3',
        chainId: CHAIN_IDS.LINEA_MAINNET,
      },
    ],
    [CHAIN_IDS.MAINNET]: [
      {
        address: '0x123',
        attributes: [{ key: 'test', value: 'test', kind: 'string' }],
        image: 'mock-image.png',
        name: 'Mock NFT #2',
        standard: 'ERC721',
        tokenId: '2',
        isCurrentlyOwned: true,
        tokenURI: 'https://mock.api/token/2',
        chainId: CHAIN_IDS.MAINNET,
      },
    ],
  },
};

const mockStore = configureStore([thunk]);

describe('AssetPickerModalNftTab', () => {
  beforeEach(() => {
    nock('https://mock.api')
      .get('/token/1')
      .reply(200, { name: 'Mock NFT #1' })
      .get('/token/2')
      .reply(200, { name: 'Mock NFT #2' })
      .get('/token/3')
      .reply(200, { name: 'Mock NFT #3' });
  });

  afterEach(() => {
    nock.cleanAll();
    jest.clearAllMocks();
  });

  it('renders modal with mainnet NFTs when mainnet is selected', () => {
    const mainnetStore = mockStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        allNfts: mockNfts,
        enabledNetworkMap: {
          eip155: {
            [CHAIN_IDS.MAINNET]: true,
          },
        },
      },
    });
    const { getByText, getAllByTestId } = renderWithProvider(
      <AssetPickerModalNftTab {...defaultProps} />,
      mainnetStore,
    );

    const nftItems = getAllByTestId('nft-item');

    const expectedNftItemTitle = getByText('Mock NFT #2');

    expect(nftItems).toHaveLength(1);
    expect(expectedNftItemTitle).toBeInTheDocument();
  });

  it('renders modal with Linea network NFTs when Linea is selected', () => {
    const lineaStore = mockStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        ...mockNetworkState({ chainId: CHAIN_IDS.LINEA_MAINNET }),
        allNfts: mockNfts,
        enabledNetworkMap: {
          eip155: {
            [CHAIN_IDS.LINEA_MAINNET]: true,
          },
        },
      },
    });

    const { getAllByTestId } = renderWithProvider(
      <AssetPickerModalNftTab {...defaultProps} />,
      lineaStore,
    );

    const nftItems = getAllByTestId('nft-item');
    expect(nftItems).toHaveLength(2);
  });
});
