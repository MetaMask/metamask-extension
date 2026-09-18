import {
  CHAIN_ID_TOKEN_IMAGE_MAP,
  CHAIN_IDS,
} from '../../../../../../shared/constants/network';
import { getAvatarTokenSrc } from './asset-cell-badge';

const mockMainnetImage = CHAIN_ID_TOKEN_IMAGE_MAP[CHAIN_IDS.MAINNET];

jest.mock('../../../../../selectors', () => ({
  getNativeCurrencyForChain: jest.fn((chainId: string) => {
    if (chainId === '0x1') {
      return mockMainnetImage;
    }

    return undefined;
  }),
}));

describe('getAvatarTokenSrc', () => {
  it('falls back to tokenImage for native EVM tokens when chain map lookup misses', () => {
    expect(
      getAvatarTokenSrc({
        chainId: '0x999',
        isNative: true,
        tokenImage: 'https://example.com/custom-eth.png',
        assetId: 'eip155:999/slip44:60',
      }),
    ).toBe('https://example.com/custom-eth.png');
  });

  it('uses native chain map image when available', () => {
    expect(
      getAvatarTokenSrc({
        chainId: CHAIN_IDS.MAINNET,
        isNative: true,
        tokenImage: 'https://example.com/custom-eth.png',
        assetId: 'eip155:1/slip44:60',
      }),
    ).toBe(mockMainnetImage);
  });

  it('falls back to the static CDN icon for native non-EVM tokens without an image', () => {
    expect(
      getAvatarTokenSrc({
        chainId: 'bip122:000000000019d6689c085ae165831e93',
        isNative: true,
        tokenImage: '',
        assetId: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
      }),
    ).toBe(
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/bip122/000000000019d6689c085ae165831e93/slip44/0.png',
    );
  });
});
