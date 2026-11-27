import React from 'react';
import { render, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-redux';

import { mockNetworkState } from '../../../../../../test/stub/networks';
import { NFT } from '../../../../multichain/asset-picker-amount/asset-picker-modal/types';
import NftGrid from './nft-grid';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockVar = any;

jest.mock('../../../../../selectors', () => ({
  getCurrentNetwork: jest
    .fn()
    .mockReturnValue({ chainId: '0x1', nickname: 'Mainnet' }),
  getIpfsGateway: jest.fn().mockReturnValue('dweb.link'),
  getNftIsStillFetchingIndication: jest.fn(),
  getOpenSeaEnabled: jest.fn().mockReturnValue(true),
  getTestNetworkBackgroundColor: jest.fn(),
}));

jest.mock('../../../../../hooks/useFetchNftDetailsFromTokenURI', () => ({
  default: () => ({ image: '', name: '' }),
}));

describe('NftGrid', () => {
  const mockStore = configureStore([]);

  let store: ReturnType<typeof mockStore>;

  beforeEach(() => {
    store = mockStore({
      metamask: {
        ...mockNetworkState({ chainId: '0x1' }),
        ipfsGateway: 'dweb.link',
        openSeaEnabled: true,
      },
      appState: {
        isNftStillFetchingIndication: false,
      },
    });
  });

  it('matches the snapshot', () => {
    // Mock NFT data
    const mockNfts = [
      {
        tokenURI: 'fakeTokenURI_1',
        name: 'NFT 1',
      },
      {
        tokenURI: 'fakeTokenURI_2',
        name: 'NFT 2',
      },
    ];

    const { asFragment } = render(
      <Provider store={store}>
        <NftGrid
          nfts={mockNfts as MockVar}
          handleNftClick={jest.fn()}
          privacyMode={false}
        />
      </Provider>,
    );

    // Compare the rendered output to the stored snapshot
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders an NFT when image is an array', () => {
    const mockNft = {
      tokenURI: 'fakeTokenURI_1',
      name: 'NFT 1',
      image: ['https://example.com/image.jpg'],
    } as unknown as NFT;

    render(
      <Provider store={store}>
        <NftGrid nfts={[mockNft]} handleNftClick={jest.fn()} />
      </Provider>,
    );

    expect(screen.getByText('NFT 1')).toBeInTheDocument();
  });
});
