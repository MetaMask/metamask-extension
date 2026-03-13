import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../store/store';
import '@testing-library/jest-dom';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
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
      alt: 'Test Alt',
      backgroundColor: 'red',
      name: 'Test NFT',
      src: 'test-src',
      networkName: 'Test Network',
      networkSrc: 'test-network-src',
      onClick: jest.fn(),
      nftImageURL: '',
    };

    it('renders correctly with an image source', () => {
      const { getByTestId } = renderWithProvider(<NftItem {...props} />, store);

      expect(getByTestId('nft-item')).toBeInTheDocument();
      expect(getByTestId('nft-network-badge')).toBeInTheDocument();
      expect(getByTestId('nft-image')).toBeInTheDocument();
      expect(getByTestId('nft-image')).toHaveAttribute('src', 'test-src');
    });

    it('renders correctly with default image when both ipfs and display Media is off and no image is provided', () => {
      const { getByTestId, queryByTestId } = renderWithProvider(
        <NftItem {...props} />,
        noDisplayMediaStore,
      );

      expect(queryByTestId('nft-image')).not.toBeInTheDocument();
      expect(getByTestId('nft-default-image')).toBeInTheDocument();
    });

    it('calls onClick when the NFT image is clicked', () => {
      const { getByTestId } = renderWithProvider(<NftItem {...props} />, store);

      fireEvent.click(getByTestId('nft-image'));
      expect(props.onClick).toHaveBeenCalled();
    });

    it('maintains proper dimensions when image fails to load', () => {
      const { getByTestId } = renderWithProvider(<NftItem {...props} />, store);
      const nftImage = getByTestId('nft-image');

      expect(nftImage).toHaveAttribute('src', 'test-src');

      fireEvent.error(nftImage);

      expect(nftImage).not.toHaveAttribute('src');
      expect(nftImage).toHaveAttribute('data-failed-src', 'test-src');

      const computedStyle = window.getComputedStyle(nftImage);
      expect(computedStyle.minHeight).toBe('150px');
    });
  });
});
