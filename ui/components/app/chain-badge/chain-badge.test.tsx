import * as React from 'react';
import { render } from '@testing-library/react';
import { AvatarNetworkSize } from '@metamask/design-system-react';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { ChainBadge } from './chain-badge';

const mockGetImage = jest.fn();

jest.mock('../../../selectors/multichain', () => ({
  getImageForChainId: (chainId: string) => mockGetImage(chainId),
}));

describe('ChainBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with valid chainId and children', () => {
    mockGetImage.mockReturnValue('https://example.com/ethereum.png');

    const { getByText, getByRole } = render(
      <ChainBadge chainId={CHAIN_IDS.MAINNET}>
        <div>Child Content</div>
      </ChainBadge>,
    );

    expect(getByText('Child Content')).toBeInTheDocument();
    const image = getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/ethereum.png');
  });

  it('renders with custom size', () => {
    mockGetImage.mockReturnValue('https://example.com/ethereum.png');

    const { getByRole } = render(
      <ChainBadge chainId={CHAIN_IDS.MAINNET} size={AvatarNetworkSize.Sm}>
        <div>Content</div>
      </ChainBadge>,
    );

    const image = getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/ethereum.png');
  });

  it('renders when image is unavailable', () => {
    mockGetImage.mockReturnValue(undefined);

    const { getByText } = render(
      <ChainBadge chainId="0x12345">
        <div>Unknown Chain Content</div>
      </ChainBadge>,
    );

    expect(getByText('Unknown Chain Content')).toBeInTheDocument();
  });

  it('resolves the image with the CAIP id for an EVM CAIP-2 chainId', () => {
    mockGetImage.mockReturnValue('https://example.com/ethereum.png');

    const { getByRole } = render(
      <ChainBadge chainId="eip155:1">
        <div>Content</div>
      </ChainBadge>,
    );

    expect(mockGetImage).toHaveBeenCalledWith(CHAIN_IDS.MAINNET);
    expect(getByRole('img')).toHaveAttribute(
      'src',
      'https://example.com/ethereum.png',
    );
  });

  it('resolves the image with the CAIP id for a non-EVM (Solana) chainId', () => {
    const solanaChainId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
    mockGetImage.mockReturnValue('https://example.com/solana.png');

    const { getByText } = render(
      <ChainBadge chainId={solanaChainId}>
        <div>Solana Content</div>
      </ChainBadge>,
    );

    expect(mockGetImage).toHaveBeenCalledWith(solanaChainId);
    expect(getByText('Solana Content')).toBeInTheDocument();
  });
});
