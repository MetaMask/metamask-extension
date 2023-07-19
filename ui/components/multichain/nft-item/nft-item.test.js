import React from 'react';
import configureStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { NftItem } from '.';

describe('NftItem component', () => {
  const store = configureStore()(mockState);
  describe('render', () => {
    const props = {
      alt: 'Test Alt',
      backgroundColor: 'red',
      name: 'Test NFT',
      src: 'test-src',
      networkName: 'Test Network',
      networkSrc: 'test-network-src',
      tokenId: '1',
      onClick: jest.fn(),
    };

    it('renders correctly with an image source', () => {
      const { getByTestId } = renderWithProvider(<NftItem {...props} />, store);

      expect(getByTestId('nft-item')).toBeInTheDocument();
      expect(getByTestId('nft-network-badge')).toBeInTheDocument();
      expect(getByTestId('nft-image')).toBeInTheDocument();
      expect(getByTestId('nft-image')).toHaveAttribute('src', 'test-src');
    });

    it('renders correctly with default image when no image source is provided', () => {
      const { getByTestId, queryByTestId } = renderWithProvider(
        <NftItem {...props} src="" />,
        store,
      );

      expect(queryByTestId('nft-image')).not.toBeInTheDocument();
      expect(getByTestId('nft-default-image')).toBeInTheDocument();
    });

    it('calls onClick when the NFT image is clicked', () => {
      const { getByTestId } = renderWithProvider(<NftItem {...props} />, store);

      fireEvent.click(getByTestId('nft-image'));
      expect(props.onClick).toHaveBeenCalled();
    });
  });
});
