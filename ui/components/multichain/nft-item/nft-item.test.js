import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { NftItem } from '.';

describe('NftItem component', () => {
  const mockOnClick = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with an image source', () => {
    const { getByTestId } = render(
      <NftItem
        alt="Test Alt"
        backgroundColor="red"
        name="Test NFT"
        src="test-src"
        networkName="Test Network"
        networkSrc="test-network-src"
        tokenId="1"
        onClick={mockOnClick}
      />,
    );

    expect(getByTestId('nft-item')).toBeInTheDocument();
    expect(getByTestId('nft-network-badge')).toBeInTheDocument();
    expect(getByTestId('nft-image')).toBeInTheDocument();
    expect(getByTestId('nft-image')).toHaveAttribute('src', 'test-src');
  });

  it('renders correctly with default image when no image source is provided', () => {
    const { getByTestId, queryByTestId } = render(
      <NftItem
        alt="Test Alt"
        backgroundColor="red"
        name="Test NFT"
        src=""
        networkName="Test Network"
        networkSrc="test-network-src"
        tokenId="1"
        onClick={mockOnClick}
      />,
    );

    expect(getByTestId('nft-item')).toBeInTheDocument();
    expect(getByTestId('nft-network-badge')).toBeInTheDocument();
    expect(queryByTestId('nft-image')).not.toBeInTheDocument();
    expect(getByTestId('nft-default-image')).toBeInTheDocument();
  });

  it('calls onClick when the NFT image is clicked', () => {
    const { getByTestId } = render(
      <NftItem
        alt="Test Alt"
        backgroundColor="red"
        name="Test NFT"
        src="test-src"
        networkName="Test Network"
        networkSrc="test-network-src"
        tokenId="1"
        onClick={mockOnClick}
      />,
    );

    fireEvent.click(getByTestId('nft-image'));
    expect(mockOnClick).toHaveBeenCalled();
  });
});
