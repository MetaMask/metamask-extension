import React from 'react';
import { fireEvent } from '@testing-library/react';
import { BtcAccountType } from '@metamask/keyring-api';
import createMockStore from 'redux-mock-store';

import { renderWithProvider } from '../../../../../../test/jest';
import { useNftImageUrl } from '../../../hooks/useNftImageUrl';
import { AssetStandard } from '../../../types/send';
import { Asset } from './asset';

const mockTokenAsset = {
  name: 'Test Token',
  symbol: 'TEST',
  standard: AssetStandard.ERC20,
  balance: '10.5',
  fiat: {
    balance: 100,
    currency: 'USD',
  },
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

const store = createMockStore()();

function render(ui: React.ReactElement) {
  return renderWithProvider(ui, store);
}

jest.mock('../../../hooks/useNftImageUrl', () => ({
  useNftImageUrl: jest.fn().mockReturnValue('https://example.com/nft.png'),
}));

describe('TokenAsset', () => {
  it('renders token asset with correct information', () => {
    const { getByText, getByTestId } = render(<Asset asset={mockTokenAsset} />);

    expect(getByTestId('token-asset-0x1-TEST')).toBeInTheDocument();
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

    fireEvent.click(getByTestId('token-asset-0x1-TEST'));
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('applies selected background when token asset is selected', () => {
    const { getByTestId } = render(
      <Asset asset={mockTokenAsset} isSelected={true} />,
    );

    const tokenAsset = getByTestId('token-asset-0x1-TEST');
    expect(tokenAsset).toHaveStyle(
      'background-color: var(--color-background-hover)',
    );
  });

  it('renders token asset without network badge when chainId is not provided', () => {
    const assetWithoutChainId = { ...mockTokenAsset, chainId: undefined };
    const { getByTestId, queryByRole } = render(
      <Asset asset={assetWithoutChainId} />,
    );

    expect(getByTestId('token-asset-undefined-TEST')).toBeInTheDocument();
    expect(queryByRole('img', { name: 'Ethereum' })).not.toBeInTheDocument();
  });
});

describe('NFTAsset', () => {
  const mockUseNftImageUrl = jest.mocked(useNftImageUrl);

  beforeEach(() => {
    mockUseNftImageUrl.mockReturnValue('https://example.com/nft.png');
  });

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

  it('uses collection imageUrl when asset image is not provided', () => {
    mockUseNftImageUrl.mockReturnValue('');
    const assetWithoutImage = {
      ...mockNFTERC721Asset,
      image: undefined,
    };
    const { getByAltText } = render(<Asset asset={assetWithoutImage} />);

    const image = getByAltText('Test NFT');
    expect(image).toHaveAttribute('src', 'https://example.com/collection.png');
  });

  it('renders account type label when account type is provided', () => {
    const assetWithAccountType = {
      ...mockTokenAsset,
      accountType: BtcAccountType.P2wpkh,
    };
    const { getByText } = render(<Asset asset={assetWithAccountType} />);

    expect(getByText('Native SegWit')).toBeInTheDocument();
  });
});
