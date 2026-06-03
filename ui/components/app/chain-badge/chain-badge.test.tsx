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
      <ChainBadge chainId="0xunknown">
        <div>Unknown Chain Content</div>
      </ChainBadge>,
    );

    expect(getByText('Unknown Chain Content')).toBeInTheDocument();
  });
});
