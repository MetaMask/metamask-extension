import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { TokenStandard } from '../../../../shared/constants/transaction';
import { NotificationDetailNft } from './notification-detail-nft';

describe('NotificationDetailNft', () => {
  const defaultProps = {
    address: '0xAddress',
    chainId: '0xaa36a7',
    image:
      'https://i.seadn.io/s/raw/files/a96f90ec8ebf55a2300c66a0c46d6a16.png?w=500&auto=format',
    name: 'NFT Name',
    standard: TokenStandard.ERC1155,
    tokenId: 'NFT ID',
  };

  it('renders the NFT image', () => {
    const store = configureStore(mockState);
    renderWithProvider(<NotificationDetailNft nft={defaultProps} />, store);
    const images = screen.getAllByRole('img');
    const nftImage = images.find(
      (img) => img.getAttribute('src') === defaultProps.image,
    );
    expect(nftImage).toBeInTheDocument();
  });
});
