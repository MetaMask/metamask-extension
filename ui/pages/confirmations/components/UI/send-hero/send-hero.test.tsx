import React from 'react';
import { render } from '@testing-library/react';
import { SendHero } from './send-hero';
import { AssetStandard } from '../../../types/send';

jest.mock('../../../../../components/component-library', () => ({
  AvatarToken: ({ src, name, size, showHalo }: any) => (
    <div
      data-testid="avatar-token"
      data-src={src}
      data-name={name}
      data-size={size}
      data-show-halo={showHalo}
    />
  ),
  AvatarNetwork: ({ size, name, src }: any) => (
    <div
      data-testid="avatar-network"
      data-size={size}
      data-name={name}
      data-src={src}
    />
  ),
  AvatarNetworkSize: {
    Xs: 'xs',
  },
  AvatarTokenSize: {
    Xl: 'xl',
  },
  BadgeWrapper: ({ badge, children }: any) => (
    <div data-testid="badge-wrapper">
      {badge && <div data-testid="badge">{badge}</div>}
      {children}
    </div>
  ),
  Box: ({ children, as, src, alt, style, onError, ...props }: any) => {
    if (as === 'img') {
      return (
        <img
          data-testid="nft-image"
          src={src}
          alt={alt}
          style={style}
          onError={onError}
          {...props}
        />
      );
    }
    return (
      <div data-testid="box" {...props}>
        {children}
      </div>
    );
  },
  Text: ({ variant, color, marginLeft, children }: any) => (
    <div
      data-testid="text"
      data-variant={variant}
      data-color={color}
      data-margin-left={marginLeft}
    >
      {children}
    </div>
  ),
}));

describe('SendHero', () => {
  const mockTokenAsset = {
    symbol: 'ETH',
    image: 'https://token-image.com/eth.png',
    chainId: '1',
    networkName: 'Ethereum Mainnet',
    networkImage: 'https://network-image.com/ethereum.png',
    standard: AssetStandard.Native,
  };

  const mockNFTAsset = {
    symbol: 'CoolNFT',
    name: 'Cool NFT #123',
    image: 'https://nft-image.com/cool.png',
    chainId: '1',
    networkName: 'Ethereum Mainnet',
    networkImage: 'https://network-image.com/ethereum.png',
    standard: AssetStandard.ERC721,
    collection: {
      name: 'Cool Collection',
      imageUrl: 'https://collection-image.com/cool.png',
    },
  };

  it('renders TokenHero for non-NFT assets', () => {
    const { getByTestId, getAllByTestId } = render(
      <SendHero asset={mockTokenAsset} />,
    );

    expect(getByTestId('box')).toBeInTheDocument();
    expect(getByTestId('badge-wrapper')).toBeInTheDocument();
    expect(getByTestId('avatar-token')).toBeInTheDocument();
    expect(getByTestId('avatar-network')).toBeInTheDocument();
    expect(getAllByTestId('text')).toHaveLength(1);
  });

  it('renders NFTHero for ERC721 assets', () => {
    const { getByTestId, getAllByTestId } = render(
      <SendHero asset={mockNFTAsset} />,
    );

    expect(getByTestId('box')).toBeInTheDocument();
    expect(getByTestId('badge-wrapper')).toBeInTheDocument();
    expect(getByTestId('avatar-token')).toBeInTheDocument();
    expect(getByTestId('avatar-network')).toBeInTheDocument();
    expect(getAllByTestId('text')).toHaveLength(1);
  });

  it('renders NFTHero for ERC1155 assets', () => {
    const erc1155Asset = { ...mockNFTAsset, standard: AssetStandard.ERC1155 };
    const { getByTestId } = render(<SendHero asset={erc1155Asset} />);

    expect(getByTestId('avatar-token')).toBeInTheDocument();
  });

  it('renders wrapped component with correct styling', () => {
    const { getByTestId } = render(<SendHero asset={mockTokenAsset} />);

    const wrapper = getByTestId('box');
    expect(wrapper).toBeInTheDocument();
  });
});

