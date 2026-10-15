import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  CHILIZ_IMAGE_URL,
  ETH_TOKEN_IMAGE_URL,
} from '../../../../shared/constants/network';
import { getCaipAssetImageUrl } from '../../../../shared/lib/asset-utils';
import {
  ActivityListItemAvatar,
  type ActivityListItemAvatarTokens,
} from './activity-list-item-avatar';

const ethTokenAssetId = 'eip155:1/slip44:60';
const usdcAssetId = 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
// Zero-address CAIP for Chiliz native (what core emits when there is no slip44).
const chilizNativeAssetId =
  'eip155:88888/erc20:0x0000000000000000000000000000000000000000';

function renderAvatar(tokens: ActivityListItemAvatarTokens) {
  return render(<ActivityListItemAvatar tokens={tokens} />);
}

function getTokenImage() {
  return screen
    .getByTestId('activity-list-item-avatar-token')
    .querySelector('img');
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

  it('uses the local CHAIN_ID_TOKEN_IMAGE_MAP icon when a native CDN image errors', () => {
    renderAvatar([chilizNativeAssetId]);

    const cdnImage = getTokenImage();
    expect(cdnImage).toHaveAttribute(
      'src',
      getCaipAssetImageUrl(chilizNativeAssetId),
    );

    // Simulate the CDN 404 (img onError).
    fireEvent.error(cdnImage as HTMLImageElement);

    expect(getTokenImage()).toHaveAttribute('src', CHILIZ_IMAGE_URL);
  });

  it('does not swap a broken ERC-20 CDN icon for the chain native local icon', () => {
    renderAvatar([usdcAssetId]);

    const cdnImage = getTokenImage();
    fireEvent.error(cdnImage as HTMLImageElement);

    // AvatarToken may drop the broken <img>. We only care that we did not
    // replace it with mainnet's local native icon (./images/eth_logo.svg).
    expect(getTokenImage()?.getAttribute('src')).not.toBe(ETH_TOKEN_IMAGE_URL);
  });
});
