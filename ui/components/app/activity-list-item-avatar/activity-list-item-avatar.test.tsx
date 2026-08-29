import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  ActivityListItemAvatar,
  type ActivityListItemAvatarTokens,
} from './activity-list-item-avatar';

const ethTokenAssetId = 'eip155:1/slip44:60';
const usdcAssetId = 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const chzFallbackAssetId =
  'eip155:88888/erc20:0x0000000000000000000000000000000000000000';

function renderAvatar(tokens: ActivityListItemAvatarTokens) {
  return render(<ActivityListItemAvatar tokens={tokens} />);
}

describe('ActivityListItemAvatar', () => {
  it('renders dual token avatars for swaps', () => {
    renderAvatar([ethTokenAssetId, usdcAssetId]);

    expect(
      screen.getByTestId('activity-list-item-avatar-dual'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByTestId('activity-list-item-avatar-token'),
    ).toHaveLength(2);
  });

  it('renders a single token avatar', () => {
    renderAvatar([usdcAssetId]);

    expect(
      screen.getByTestId('activity-list-item-avatar-token'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('activity-list-item-avatar-dual'),
    ).not.toBeInTheDocument();
  });

  it('handles undefined token entries and still renders a token avatar', () => {
    renderAvatar([undefined, usdcAssetId]);

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

  it('uses the bundled local icon for a native asset, not the CDN', () => {
    renderAvatar([ethTokenAssetId]);

    const img = screen
      .getByTestId('activity-list-item-avatar-token')
      .querySelector('img');
    expect(img?.getAttribute('src')).toBe('./images/eth_logo.svg');
  });

  it('uses the bundled local icon for a native asset on a custom network', () => {
    renderAvatar([chzFallbackAssetId]);

    const img = screen
      .getByTestId('activity-list-item-avatar-token')
      .querySelector('img');
    expect(img?.getAttribute('src')).not.toContain('static.cx.metamask.io');
  });

  it('falls back to the CDN for a non-native asset', () => {
    renderAvatar([usdcAssetId]);

    const img = screen
      .getByTestId('activity-list-item-avatar-token')
      .querySelector('img');
    expect(img?.getAttribute('src')).toContain('static.cx.metamask.io');
  });
});
