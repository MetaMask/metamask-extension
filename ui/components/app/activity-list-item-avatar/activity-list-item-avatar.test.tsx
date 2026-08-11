import React from 'react';
import { render, screen } from '@testing-library/react';
import { ETH_TOKEN_IMAGE_URL } from '../../../../shared/constants/network';
import {
  ActivityListItemAvatar,
  type ActivityListItemAvatarTokens,
} from './activity-list-item-avatar';

const usdcToken = {
  assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
};
// Mirrors a native send where the upstream mapper never resolved an assetId.
const nativeTokenWithoutAssetId = { isNative: true };

function renderAvatar(tokens: ActivityListItemAvatarTokens, chainId?: string) {
  return render(<ActivityListItemAvatar tokens={tokens} chainId={chainId} />);
}

describe('ActivityListItemAvatar', () => {
  it('renders dual token avatars for swaps', () => {
    renderAvatar([usdcToken, usdcToken]);

    expect(
      screen.getByTestId('activity-list-item-avatar-dual'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByTestId('activity-list-item-avatar-token'),
    ).toHaveLength(2);
  });

  it('renders a single token avatar', () => {
    renderAvatar([usdcToken]);

    expect(
      screen.getByTestId('activity-list-item-avatar-token'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('activity-list-item-avatar-dual'),
    ).not.toBeInTheDocument();
  });

  it('handles undefined token entries and still renders a token avatar', () => {
    renderAvatar([undefined, usdcToken]);

    expect(
      screen.getByTestId('activity-list-item-avatar-token'),
    ).toBeInTheDocument();
  });

  it('renders internal fallback when all token entries are missing', () => {
    renderAvatar([undefined]);

    expect(
      screen.getByTestId('activity-list-item-avatar-fallback'),
    ).toBeInTheDocument();
  });

  it('accepts a bare assetId string for callers that have no native/isNative info', () => {
    renderAvatar([usdcToken.assetId]);

    const img = screen
      .getByTestId('activity-list-item-avatar-token')
      .querySelector('img');
    expect(img?.getAttribute('src')).toContain('static.cx.metamask.io');
  });

  it('uses the row chainId to resolve a native icon even with no assetId', () => {
    renderAvatar([nativeTokenWithoutAssetId], '0x1');

    const img = screen
      .getByTestId('activity-list-item-avatar-token')
      .querySelector('img');
    expect(img).toHaveAttribute('src', ETH_TOKEN_IMAGE_URL);
  });

  it('falls back to the remote token-icon CDN for non-native assets', () => {
    renderAvatar([usdcToken]);

    const img = screen
      .getByTestId('activity-list-item-avatar-token')
      .querySelector('img');
    expect(img?.getAttribute('src')).toContain('static.cx.metamask.io');
  });
});
