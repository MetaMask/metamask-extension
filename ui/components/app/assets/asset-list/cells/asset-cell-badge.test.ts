import { CaipAssetType } from '@metamask/utils';
import { MultichainNetworks } from '../../../../../../shared/constants/multichain/networks';
import { getAvatarTokenSrc } from './asset-cell-badge';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../../component-library', () => ({
  AvatarNetwork: () => null,
  AvatarNetworkSize: { Xs: 'xs' },
  AvatarToken: () => null,
  BadgeWrapper: () => null,
}));

jest.mock('../../../../../selectors', () => ({
  getNativeCurrencyForChain: jest.fn().mockReturnValue('/images/eth_logo.svg'),
}));

jest.mock('../../../../../selectors/multichain', () => ({
  getImageForChainId: jest.fn(),
}));

jest.mock('../../../../../../shared/lib/selectors/networks', () => ({
  getNetworkConfigurationsByChainId: jest.fn(),
}));

describe('getAvatarTokenSrc', () => {
  const SOL_CHAIN_ID = MultichainNetworks.SOLANA;
  const SOL_NATIVE_ASSET_ID = `${SOL_CHAIN_ID}/slip44:501` as CaipAssetType;
  const SOL_TOKEN_ASSET_ID =
    `${SOL_CHAIN_ID}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` as CaipAssetType;

  it('returns tokenImage directly when it is non-empty', () => {
    const result = getAvatarTokenSrc({
      chainId: SOL_CHAIN_ID,
      isNative: true,
      tokenImage: 'https://example.com/sol.png',
      assetId: SOL_NATIVE_ASSET_ID,
    });

    expect(result).toBe('https://example.com/sol.png');
  });

  it('falls back to getAssetImageUrl for non-EVM native token when tokenImage is empty (regression: SOL logo disappears after send)', () => {
    // Before the fix, !opts.isNative blocked the fallback so this returned ''.
    // After the fix, the fallback is reached and a static CDN URL is returned.
    const result = getAvatarTokenSrc({
      chainId: SOL_CHAIN_ID,
      isNative: true,
      tokenImage: '',
      assetId: SOL_NATIVE_ASSET_ID,
    });

    expect(result).not.toBe('');
    expect(result).toContain('https://static.cx.metamask.io');
  });

  it('falls back to getAssetImageUrl for non-EVM non-native token when tokenImage is empty', () => {
    const result = getAvatarTokenSrc({
      chainId: SOL_CHAIN_ID,
      isNative: false,
      tokenImage: '',
      assetId: SOL_TOKEN_ASSET_ID,
    });

    expect(result).not.toBe('');
    expect(result).toContain('https://static.cx.metamask.io');
  });

  it('returns empty string when tokenImage is empty and assetId is undefined', () => {
    const result = getAvatarTokenSrc({
      chainId: SOL_CHAIN_ID,
      isNative: true,
      tokenImage: '',
      assetId: undefined,
    });

    expect(result).toBe('');
  });
});
