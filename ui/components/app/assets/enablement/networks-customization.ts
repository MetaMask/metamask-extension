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

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Whether an asset is the native representation of its chain — the entry the
 * excluded ERC-20 is a display duplicate of.
 *
 * Native assets reach these filters in several shapes depending on the source:
 * flagged with `isNative`, carrying the zero address, or only identified by a
 * `slip44` CAIP-19 asset ID.
 *
 * @param asset - Asset to inspect.
 * @param asset.isNative
 * @param asset.address
 * @param asset.assetId
 * @returns Whether the asset represents its chain's native gas token.
 */
function isNativeRepresentation(asset: {
  isNative?: boolean;
  address?: string;
  assetId?: string;
}): boolean {
  if (asset.isNative) {
    return true;
  }

  const parsed =
    typeof asset.assetId === 'string' && isCaipAssetType(asset.assetId)
      ? parseCaipAssetType(asset.assetId)
      : undefined;

  if (parsed?.assetNamespace === 'slip44') {
    return true;
  }

  const address = asset.address ?? parsed?.assetReference;
  return address?.toLowerCase() === ZERO_ADDRESS;
}

export type TokenBalances = TokenBalancesControllerState['tokenBalances'];

/**
 * Removes excluded homonym ERC-20s (ex: Arc USDC at 0x3600..., Stable USDT0)
 * from the per-chain asset map so they never appear as duplicates of the
 * native token. The native token (zero address) is kept, as it is the source
 * of truth for display on those chains.
 *
 * The ERC-20 is only removed when that native token is actually part of the
 * chain's assets. Both identities mirror the same balance, so when the native
 * one is missing (ex: no `assetsInfo` metadata for `eip155:5042/slip44:5042`)
 * the ERC-20 is the only representation left and hiding it would drop the
 * token from the list entirely.
 *
 * @param assets - Per-chain map of assets keyed by chain ID.
 * @returns The asset map with excluded ERC-20s removed from affected chains.
 */
export function filterExcludedAssets(
  assets: AccountGroupAssets,
): AccountGroupAssets {
  return Object.entries(assets).reduce((acc, [chainId, chainAssets]) => {
    if (
      !chainAssets ||
      !getExcludedAddress(chainId) ||
      !chainAssets.some(isNativeRepresentation)
    ) {
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
  isNative?: boolean;
};

/**
 * Resolves the hex chain id of an asset when that chain has an excluded
 * ERC-20, plus the address to compare against it. Returns undefined for
 * assets that no exclusion applies to.
 *
 * Handles hex (0x13b2) and CAIP (eip155:5042) chain ids - falling back to the
 * assetId's chain part when no chainId field is present - and resolves the
 * address from the `address` field or the assetId reference.
 *
 * @param asset - Asset to resolve.
 * @returns The hex chain id and address, or undefined when not applicable.
 */
function resolveExcludedChain(
  asset: AssetLike,
): { hexChainId: string; address: string | undefined } | undefined {
  const parsed =
    typeof asset.assetId === 'string' && isCaipAssetType(asset.assetId)
      ? parseCaipAssetType(asset.assetId)
      : undefined;

  const rawChainId = asset.chainId ?? parsed?.chainId;
  if (rawChainId === undefined) {
    return undefined;
  }

  let hexChainId: string;
  try {
    hexChainId = formatChainIdToHex(String(rawChainId));
  } catch {
    return undefined; // unparseable chain id → not an excluded chain
  }

  if (!getExcludedAddress(hexChainId)) {
    return undefined;
  }

  return { hexChainId, address: asset.address ?? parsed?.assetReference };
}

/**
 * Filters out excluded homonym ERC-20s (ex: Arc USDC at 0x3600...) - display
 * duplicates of their chain's native gas token.
 *
 * @param assets - Assets to filter.
 * @param options - Filter options.
 * @param options.keepWhenNativeAbsent - When true (the default, for lists of
 * assets the user holds) the ERC-20 is only dropped if the list also holds the
 * native token it duplicates, as in {@link filterExcludedAssets}. Pass false
 * for catalogues of importable tokens, where the ERC-20 must never be offered.
 * @returns The assets without the excluded ERC-20s.
 */
export function filterExcludedAssetList<AssetGeneric extends AssetLike>(
  assets: AssetGeneric[],
  { keepWhenNativeAbsent = true }: { keepWhenNativeAbsent?: boolean } = {},
): AssetGeneric[] {
  const resolved = assets.map((asset) => ({
    asset,
    excluded: resolveExcludedChain(asset),
  }));

  const chainsWithNativeAsset = new Set(
    resolved
      .filter(({ asset, excluded }) => excluded && isNativeRepresentation(asset))
      .map(({ excluded }) => excluded?.hexChainId),
  );

  return resolved
    .filter(
      ({ excluded }) =>
        !excluded ||
        (keepWhenNativeAbsent &&
          !chainsWithNativeAsset.has(excluded.hexChainId)) ||
        !isExcludedAsset(excluded.hexChainId, excluded.address),
    )
    .map(({ asset }) => asset);
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