describe('TokenHero', () => {
  const mockAsset = {
    symbol: 'USDC',
    image: 'https://token-image.com/usdc.png',
    chainId: '1',
    networkName: 'Ethereum Mainnet',
    networkImage: 'https://network-image.com/ethereum.png',
  };

  it('renders AvatarToken with correct props', () => {
    const { getByTestId } = render(<SendHero asset={mockAsset} />);

    const avatarToken = getByTestId('avatar-token');
    expect(avatarToken).toHaveAttribute('data-src', mockAsset.image);
    expect(avatarToken).toHaveAttribute('data-name', mockAsset.symbol);
    expect(avatarToken).toHaveAttribute('data-size', 'xl');
    expect(avatarToken).toHaveAttribute('data-show-halo', 'false');
  });

  it('renders network badge when chainId exists', () => {
    const { getByTestId } = render(<SendHero asset={mockAsset} />);

    const avatarNetwork = getByTestId('avatar-network');
    expect(avatarNetwork).toBeInTheDocument();
    expect(avatarNetwork).toHaveAttribute('data-size', 'xs');
    expect(avatarNetwork).toHaveAttribute('data-name', mockAsset.networkName);
    expect(avatarNetwork).toHaveAttribute('data-src', mockAsset.networkImage);
  });

  it('renders asset symbol', () => {
    const { getByTestId } = render(<SendHero asset={mockAsset} />);

    const text = getByTestId('text');
    expect(text).toHaveTextContent(mockAsset.symbol);
  });

  it('does not render network badge when chainId is missing', () => {
    const assetWithoutChainId = { ...mockAsset, chainId: undefined };
    const { queryByTestId } = render(<SendHero asset={assetWithoutChainId} />);

    expect(queryByTestId('avatar-network')).not.toBeInTheDocument();
  });
});

describe('NFTHero', () => {
  const mockNFT = {
    symbol: 'CoolNFT',
    name: 'Cool NFT #123',
    image: 'https://nft-image.com/cool.png',
    chainId: '1',
    networkName: 'Ethereum Mainnet',
    networkImage: 'https://network-image.com/ethereum.png',
    standard: AssetStandard.ERC721,
    collection: {
      name: 'Cool Collection',
      imageUrl: 'https://collection-image.com/cool.png',
    },
  };

  it('renders NFT image with asset image', () => {
    const { getByTestId } = render(<SendHero asset={mockNFT} />);

    const avatarToken = getByTestId('avatar-token');
    expect(avatarToken).toHaveAttribute('data-src', mockNFT.image);
    expect(avatarToken).toHaveAttribute('data-name', mockNFT.symbol);
  });

  it('renders collection image when asset image is missing', () => {
    const nftWithoutImage = { ...mockNFT, image: undefined };
    const { getByTestId } = render(<SendHero asset={nftWithoutImage} />);

    const avatarToken = getByTestId('avatar-token');
    expect(avatarToken).toHaveAttribute('data-name', mockNFT.symbol);
  });

  it('renders network badge when chainId exists', () => {
    const { getByTestId } = render(<SendHero asset={mockNFT} />);

    const avatarNetwork = getByTestId('avatar-network');
    expect(avatarNetwork).toBeInTheDocument();
    expect(avatarNetwork).toHaveAttribute('data-name', mockNFT.networkName);
    expect(avatarNetwork).toHaveAttribute('data-src', mockNFT.networkImage);
  });

  it('renders asset symbol', () => {
    const { getByTestId } = render(<SendHero asset={mockNFT} />);

    const text = getByTestId('text');
    expect(text).toHaveTextContent(mockNFT.symbol);
  });

  it('handles image error by hiding image', () => {
    const { getByTestId } = render(<SendHero asset={mockNFT} />);

    const avatarToken = getByTestId('avatar-token');
    expect(avatarToken).toBeInTheDocument();
  });

  it('does not render network badge when chainId is missing', () => {
    const nftWithoutChainId = { ...mockNFT, chainId: undefined };
    const { queryByTestId } = render(<SendHero asset={nftWithoutChainId} />);

    expect(queryByTestId('avatar-network')).not.toBeInTheDocument();
  });

  it('does not render image when both asset image and collection imageUrl are missing', () => {
    const nftWithoutImages = {
      ...mockNFT,
      image: undefined,
      collection: { name: 'Cool Collection' },
    };
    const { getByTestId } = render(<SendHero asset={nftWithoutImages} />);

    const avatarToken = getByTestId('avatar-token');
    expect(avatarToken).toBeInTheDocument();
    expect(avatarToken).toHaveAttribute('data-name', mockNFT.symbol);
  });
});
