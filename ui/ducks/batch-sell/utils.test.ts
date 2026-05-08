import type { CaipAssetType, CaipChainId, Hex } from '@metamask/utils';
import {
  getChecksummedEvmAssetId,
  resolveEvmTokenAddress,
  resolvePricingData,
  resolveAssetImage,
} from './utils';
import type { ChainAsset } from './types';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const MAINNET_HEX = '0x1' as Hex;
const MAINNET_CAIP = 'eip155:1' as CaipChainId;
const SOLANA_CHAIN_ID =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as CaipChainId;

const makeNativeAsset = (overrides: Partial<ChainAsset> = {}): ChainAsset =>
  ({
    assetId: `${MAINNET_CAIP}/slip44:60`,
    name: 'Ether',
    symbol: 'ETH',
    image: '',
    balance: '1.0',
    rawBalance: '0x1',
    isNative: true,
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

const makeErc20Asset = (overrides: Partial<ChainAsset> = {}): ChainAsset =>
  ({
    assetId: `${MAINNET_CAIP}/erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7`,
    name: 'Tether USD',
    symbol: 'USDT',
    image: 'usdt.png',
    balance: '100',
    rawBalance: '0x1',
    isNative: false,
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Hex,
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

describe('getChecksummedEvmAssetId', () => {
  it('checksums a lowercase ERC-20 address on an EVM chain', () => {
    const input = 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const result = getChecksummedEvmAssetId(input);

    // Address part should be EIP-55 checksummed
    expect(result).toBe(
      'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    );
  });

  it('leaves an already-checksummed ERC-20 asset id unchanged', () => {
    const input = 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const result = getChecksummedEvmAssetId(input);

    expect(result).toBe(input);
  });

  it('returns the original asset id for a native slip44 asset', () => {
    const input = 'eip155:1/slip44:60';
    const result = getChecksummedEvmAssetId(input);

    expect(result).toBe(input);
  });

  it('returns the original asset id for a non-EVM ERC-20-like asset (Solana SPL token)', () => {
    const input =
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const result = getChecksummedEvmAssetId(input);

    expect(result).toBe(input);
  });

  it('returns the original asset id when parsing throws (malformed input)', () => {
    // parseCaipAssetType will throw on a non-CAIP string
    const malformed = 'not-a-caip-asset-id' as never;
    const result = getChecksummedEvmAssetId(malformed);

    expect(result).toBe(malformed);
  });

  it('returns the original asset id for an ERC-20 on a non-EVM chain namespace', () => {
    // Even if the assetNamespace looks like erc20, the chainId does not start with eip155:
    // Use a real CAIP format so parseCaipAssetType does not throw.
    // We simulate this by using a solana namespace with erc20 to verify the guard.
    const input =
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const result = getChecksummedEvmAssetId(input as never);

    expect(result).toBe(input);
  });
});

describe('resolveEvmTokenAddress', () => {
  it('returns the canonical native token address for a native asset', () => {
    const result = resolveEvmTokenAddress(makeNativeAsset(), MAINNET_HEX);

    // getNativeTokenAddress returns the zero-ish address for EVM chains
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('returns the contract address for an ERC-20 asset that has an address property', () => {
    const address = '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Hex;
    const result = resolveEvmTokenAddress(
      makeErc20Asset({ address }),
      MAINNET_HEX,
    );

    expect(result).toBe(address);
  });

  it('returns undefined for a non-native asset without an address property', () => {
    const assetWithoutAddress = makeErc20Asset();
    // Remove the address property to simulate a malformed / addressless token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (assetWithoutAddress as any).address;

    const result = resolveEvmTokenAddress(assetWithoutAddress, MAINNET_HEX);

    expect(result).toBeUndefined();
  });
});

describe('resolvePricingData', () => {
  const TOKEN_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Hex;

  describe('EVM assets', () => {
    it('returns price and percentageChange from marketData when available', () => {
      const marketData = {
        [MAINNET_HEX]: {
          [TOKEN_ADDRESS]: { price: 1, pricePercentChange1d: 0.5 },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = resolvePricingData(
        makeErc20Asset({ address: TOKEN_ADDRESS }),
        true,
        MAINNET_HEX,
        TOKEN_ADDRESS,
        marketData,
        {} as never,
      );

      expect(result.tokenFiatPrice).toBe(1);
      expect(result.percentageChange).toBe(0.5);
    });

    it('returns undefined price and percentageChange when tokenAddress is undefined', () => {
      const result = resolvePricingData(
        makeNativeAsset(),
        true,
        MAINNET_HEX,
        undefined,
        {} as never,
        {} as never,
      );

      expect(result.tokenFiatPrice).toBeUndefined();
      expect(result.percentageChange).toBeUndefined();
    });

    it('returns undefined price and percentageChange when token has no market data entry', () => {
      const result = resolvePricingData(
        makeErc20Asset({ address: TOKEN_ADDRESS }),
        true,
        MAINNET_HEX,
        TOKEN_ADDRESS,
        { [MAINNET_HEX]: {} } as never,
        {} as never,
      );

      expect(result.tokenFiatPrice).toBeUndefined();
      expect(result.percentageChange).toBeUndefined();
    });
  });

  describe('non-EVM assets', () => {
    const SOL_ASSET_ID = `${SOLANA_CHAIN_ID}/slip44:501` as CaipAssetType;

    it('returns price and percentageChange from assetsRates when available', () => {
      const assetsRates = {
        [SOL_ASSET_ID]: {
          rate: '150',
          marketData: { pricePercentChange: { P1D: 3.5 } },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = resolvePricingData(
        makeNativeAsset({ assetId: SOL_ASSET_ID }),
        false,
        '' as Hex,
        undefined,
        {} as never,
        assetsRates,
      );

      expect(result.tokenFiatPrice).toBe(150);
      expect(result.percentageChange).toBe(3.5);
    });

    it('returns undefined tokenFiatPrice when rate is undefined', () => {
      const assetsRates = {
        [SOL_ASSET_ID]: { rate: undefined, marketData: undefined },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = resolvePricingData(
        makeNativeAsset({ assetId: SOL_ASSET_ID }),
        false,
        '' as Hex,
        undefined,
        {} as never,
        assetsRates,
      );

      expect(result.tokenFiatPrice).toBeUndefined();
      expect(result.percentageChange).toBeUndefined();
    });

    it('returns undefined when asset has no entry in assetsRates', () => {
      const result = resolvePricingData(
        makeNativeAsset({ assetId: SOL_ASSET_ID }),
        false,
        '' as Hex,
        undefined,
        {} as never,
        {} as never,
      );

      expect(result.tokenFiatPrice).toBeUndefined();
      expect(result.percentageChange).toBeUndefined();
    });
  });
});

describe('resolveAssetImage', () => {
  it('returns the token logo from CHAIN_ID_TOKEN_IMAGE_MAP for an EVM native asset', () => {
    const result = resolveAssetImage(makeNativeAsset(), true, MAINNET_CAIP);

    // Mainnet ETH has a defined logo in CHAIN_ID_TOKEN_IMAGE_MAP
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('returns the network image from CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP for a non-EVM native asset', () => {
    const solNativeAsset = makeNativeAsset({
      assetId: `${SOLANA_CHAIN_ID}/slip44:501`,
    });

    const result = resolveAssetImage(solNativeAsset, false, SOLANA_CHAIN_ID);

    // The map may not have a Solana entry so we just verify the asset's own
    // image is not returned (the function must use the network image map).
    expect(result).not.toBe(solNativeAsset.image);
  });

  it('returns the asset image for a non-native ERC-20 token', () => {
    const result = resolveAssetImage(makeErc20Asset(), true, MAINNET_CAIP);

    expect(result).toBe('usdt.png');
  });

  it('returns the asset image for a non-native non-EVM token', () => {
    const splAsset = makeErc20Asset({ image: 'spl.png', isNative: false });

    const result = resolveAssetImage(splAsset, false, SOLANA_CHAIN_ID);

    expect(result).toBe('spl.png');
  });
});
