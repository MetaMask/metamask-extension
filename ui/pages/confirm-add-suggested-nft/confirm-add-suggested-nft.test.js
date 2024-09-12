import React from 'react';
import { act } from 'react-dom/test-utils';
import { fireEvent, screen } from '@testing-library/react';
import { ApprovalType } from '@metamask/controller-utils';
import {
  resolvePendingApproval,
  rejectPendingApproval,
} from '../../store/actions';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../test/jest/rendering';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { mockNetworkState } from '../../../test/stub/networks';
import ConfirmAddSuggestedNFT from '.';

const PENDING_NFT_APPROVALS = {
  1: {
    id: '1',
    origin: 'https://www.opensea.io',
    time: 1,
    type: ApprovalType.WatchAsset,
    requestData: {
      asset: {
        address: '0x8b175474e89094c44da98b954eedeac495271d0a',
        name: 'CryptoKitty',
        tokenId: '15',
        standard: 'ERC721',
        image: 'https://www.cryptokitties.com/images/kitty-eth.svg',
      },
    },
  },
  2: {
    id: '2',
    origin: 'https://www.nft-collector.io',
    time: 1,
    type: ApprovalType.WatchAsset,
    requestData: {
      asset: {
        address: '0xC8c77482e45F1F44dE1745F52C74426C631bDD51',
        name: 'Legends of the Dance Floor',
        tokenId: '1',
        standard: 'ERC721',
        image:
          'https://www.nft-collector.io/images/legends-of-the-dance-floor.png',
      },
    },
  },
};

const PENDING_TOKEN_APPROVALS = {
  3: {
    id: '3',
    origin: 'https://www.uniswap.io',
    time: 2,
    type: ApprovalType.WatchAsset,
    requestData: {
      asset: {
        address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        symbol: 'UNI',
        decimals: '18',
      },
    },
  },
};

jest.mock('../../store/actions', () => ({
  resolvePendingApproval: jest.fn().mockReturnValue({ type: 'test' }),
  rejectPendingApproval: jest.fn().mockReturnValue({ type: 'test' }),
}));

const renderComponent = (pendingNfts = {}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      pendingApprovals: pendingNfts,
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
    },
    history: {
      mostRecentOverviewPage: '/',
    },
  });
  return renderWithProvider(<ConfirmAddSuggestedNFT />, store);
};

describe('ConfirmAddSuggestedNFT Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render one suggested NFT', () => {
    renderComponent({
      1: {
        id: '1',
        origin: 'https://www.opensea.io',
        time: 1,
        type: ApprovalType.WatchAsset,
        requestData: {
          asset: {
            address: '0x8b175474e89094c44da98b954eedeac495271d0a',
            name: 'CryptoKitty',
            tokenId: '15',
            standard: 'ERC721',
          },
        },
      },
    });

    expect(screen.getByText('Add suggested NFTs')).toBeInTheDocument();
    expect(screen.getByText('https://www.opensea.io')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This allows the following asset to be added to your wallet.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('CryptoKitty')).toBeInTheDocument();
    expect(screen.getByText('#15')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add NFT' })).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const container = renderComponent({
      1: {
        id: '1',
        origin: 'https://www.opensea.io',
        time: 1,
        type: ApprovalType.WatchAsset,
        requestData: {
          asset: {
            address: '0x8b175474e89094c44da98b954eedeac495271d0a',
            name: 'CryptoKitty',
            tokenId: '15',
            standard: 'ERC721',
          },
        },
      },
    });

    expect(container).toMatchSnapshot();
  });

  it('should render a list of suggested NFTs', () => {
    renderComponent({ ...PENDING_NFT_APPROVALS, ...PENDING_TOKEN_APPROVALS });

    for (const {
      requestData: { asset },
    } of Object.values(PENDING_NFT_APPROVALS)) {
      expect(screen.getByText(asset.name)).toBeInTheDocument();
      expect(screen.getByText(`#${asset.tokenId}`)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('img')).toHaveLength(
      Object.values(PENDING_NFT_APPROVALS).length + 1,
    );
  });

  it('should dispatch resolvePendingApproval when clicking the "Add NFTs" button', async () => {
    renderComponent(PENDING_NFT_APPROVALS);
    const addNftButton = screen.getByRole('button', { name: 'Add NFTs' });

    await act(async () => {
      fireEvent.click(addNftButton);
    });

    expect(resolvePendingApproval).toHaveBeenCalledTimes(
      Object.values(PENDING_NFT_APPROVALS).length,
    );

    Object.values(PENDING_NFT_APPROVALS).forEach(({ id }) => {
      expect(resolvePendingApproval).toHaveBeenCalledWith(id, null);
    });
  });

  it('should dispatch rejectPendingApproval when clicking the "Cancel" button', async () => {
    renderComponent(PENDING_NFT_APPROVALS);
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });

    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    expect(rejectPendingApproval).toHaveBeenCalledTimes(
      Object.values(PENDING_NFT_APPROVALS).length,
    );

    Object.values(PENDING_NFT_APPROVALS).forEach(({ id }) => {
      expect(rejectPendingApproval).toHaveBeenCalledWith(
        id,
        expect.objectContaining({
          code: 4001,
          message: 'User rejected the request.',
          stack: expect.any(String),
        }),
      );
    });
  });

  it('should allow users to remove individual NFTs from the list of NFTs to add', async () => {
    renderComponent(PENDING_NFT_APPROVALS);

    const idToRemove = Object.values(PENDING_NFT_APPROVALS)[0].id;
    const removeBtn = screen.getByTestId(
      `confirm-add-suggested-nft__nft-remove-${idToRemove}`,
    );
    await act(async () => {
      fireEvent.click(removeBtn);
    });

    expect(rejectPendingApproval).toHaveBeenCalledTimes(1);
    expect(rejectPendingApproval).toHaveBeenCalledWith(
      idToRemove,
      expect.objectContaining({
        code: 4001,
        message: 'User rejected the request.',
        stack: expect.any(String),
      }),
    );
  });
});
