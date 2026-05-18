import React from 'react';
import { render, screen } from '@testing-library/react';
import { NATIVE_TOKEN_ADDRESS } from '../../../../../shared/constants/transaction';
import { ActivityItemAvatar } from './activity-item-avatar';
import type {
  ActivityAvatarConfig,
  ResolvedActivityToken,
} from './activity-item-avatar.types';

const ethToken: ResolvedActivityToken = {
  address: NATIVE_TOKEN_ADDRESS,
  symbol: 'ETH',
  chainId: '0x1',
  fallbackName: 'Ethereum',
  imageUrl:
    'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/eth_logo.svg',
};

const usdcToken: ResolvedActivityToken = {
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  symbol: 'USDC',
  chainId: '0x1',
  fallbackName: 'Ethereum',
  imageUrl:
    'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/usdc.svg',
};

function renderAvatar(config: ActivityAvatarConfig) {
  return render(<ActivityItemAvatar config={config} />);
}

describe('ActivityItemAvatar', () => {
  it('renders dual token avatars for swaps', () => {
    renderAvatar({
      variant: 'dual',
      from: ethToken,
      to: usdcToken,
    });

    expect(screen.getByTestId('activity-item-avatar-dual')).toBeInTheDocument();
    expect(screen.getAllByTestId('activity-item-avatar-token')).toHaveLength(2);
  });

  it('renders a single token avatar', () => {
    renderAvatar({
      variant: 'single',
      token: usdcToken,
    });

    expect(
      screen.getByTestId('activity-item-avatar-token'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('activity-item-avatar-dual'),
    ).not.toBeInTheDocument();
  });
});
