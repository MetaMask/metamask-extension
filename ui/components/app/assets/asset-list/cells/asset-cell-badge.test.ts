import { CaipAssetType } from '@metamask/utils';
import { getAssetImageUrl } from '../../../../../../shared/lib/asset-utils';
import { getAvatarTokenSrc } from './asset-cell-badge';

const SOLANA_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const SOLANA_NATIVE_ASSET_ID =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501' as CaipAssetType;

describe('getAvatarTokenSrc', () => {
  it('falls back to the static asset image for a non-EVM native token with an empty token image', () => {
    const result = getAvatarTokenSrc({
      chainId: SOLANA_CHAIN_ID,
      isNative: true,
      tokenImage: '',
      assetId: SOLANA_NATIVE_ASSET_ID,
    });

    const expected = getAssetImageUrl(SOLANA_NATIVE_ASSET_ID, SOLANA_CHAIN_ID);

    expect(result).toBe(expected);
    expect(result).not.toBe('');
  });

  it('returns the provided token image for a non-EVM native token when present', () => {
    const tokenImage = 'https://example.com/sol.png';

    const result = getAvatarTokenSrc({
      chainId: SOLANA_CHAIN_ID,
      isNative: true,
      tokenImage,
      assetId: SOLANA_NATIVE_ASSET_ID,
    });

    expect(result).toBe(tokenImage);
  });

  it('falls back to the static asset image for a non-EVM non-native token with an empty token image', () => {
    const assetId =
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as CaipAssetType;

    const result = getAvatarTokenSrc({
      chainId: SOLANA_CHAIN_ID,
      isNative: false,
      tokenImage: '',
      assetId,
    });

    const expected = getAssetImageUrl(assetId, SOLANA_CHAIN_ID);

    expect(result).toBe(expected);
    expect(result).not.toBe('');
  });
});
