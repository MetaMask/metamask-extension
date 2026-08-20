import { AccountGroupAssets } from '@metamask/assets-controllers';
import { AssetsControllerState } from '@metamask/assets-controller';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import {
  ARC_USDC_ERC20_TOKEN_ADDRESS,
  STABLE_USDT0_ERC20_ADDRESS,
  filterExcludedAssetList,
  filterExcludedAssets,
  filterExcludedTokenBalances,
  augmentAssetControllersState,
  TokenBalances,
} from './networks-customization';

const { ARC, STABLE } = CHAIN_IDS;
const OTHER_TOKEN = '0x1111111111111111111111111111111111111111';

// Independently written (not derived from the module) so a regression in the
// hex → CAIP conversion is caught rather than mirrored.
const ARC_USDC_ASSET_ID = `eip155:5042/erc20:${ARC_USDC_ERC20_TOKEN_ADDRESS}`;
const ARC_NATIVE_ASSET_ID = 'eip155:5042/slip44:60';
const STABLE_USDT0_ASSET_ID = `eip155:988/erc20:${STABLE_USDT0_ERC20_ADDRESS}`;

describe('networks-customization', () => {
  describe('filterExcludedAssets', () => {
    it('removes the excluded ERC-20 on Arc and Stable, keeps other assets', () => {
      const assets = {
        [ARC]: [
          { address: ARC_USDC_ERC20_TOKEN_ADDRESS },
          { address: OTHER_TOKEN },
          { symbol: 'USDC' }, // native-style asset without address
        ],
        [STABLE]: [{ address: STABLE_USDT0_ERC20_ADDRESS }],
        '0x1': [{ address: ARC_USDC_ERC20_TOKEN_ADDRESS }],
      } as unknown as AccountGroupAssets;

      const result = filterExcludedAssets(assets);

      expect(result[ARC]).toStrictEqual([
        { address: OTHER_TOKEN },
        { symbol: 'USDC' },
      ]);
      expect(result[STABLE]).toStrictEqual([]);
      // Same address on an unrelated chain is untouched
      expect(result['0x1']).toStrictEqual([
        { address: ARC_USDC_ERC20_TOKEN_ADDRESS },
      ]);
    });

    it('is case-insensitive on address and chain id', () => {
      const assets = {
        [ARC.toUpperCase()]: [
          { address: ARC_USDC_ERC20_TOKEN_ADDRESS.toUpperCase() },
        ],
      } as unknown as AccountGroupAssets;

      expect(Object.values(filterExcludedAssets(assets))[0]).toStrictEqual([]);
    });

    it('returns the same reference when no chain has exclusions', () => {
      const assets = {
        '0x1': [{ address: OTHER_TOKEN }],
      } as unknown as AccountGroupAssets;

      expect(filterExcludedAssets(assets)).toBe(assets);
    });
  });

  describe('filterExcludedTokenBalances', () => {
    it('strips the excluded balance key only on excluded chains', () => {
      const tokenBalances = {
        '0xaccount': {
          [ARC]: {
            [ARC_USDC_ERC20_TOKEN_ADDRESS]: '0x1',
            [OTHER_TOKEN]: '0x2',
          },
          '0x1': { [ARC_USDC_ERC20_TOKEN_ADDRESS]: '0x3' },
        },
      } as TokenBalances;

      const result = filterExcludedTokenBalances(tokenBalances);

      expect(result['0xaccount'][ARC]).toStrictEqual({ [OTHER_TOKEN]: '0x2' });
      expect(result['0xaccount']['0x1']).toStrictEqual({
        [ARC_USDC_ERC20_TOKEN_ADDRESS]: '0x3',
      });
    });

    it('is case-insensitive on the balance address key', () => {
      const tokenBalances = {
        '0xaccount': {
          [ARC]: { [ARC_USDC_ERC20_TOKEN_ADDRESS.toUpperCase()]: '0x1' },
        },
      } as TokenBalances;

      expect(
        filterExcludedTokenBalances(tokenBalances)['0xaccount'][ARC],
      ).toStrictEqual({});
    });

    it('does not mutate the input', () => {
      const tokenBalances = {
        '0xaccount': { [ARC]: { [ARC_USDC_ERC20_TOKEN_ADDRESS]: '0x1' } },
      } as TokenBalances;

      filterExcludedTokenBalances(tokenBalances);

      expect(tokenBalances['0xaccount'][ARC]).toHaveProperty(
        ARC_USDC_ERC20_TOKEN_ADDRESS,
      );
    });
  });

  describe('filterExcludedAssetList', () => {
    it('filters by hex chainId + address', () => {
      const assets = [
        { chainId: ARC, address: ARC_USDC_ERC20_TOKEN_ADDRESS },
        { chainId: ARC, address: OTHER_TOKEN },
        { chainId: '0x1', address: ARC_USDC_ERC20_TOKEN_ADDRESS },
      ];

      expect(filterExcludedAssetList(assets)).toStrictEqual([
        { chainId: ARC, address: OTHER_TOKEN },
        { chainId: '0x1', address: ARC_USDC_ERC20_TOKEN_ADDRESS },
      ]);
    });

    it('filters by CAIP chainId, and by assetId when fields are absent', () => {
      const assets = [
        { chainId: 'eip155:5042', address: ARC_USDC_ERC20_TOKEN_ADDRESS },
        { assetId: ARC_USDC_ASSET_ID },
        { assetId: STABLE_USDT0_ASSET_ID },
        { assetId: ARC_NATIVE_ASSET_ID },
      ];

      expect(filterExcludedAssetList(assets)).toStrictEqual([
        { assetId: ARC_NATIVE_ASSET_ID },
      ]);
    });

    it('passes through non-EVM, unparseable, and chainless assets', () => {
      const assets = [
        { assetId: 'bip122:000000000019d6689c085ae165831e93/slip44:0' },
        { chainId: 'not-a-chain-id', address: ARC_USDC_ERC20_TOKEN_ADDRESS },
        { address: ARC_USDC_ERC20_TOKEN_ADDRESS }, // no chain info at all
        { chainId: ARC }, // excluded chain but no resolvable address
      ];

      expect(filterExcludedAssetList(assets)).toStrictEqual(assets);
    });
  });

  describe('augmentAssetControllersState', () => {
    const buildState = (
      assetsBalance: Record<string, Record<string, { amount: string }>>,
    ) => ({ assetsBalance }) as unknown as AssetsControllerState;

    it('removes excluded asset ids (Arc + Stable) from every account', () => {
      const state = buildState({
        'account-1': {
          [ARC_NATIVE_ASSET_ID]: { amount: '5' },
          [ARC_USDC_ASSET_ID]: { amount: '5' },
        },
        'account-2': {
          [STABLE_USDT0_ASSET_ID]: { amount: '0' },
        },
      });

      expect(augmentAssetControllersState(state).assetsBalance).toStrictEqual({
        'account-1': { [ARC_NATIVE_ASSET_ID]: { amount: '5' } },
        'account-2': {},
      });
    });

    it('is case-insensitive on the asset id', () => {
      const state = buildState({
        'account-1': { [ARC_USDC_ASSET_ID.toUpperCase()]: { amount: '5' } },
      });

      expect(augmentAssetControllersState(state).assetsBalance).toStrictEqual({
        'account-1': {},
      });
    });

    it('does not mutate the original state', () => {
      const state = buildState({
        'account-1': { [ARC_USDC_ASSET_ID]: { amount: '5' } },
      });

      augmentAssetControllersState(state);

      expect(state.assetsBalance['account-1']).toHaveProperty(
        ARC_USDC_ASSET_ID,
      );
    });

    it('preserves other top-level state keys', () => {
      const state = {
        assetsBalance: {},
        assetsMetadata: { foo: 'bar' },
      } as unknown as AssetsControllerState;

      expect(augmentAssetControllersState(state)).toStrictEqual(state);
    });
  });
});
