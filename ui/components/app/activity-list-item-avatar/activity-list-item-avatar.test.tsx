import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  ActivityListItemAvatar,
  type ActivityListItemAvatarTokens,
} from './activity-list-item-avatar';

const ethTokenAssetId = 'eip155:1/slip44:60';
const usdcAssetId = 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const chilizNativeAssetId =
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

  it('falls back to the local chain native image when a native CDN icon 404s', () => {
    renderAvatar([chilizNativeAssetId]);

    const avatar = screen.getByTestId('activity-list-item-avatar-token');
    const image = avatar.querySelector('img');
    expect(image).toBeTruthy();
    expect(image).toHaveAttribute(
      'src',
      expect.stringContaining('tokenIcons'),
    );

    fireEvent.error(image as HTMLImageElement);

    const fallbackImage = screen
      .getByTestId('activity-list-item-avatar-token')
      .querySelector('img');
    expect(fallbackImage).toHaveAttribute(
      'src',
      expect.stringContaining('chiliz'),
    );
  });

  it('does not fall back to the chain native image for non-native token CDN failures', () => {
    renderAvatar([usdcAssetId]);

    const image = screen
      .getByTestId('activity-list-item-avatar-token')
      .querySelector('img') as HTMLImageElement;

    fireEvent.error(image);

    const imageAfter = screen
      .getByTestId('activity-list-item-avatar-token')
      .querySelector('img');
    // AvatarToken may hide the broken CDN img; we must not swap to a local native icon.
    expect(imageAfter?.getAttribute('src') ?? '').not.toContain('/images/');
  });
});
