import {
  filterOutArcNativeAsset,
  mapArcNativeAssetToSwapToken,
} from './arc';

const ARC_NATIVE_CAIP_CHAIN_ID = 'eip155:5042';
const ARC_NATIVE_HEX_CHAIN_ID = '0x13b2';
const ARC_NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';
const ARC_NATIVE_ASSET_ID =
  'eip155:5042/erc20:0x0000000000000000000000000000000000000000';
const ARC_ERC20_USDC_ADDRESS = '0x3600000000000000000000000000000000000000';

type Asset = {
  chainId?: string;
  address?: string;
  assetId?: string;
  isNative?: boolean;
};

describe('filterOutArcNativeAsset', () => {
  const arcNativeByAddress = {
    chainId: ARC_NATIVE_HEX_CHAIN_ID,
    address: ARC_NATIVE_ADDRESS,
    isNative: true,
  };
  const arcErc20UsdcByAddress = {
    chainId: ARC_NATIVE_HEX_CHAIN_ID,
    address: ARC_ERC20_USDC_ADDRESS,
  };
  const arcNativeByAssetId = {
    chainId: ARC_NATIVE_CAIP_CHAIN_ID,
    assetId: ARC_NATIVE_ASSET_ID,
    isNative: true,
  };
  const arcErc20UsdcByAssetId = {
    chainId: ARC_NATIVE_CAIP_CHAIN_ID,
    assetId: `${ARC_NATIVE_CAIP_CHAIN_ID}/erc20:${ARC_ERC20_USDC_ADDRESS}`,
  };
  const arcNativeUpperAddress = {
    chainId: ARC_NATIVE_HEX_CHAIN_ID.toUpperCase(),
    address: ARC_NATIVE_ADDRESS.toUpperCase(),
    isNative: true,
  };
  const arcNativeUpperAssetId = {
    chainId: ARC_NATIVE_CAIP_CHAIN_ID.toUpperCase(),
    assetId: ARC_NATIVE_ASSET_ID.toUpperCase(),
    isNative: true,
  };
  const nonArcNativeAddress = {
    chainId: 'eip155:1',
    address: ARC_NATIVE_ADDRESS,
  };
  const arcOtherToken = {
    chainId: ARC_NATIVE_HEX_CHAIN_ID,
    address: '0x1111111111111111111111111111111111111111',
  };
  const arcAssetWithoutIdentifiers = { chainId: ARC_NATIVE_HEX_CHAIN_ID };

  const testCases: {
    description: string;
    assets: Asset[];
    expected: Asset[];
  }[] = [
    {
      description: 'returns an empty array when given an empty array',
      assets: [],
      expected: [],
    },
    {
      description:
        'filters out the Arc native asset matched by address on the hex chainId',
      assets: [arcNativeByAddress, arcErc20UsdcByAddress],
      expected: [arcErc20UsdcByAddress],
    },
    {
      description:
        'filters out the Arc native asset matched by assetId on the CAIP chainId',
      assets: [arcNativeByAssetId, arcErc20UsdcByAssetId],
      expected: [arcErc20UsdcByAssetId],
    },
    {
      description: 'matches the Arc native asset case-insensitively',
      assets: [arcNativeUpperAddress, arcNativeUpperAssetId],
      expected: [],
    },
    {
      description: 'keeps the Arc native address when it is on a non-Arc chain',
      assets: [nonArcNativeAddress],
      expected: [nonArcNativeAddress],
    },
    {
      description:
        'keeps assets on the Arc chain that are not the native asset',
      assets: [arcOtherToken],
      expected: [arcOtherToken],
    },
    {
      description: 'keeps assets that have neither an address nor an assetId',
      assets: [arcAssetWithoutIdentifiers],
      expected: [arcAssetWithoutIdentifiers],
    },
    {
      description: 'preserves the order of the remaining assets',
      assets: [
        { chainId: 'eip155:1', address: '0xaaa' },
        arcNativeByAddress,
        { chainId: 'eip155:10', address: '0xbbb' },
      ],
      expected: [
        { chainId: 'eip155:1', address: '0xaaa' },
        { chainId: 'eip155:10', address: '0xbbb' },
      ],
    },
  ];

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(testCases)(
    '$description',
    ({ assets, expected }: { assets: Asset[]; expected: Asset[] }) => {
      expect(filterOutArcNativeAsset(assets)).toStrictEqual(expected);
    },
  );
});

describe('mapArcNativeAssetToSwapToken', () => {
  it('maps the Arc native asset matched by address to the ERC20 USDC token', () => {
    const token = {
      chainId: ARC_NATIVE_HEX_CHAIN_ID,
      address: ARC_NATIVE_ADDRESS,
      symbol: 'USDC',
      decimals: 6,
    };

    expect(mapArcNativeAssetToSwapToken(token)).toStrictEqual({
      ...token,
      address: ARC_ERC20_USDC_ADDRESS,
    });
  });

  it('maps the Arc native asset to the CAIP-19 USDC asset id when the address is a CAIP-19 asset type', () => {
    const token = {
      chainId: ARC_NATIVE_HEX_CHAIN_ID,
      address: ARC_NATIVE_ASSET_ID,
      symbol: 'USDC',
      decimals: 6,
    };

    expect(mapArcNativeAssetToSwapToken(token)).toStrictEqual({
      ...token,
      address: `${ARC_NATIVE_CAIP_CHAIN_ID}/erc20:${ARC_ERC20_USDC_ADDRESS}`,
    });
  });

  it('maps the Arc native asset matched case-insensitively', () => {
    const token = {
      chainId: ARC_NATIVE_HEX_CHAIN_ID.toUpperCase(),
      address: ARC_NATIVE_ADDRESS.toUpperCase(),
      symbol: 'USDC',
    };

    expect(mapArcNativeAssetToSwapToken(token)).toStrictEqual({
      ...token,
      address: ARC_ERC20_USDC_ADDRESS,
    });
  });

  it('preserves the other token fields when mapping the Arc native asset', () => {
    const token = {
      chainId: ARC_NATIVE_HEX_CHAIN_ID,
      address: ARC_NATIVE_ADDRESS,
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
      type: 'token',
    };

    expect(mapArcNativeAssetToSwapToken(token)).toStrictEqual({
      ...token,
      address: ARC_ERC20_USDC_ADDRESS,
    });
  });

  it('returns the Arc ERC20 USDC token unchanged', () => {
    const token = {
      chainId: ARC_NATIVE_HEX_CHAIN_ID,
      address: ARC_ERC20_USDC_ADDRESS,
      symbol: 'USDC',
    };

    expect(mapArcNativeAssetToSwapToken(token)).toStrictEqual(token);
  });

  it('returns the native zero address unchanged when on a non-Arc chain', () => {
    const token = {
      chainId: 'eip155:1',
      address: ARC_NATIVE_ADDRESS,
      symbol: 'ETH',
    };

    expect(mapArcNativeAssetToSwapToken(token)).toStrictEqual(token);
  });

  it('returns a non-native Arc token unchanged', () => {
    const token = {
      chainId: ARC_NATIVE_HEX_CHAIN_ID,
      address: '0x1111111111111111111111111111111111111111',
      symbol: 'FOO',
    };

    expect(mapArcNativeAssetToSwapToken(token)).toStrictEqual(token);
  });
});
