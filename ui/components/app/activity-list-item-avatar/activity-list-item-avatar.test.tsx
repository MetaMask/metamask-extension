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
const nativeTokenWithoutAssetId = { isNative: true, chainId: '0x1' };
// Mirrors a native send (e.g. mainnet ETH) whose assetId did resolve.
const nativeTokenWithAssetId = {
  assetId: 'eip155:1/slip44:60',
  isNative: true,
};

function renderAvatar(tokens: ActivityListItemAvatarTokens) {
  return render(<ActivityListItemAvatar tokens={tokens} />);
}

function getAvatarImages() {
  return screen
    .getAllByTestId('activity-list-item-avatar-token')
    .map((el) => el.querySelector('img'));
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

  it("uses the token's own chainId to resolve a native icon even with no assetId", () => {
    renderAvatar([nativeTokenWithoutAssetId]);

    const img = screen
      .getByTestId('activity-list-item-avatar-token')
      .querySelector('img');
    expect(img).toHaveAttribute('src', ETH_TOKEN_IMAGE_URL);
  });

  it('falls back to the assetId-based CDN for a native asset when no chainId is set', () => {
    renderAvatar([nativeTokenWithAssetId]);

    const img = screen
      .getByTestId('activity-list-item-avatar-token')
      .querySelector('img');
    expect(img?.getAttribute('src')).toContain('static.cx.metamask.io');
  });

  it('falls back to the assetId-based CDN for a native asset on a chain missing from the local map', () => {
    renderAvatar([{ ...nativeTokenWithAssetId, chainId: '0x999999' }]);

    const img = screen
      .getByTestId('activity-list-item-avatar-token')
      .querySelector('img');
    expect(img?.getAttribute('src')).toContain('static.cx.metamask.io');
  });

  it('falls back to the remote token-icon CDN for non-native assets', () => {
    renderAvatar([usdcToken]);

    const img = screen
      .getByTestId('activity-list-item-avatar-token')
      .querySelector('img');
    expect(img?.getAttribute('src')).toContain('static.cx.metamask.io');
  });

  it('resolves each leg of a dual avatar against its own chainId, not a shared one', () => {
    // Regression test: a bridge's destination leg can be on a different
    // chain than the source. Applying one chainId to both legs would show
    // the source chain's native icon for a native destination with no
    // assetId, which is wrong rather than just missing.
    const sourceNative = { isNative: true, chainId: '0x1' };
    // An unmapped, made-up chain with no assetId to fall back on.
    const destinationNativeNoAssetId = { isNative: true, chainId: '0x999999' };

    renderAvatar([sourceNative, destinationNativeNoAssetId]);

    const [fromImg, toImg] = getAvatarImages();
    expect(fromImg).toHaveAttribute('src', ETH_TOKEN_IMAGE_URL);
    // Should render no icon at all rather than incorrectly reusing the
    // source chain's ETH icon.
    expect(toImg?.getAttribute('src')).toBeFalsy();
  });
});
