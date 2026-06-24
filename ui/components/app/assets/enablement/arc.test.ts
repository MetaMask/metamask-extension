import { filterOutArcERC20USDAsset } from './arc';

const ARC_NATIVE_CAIP_CHAIN_ID = 'eip155:5042';
const ARC_NATIVE_HEX_CHAIN_ID = '0x13b2';
const ARC_NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000';
const ARC_NATIVE_ASSET_ID =
  'eip155:5042/erc20:0x0000000000000000000000000000000000000000';
const ARC_ERC20_ASSET_ID =
  'eip155:5042/erc20:0x3600000000000000000000000000000000000000';
const ARC_ERC20_USDC_ADDRESS = '0x3600000000000000000000000000000000000000';

type Asset = {
  chainId?: string;
  address?: string;
  assetId?: string;
  isNative?: boolean;
};

describe('filterOutArcERC20USDAsset', () => {
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
  // const arcNativeUpperAddress = {
  //   chainId: ARC_NATIVE_HEX_CHAIN_ID.toUpperCase(),
  //   address: ARC_NATIVE_ADDRESS.toUpperCase(),
  //   isNative: true,
  // };
  // const arcNativeUpperAssetId = {
  //   chainId: ARC_NATIVE_CAIP_CHAIN_ID.toUpperCase(),
  //   assetId: ARC_NATIVE_ASSET_ID.toUpperCase(),
  //   isNative: true,
  // };
  const arcERC20UpperAddress = {
    chainId: ARC_NATIVE_HEX_CHAIN_ID.toUpperCase(),
    address: ARC_ERC20_USDC_ADDRESS.toUpperCase(),
  };
  const arcERC20UpperAssetId = {
    chainId: ARC_NATIVE_CAIP_CHAIN_ID.toUpperCase(),
    assetId: ARC_ERC20_ASSET_ID.toUpperCase(),
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
        'filters out the Arc ERC20 asset matched by address on the hex chainId',
      assets: [arcNativeByAddress, arcErc20UsdcByAddress],
      expected: [arcNativeByAddress],
    },
    {
      description:
        'filters out the Arc ERC20 asset matched by assetId on the CAIP chainId',
      assets: [arcNativeByAssetId, arcErc20UsdcByAssetId],
      expected: [arcNativeByAssetId],
    },
    {
      // Less relevant as containing numbers, but future-proof.
      description: 'matches the Arc ERC20 asset case-insensitively',
      assets: [arcERC20UpperAddress, arcERC20UpperAssetId],
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
        arcErc20UsdcByAddress,
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
      expect(filterOutArcERC20USDAsset(assets)).toStrictEqual(expected);
    },
  );
});
