import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureStore from '../../../store/store';
import '@testing-library/jest-dom/extend-expect';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { NftItem } from '.';

const store = configureStore(mockState);

const noDisplayMediaStore = configureStore({
  metamask: {
    ...mockState.metamask,
    ipfsGateway: '',
    openSeaEnabled: false,
  },
});

describe('NftItem component', () => {
  jest.mock('../../../store/actions.ts', () => ({
    getTokenStandardAndDetails: jest.fn().mockResolvedValue(),
  }));
  describe('render', () => {
    const props = {
      onClick: jest.fn(),
      nft: {
        address: '0xAddress',
        chainId: '0xaa36a7',
        image: 'test-src',
        name: 'Test NFT',
        standard: TokenStandard.ERC721,
        tokenId: 'NFT ID',
      },
    };

    it('renders correctly with an image source', async () => {
      const { getByTestId } = renderWithProvider(<NftItem {...props} />, store);

      await waitFor(() => {
        expect(getByTestId('nft-item')).toBeInTheDocument();
        expect(getByTestId('nft-network-badge')).toBeInTheDocument();
        expect(getByTestId('nft-image')).toBeInTheDocument();
        expect(getByTestId('nft-image')).toHaveAttribute('src', 'test-src');
      });
    });

    it('renders correctly with default image when both ipfs and display Media is off and no image is provided', async () => {
      const { getByTestId, queryByTestId } = renderWithProvider(
        <NftItem {...props} />,
        noDisplayMediaStore,
      );
      await waitFor(() => {
        expect(queryByTestId('nft-image')).not.toBeInTheDocument();
        expect(getByTestId('nft-default-image')).toBeInTheDocument();
      });
    });

    it('calls onClick when the NFT image is clicked', async () => {
      const { getByTestId, queryByTestId } = renderWithProvider(
        <NftItem {...props} />,
        store,
      );

      await waitFor(() => {
        expect(queryByTestId('nft-image')).toBeInTheDocument();
      });

      fireEvent.click(getByTestId('nft-image'));
      expect(props.onClick).toHaveBeenCalled();
    });
  });
});
