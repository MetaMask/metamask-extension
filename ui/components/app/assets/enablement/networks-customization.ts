import { isCaipAssetType, parseCaipAssetType } from '@metamask/utils';
import { formatChainIdToHex } from '@metamask/bridge-controller';
import {
  AccountGroupAssets,
  TokenBalancesControllerState,
} from '@metamask/assets-controllers';
import { AssetsControllerState } from '@metamask/assets-controller';
import { CHAIN_IDS } from '../../../../../shared/constants/network';

/**
 * The Arc USDC ERC-20 token contract. On Arc, USDC is the native gas token
 * and is also exposed through this ERC-20 interface; both share the same
 * underlying balance. It is hidden across the UI (token list, aggregated
 * balance, send asset picker) in favour of the native representation to
 * avoid double-counting.
 */
export const ARC_USDC_ERC20_TOKEN_ADDRESS =
  '0x3600000000000000000000000000000000000000';

/**
 * The Stable USDT0 ERC-20 token contract. Since Stable v1.2.0, USDT0
 * (replacing gUSDT) is the native gas token and is also exposed as this
 * ERC-20. It is hidden across the UI (token list, aggregated balance, send
 * asset picker) in favour of the native representation to avoid
 * double-counting.
 */
export const STABLE_USDT0_ERC20_ADDRESS =
  '0x779ded0c9e1022225f8e0630b35a9b54be713736';

// For token visibility in the Asset List + Send picker.
// Keys and values are normalized to lowercase at module load so all lookups
// and comparisons are case-insensitive.
const EXCLUDED_ASSETS_FROM_ASSET_LIST: Record<string, string> =
  Object.fromEntries(
    Object.entries({
      [CHAIN_IDS.ARC]: ARC_USDC_ERC20_TOKEN_ADDRESS,
      [CHAIN_IDS.STABLE]: STABLE_USDT0_ERC20_ADDRESS,
    }).map(([chainId, address]) => [
      chainId.toLowerCase(),
      address.toLowerCase(),
    ]),
  );

const EXCLUDED_ASSET_IDS = new Set(
  Object.entries(EXCLUDED_ASSETS_FROM_ASSET_LIST).map(
    ([hexChainId, address]) =>
      `eip155:${Number.parseInt(hexChainId, 16)}/erc20:${address}`,
  ),
);

export function isExcludedAsset(
  chainId: string,
  address: string | undefined,
): boolean {
  if (!address) {
    return false;
  }
  return getExcludedAddress(chainId) === address.toLowerCase();
}

function getExcludedAddress(chainId: string): string | undefined {
  return EXCLUDED_ASSETS_FROM_ASSET_LIST[chainId.toLowerCase()];
}

export type TokenBalances = TokenBalancesControllerState['tokenBalances'];

/**
 * Removes excluded homonym ERC-20s (ex: Arc USDC at 0x3600..., Stable USDT0)
 * from the per-chain asset map so they never appear as duplicates of the
 * native token. The native token (zero address) is kept, as it is the source
 * of truth for display on those chains.
 *
 * @param assets - Per-chain map of assets keyed by chain ID.
 * @returns The asset map with excluded ERC-20s removed from affected chains.
 */
export function filterExcludedAssets(
  assets: AccountGroupAssets,
): AccountGroupAssets {
  return Object.entries(assets).reduce((acc, [chainId, chainAssets]) => {
    if (!chainAssets || !getExcludedAddress(chainId)) {
      return acc;
    }
    return {
      ...acc,
      [chainId]: chainAssets.filter(
        (asset) =>
          !('address' in asset) || !isExcludedAsset(chainId, asset.address),
      ),
    };
  }, assets);
}

/**
 * Strips excluded ERC-20s (ex: Arc USDC at 0x3600...) from the nested
 * account > chain > address balance map - the native token already reflects
 * those balances, so counting both would double the aggregated balance.
 * @param tokenBalances
 */
export function filterExcludedTokenBalances(
  tokenBalances: TokenBalances,
): TokenBalances {
  return Object.fromEntries(
    Object.entries(tokenBalances).map(([account, chainMap]) => [
      account,
      Object.fromEntries(
        Object.entries(chainMap).map(([chainId, addressMap]) => {
          if (!getExcludedAddress(chainId)) {
            return [chainId, addressMap];
          }
          return [
            chainId,
            Object.fromEntries(
              Object.entries(addressMap).filter(
                ([address]) => !isExcludedAsset(chainId, address),
              ),
            ),
          ];
        }),
      ),
    ]),
  );
}

type AssetLike = {
  chainId?: string | number;
  assetId?: string;
  address?: string;
};

/**
 * Filters out excluded homonym ERC-20s (ex: Arc USDC at 0x3600...) - display
 * duplicates of their chain's native gas token.
 *
 * Handles hex (0x13b2) and CAIP (eip155:5042) chain ids - falling back to the
 * assetId's chain part when no chainId field is present - and resolves the
 * address from the `address` field or the assetId reference.
 * @param assets
 */
export function filterExcludedAssetList<AssetGeneric extends AssetLike>(
  assets: AssetGeneric[],
): AssetGeneric[] {
  return assets.filter((asset) => {
    const parsed =
      typeof asset.assetId === 'string' && isCaipAssetType(asset.assetId)
        ? parseCaipAssetType(asset.assetId)
        : undefined;

    const rawChainId = asset.chainId ?? parsed?.chainId;
    if (rawChainId === undefined) {
      return true;
    }

    let hexChainId: string;
    try {
      hexChainId = formatChainIdToHex(String(rawChainId));
    } catch {
      return true; // unparseable chain id → not an excluded chain
    }

    if (!getExcludedAddress(hexChainId)) {
      return true;
    }

    return !isExcludedAsset(
      hexChainId,
      asset.address ?? parsed?.assetReference,
    );
  });
}

/**
 * Augments the Asset Controller state for network customization concerns.
 * Removes excluded homonym ERC-20 balances (ex: Arc USDC, Stable USDT0) to
 * avoid double counting in the balance total - the native token already
 * reflects those balances.
 * @param assetsControllerState
 * @returns altered (copy) version of assetsControllerState without excluded balances
 */
export function augmentAssetControllersState(
  assetsControllerState: AssetsControllerState,
): AssetsControllerState {
  return {
    ...assetsControllerState,
    assetsBalance: Object.fromEntries(
      Object.entries(assetsControllerState.assetsBalance).map(
        ([accountId, assets]) => [
          accountId,
          Object.fromEntries(
            Object.entries(assets).filter(
              ([assetId]) => !EXCLUDED_ASSET_IDS.has(assetId.toLowerCase()),
            ),
          ),
        ],
      ),
    ),
  };
}
