import React from 'react';
import configureStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { IPFS_DEFAULT_GATEWAY_URL } from '../../../../shared/constants/network';
import { NftItem } from '.';

describe('NftItem component', () => {
  const store = configureStore()(mockState);
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
      tokenId: '1',
      onClick: jest.fn(),
      isIpfsEnabled: true,
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
        <NftItem {...props} isIpfsEnabled={false} />,
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
