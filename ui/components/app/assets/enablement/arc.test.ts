import { filterOutArcErc20USDCAsset } from './arc';

const ARC_NATIVE_CAIP_CHAIN_ID = 'eip155:5042';
const ARC_NATIVE_HEX_CHAIN_ID = '0x13b2';
const ARC_ERC20_USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const ARC_ERC20_USDC_ASSET_ID =
  'eip155:5042/erc20:0x3600000000000000000000000000000000000000';

type Asset = {
  chainId?: string;
  address?: string;
  assetId?: string;
  isNative?: boolean;
};

describe('filterOutArcErc20USDCAsset', () => {
  const arcErc20UsdcByAddress = {
    chainId: ARC_NATIVE_HEX_CHAIN_ID,
    address: ARC_ERC20_USDC_ADDRESS,
  };
  const arcNativeByAddress = {
    chainId: ARC_NATIVE_HEX_CHAIN_ID,
    address: '0x0000000000000000000000000000000000000000',
    isNative: true,
  };
  const arcErc20UsdcByAssetId = {
    chainId: ARC_NATIVE_CAIP_CHAIN_ID,
    assetId: ARC_ERC20_USDC_ASSET_ID,
  };
  const arcNativeByAssetId = {
    chainId: ARC_NATIVE_CAIP_CHAIN_ID,
    assetId: 'eip155:5042/slip44:60',
    isNative: true,
  };
  const arcErc20UsdcUpperAddress = {
    chainId: ARC_NATIVE_HEX_CHAIN_ID.toUpperCase(),
    address: ARC_ERC20_USDC_ADDRESS.toUpperCase(),
  };
  const arcErc20UsdcUpperAssetId = {
    chainId: ARC_NATIVE_CAIP_CHAIN_ID.toUpperCase(),
    assetId: ARC_ERC20_USDC_ASSET_ID.toUpperCase(),
  };
  const nonArcUsdcAddress = {
    chainId: 'eip155:1',
    address: ARC_ERC20_USDC_ADDRESS,
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
        'filters out the Arc ERC20 USDC asset matched by address on the hex chainId',
      assets: [arcErc20UsdcByAddress, arcNativeByAddress],
      expected: [arcNativeByAddress],
    },
    {
      description:
        'filters out the Arc ERC20 USDC asset matched by assetId on the CAIP chainId',
      assets: [arcErc20UsdcByAssetId, arcNativeByAssetId],
      expected: [arcNativeByAssetId],
    },
    {
      description: 'matches the Arc ERC20 USDC asset case-insensitively',
      assets: [arcErc20UsdcUpperAddress, arcErc20UsdcUpperAssetId],
      expected: [],
    },
    {
      description:
        'keeps the Arc ERC20 USDC address when it is on a non-Arc chain',
      assets: [nonArcUsdcAddress],
      expected: [nonArcUsdcAddress],
    },
    {
      description:
        'keeps assets on the Arc chain that are not the ERC20 USDC asset',
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
      expect(filterOutArcErc20USDCAsset(assets)).toStrictEqual(expected);
    },
  );
});
