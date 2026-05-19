import React from 'react';
import { render, screen } from '@testing-library/react';
import { NATIVE_TOKEN_ADDRESS } from '../../../../shared/constants/transaction';
import { ActivityListItemAvatar } from './activity-list-item-avatar';
import type {
  ActivityListItemAvatarConfig,
  ResolvedActivityToken,
} from './activity-list-item-avatar.types';

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

function renderAvatar(config: ActivityListItemAvatarConfig) {
  return render(<ActivityListItemAvatar config={config} />);
}

describe('ActivityListItemAvatar', () => {
  it('renders dual token avatars for swaps', () => {
    renderAvatar({
      variant: 'dual',
      from: ethToken,
      to: usdcToken,
    });

    expect(
      screen.getByTestId('activity-list-item-avatar-dual'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByTestId('activity-list-item-avatar-token'),
    ).toHaveLength(2);
  });

  it('renders a single token avatar', () => {
    renderAvatar({
      variant: 'single',
      token: usdcToken,
    });

    expect(
      screen.getByTestId('activity-list-item-avatar-token'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('activity-list-item-avatar-dual'),
    ).not.toBeInTheDocument();
  });
});
