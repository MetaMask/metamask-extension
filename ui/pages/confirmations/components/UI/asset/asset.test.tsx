import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import { AssetStandard } from '../../../types/send';
import { Asset } from './asset';

const mockTokenAsset = {
  name: 'Test Token',
  symbol: 'TEST',
  standard: AssetStandard.ERC20,
  balanceInSelectedCurrency: '$100.00',
  shortenedBalance: '10.5',
  chainId: '0x1',
  image: 'https://example.com/token.png',
  networkName: 'Ethereum',
  networkImage: 'https://example.com/eth.png',
};

const mockNFTERC721Asset = {
  name: 'Test NFT',
  standard: AssetStandard.ERC721,
  tokenId: '123',
  chainId: '0x1',
  image: 'https://example.com/nft.png',
  networkName: 'Ethereum',
  networkImage: 'https://example.com/eth.png',
  collection: {
    name: 'Test Collection',
    imageUrl: 'https://example.com/collection.png',
  },
};

const mockNFTERC1155Asset = {
  name: 'Test NFT 1155',
  standard: AssetStandard.ERC1155,
  tokenId: '456',
  balance: '3',
  chainId: '0x1',
  image: 'https://example.com/nft1155.png',
  networkName: 'Ethereum',
  networkImage: 'https://example.com/eth.png',
  collection: {
    name: 'Test Collection 1155',
    imageUrl: 'https://example.com/collection1155.png',
  },
};

describe('TokenAsset', () => {
  it('renders token asset with correct information', () => {
    const { getByText, getByTestId } = render(<Asset asset={mockTokenAsset} />);

    expect(getByTestId('token-asset')).toBeInTheDocument();
    expect(getByText('Test Token')).toBeInTheDocument();
    expect(getByText('TEST')).toBeInTheDocument();
    expect(getByText('$100.00')).toBeInTheDocument();
    expect(getByText('10.5 TEST')).toBeInTheDocument();
  });

  it('calls onClick when token asset is clicked', () => {
    const mockOnClick = jest.fn();
    const { getByTestId } = render(
      <Asset asset={mockTokenAsset} onClick={mockOnClick} />,
    );

    fireEvent.click(getByTestId('token-asset'));
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('applies selected background when token asset is selected', () => {
    const { getByTestId } = render(
      <Asset asset={mockTokenAsset} isSelected={true} />,
    );

    const tokenAsset = getByTestId('token-asset');
    expect(tokenAsset).toHaveStyle(
      'background-color: var(--color-background-hover)',
    );
  });

  it('renders token asset without network badge when chainId is not provided', () => {
    const assetWithoutChainId = { ...mockTokenAsset, chainId: undefined };
    const { getByTestId, queryByRole } = render(
      <Asset asset={assetWithoutChainId} />,
    );

    expect(getByTestId('token-asset')).toBeInTheDocument();
    expect(queryByRole('img', { name: 'Ethereum' })).not.toBeInTheDocument();
  });
});

describe('NFTAsset', () => {
  it('renders ERC721 NFT asset with correct information', () => {
    const { getByText, getByTestId } = render(
      <Asset asset={mockNFTERC721Asset} />,
    );

    expect(getByTestId('nft-asset')).toBeInTheDocument();
    expect(getByText('Test Collection')).toBeInTheDocument();
    expect(getByText('Test NFT')).toBeInTheDocument();
  });

  it('renders ERC1155 NFT asset with balance and tokenId', () => {
    const { getByText, getByTestId } = render(
      <Asset asset={mockNFTERC1155Asset} />,
    );

    expect(getByTestId('nft-asset')).toBeInTheDocument();
    expect(getByText('Test Collection 1155')).toBeInTheDocument();
    expect(getByText('(3) Test NFT 1155 - #456')).toBeInTheDocument();
  });

  it('renders ERC1155 NFT asset with balance and tokenId when name is not provided', () => {
    const assetWithoutName = { ...mockNFTERC1155Asset, name: undefined };
    const { getByText, getByTestId } = render(
      <Asset asset={assetWithoutName} />,
    );

    expect(getByTestId('nft-asset')).toBeInTheDocument();
    expect(getByText('Test Collection 1155')).toBeInTheDocument();
    expect(getByText('(3) #456')).toBeInTheDocument();
  });

  it('calls onClick when NFT asset is clicked', () => {
    const mockOnClick = jest.fn();
    const { getByTestId } = render(
      <Asset asset={mockNFTERC721Asset} onClick={mockOnClick} />,
    );

    fireEvent.click(getByTestId('nft-asset'));
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('applies selected background when NFT asset is selected', () => {
    const { getByTestId } = render(
      <Asset asset={mockNFTERC721Asset} isSelected={true} />,
    );

    const nftAsset = getByTestId('nft-asset');
    expect(nftAsset).toHaveStyle(
      'background-color: var(--color-background-hover)',
    );
  });

  it('renders NFT asset without network badge when chainId is not provided', () => {
    const assetWithoutChainId = { ...mockNFTERC721Asset, chainId: undefined };
    const { getByTestId, queryByRole } = render(
      <Asset asset={assetWithoutChainId} />,
    );

    expect(getByTestId('nft-asset')).toBeInTheDocument();
    expect(queryByRole('img', { name: 'Ethereum' })).not.toBeInTheDocument();
  });

  it('handles image error gracefully', () => {
    const { getByAltText } = render(<Asset asset={mockNFTERC721Asset} />);

    const image = getByAltText('Test NFT');
    fireEvent.error(image);

    expect(image).toHaveStyle('display: none');
  });

  it('uses collection imageUrl when asset image is not provided', () => {
    const assetWithoutImage = {
      ...mockNFTERC721Asset,
      image: undefined,
    };
    const { getByAltText } = render(<Asset asset={assetWithoutImage} />);

    const image = getByAltText('Test NFT');
    expect(image).toHaveAttribute('src', 'https://example.com/collection.png');
  });
});
