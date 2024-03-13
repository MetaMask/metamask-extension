import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { NotificationDetailNft } from './notification-detail-nft';

describe('NotificationDetailNft', () => {
  const defaultProps = {
    tokenSrc:
      'https://i.seadn.io/s/raw/files/a96f90ec8ebf55a2300c66a0c46d6a16.png?w=500&auto=format',
    networkSrc:
      'https://token.metaswap.codefi.network/assets/nativeCurrencyLogos/ethereum.svg',
    tokenId: 'NFT ID',
    tokenName: 'NFT Name',
    networkName: 'Ethereum',
  };

  it('renders the NFT image', () => {
    const store = configureStore(mockState);
    renderWithProvider(<NotificationDetailNft {...defaultProps} />, store);
    const images = screen.getAllByRole('img');
    const nftImage = images.find(
      (img) => img.getAttribute('src') === defaultProps.tokenSrc,
    );
    expect(nftImage).toBeInTheDocument();
  });
});
