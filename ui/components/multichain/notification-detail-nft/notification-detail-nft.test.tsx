import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationDetailNft } from './notification-detail-nft';

describe('NotificationDetailNft', () => {
  const defaultProps = {
    badgeIcon: 'https://example.com/badge.jpg',
    nftIcon: 'https://example.com/nft.jpg',
  };

  it('renders the NFT image', () => {
    render(<NotificationDetailNft {...defaultProps} />);
    const images = screen.getAllByRole('img');
    const nftImage = images.find(
      (img) => img.getAttribute('src') === defaultProps.nftIcon,
    );
    expect(nftImage).toBeInTheDocument();
  });
});
