import { V6_DEFI_POSITION_TYPES } from '@metamask/core-backend';
import type {
  V6BalanceItem,
  V6BalanceMetadata,
  V6BalancesResponse,
  V6DeFiPositionType,
} from '@metamask/core-backend';
import type {
  CaipAccountId,
  CaipAssetType,
  CaipChainId,
} from '@metamask/utils';
import {
  KnownCaipNamespace,
  parseCaipAccountId,
  parseCaipAssetType,
  parseCaipChainId,
} from '@metamask/utils';

/** Static.cx host used to build CAIP-19 token icon URLs for DeFi positions. */
const STATIC_METAMASK_BASE_URL = 'https://static.cx.metamask.io';

/**
 * Possible `positionType` values from Accounts API v6 DeFi metadata.
 * Re-export of {@link V6_DEFI_POSITION_TYPES} from `@metamask/core-backend`.
 */
export const DEFI_POSITION_TYPES = V6_DEFI_POSITION_TYPES;

/**
 * The specific module or functionality within a DeFi protocol where a position
 * is held. Alias of {@link V6DeFiPositionType} from `@metamask/core-backend`.
 */
export type DeFiPositionType = V6DeFiPositionType;

/**
 * Position types whose fiat value is a liability and is subtracted from the
 * protocol group's aggregated `marketValue`.
 */
export const DEFI_POSITION_LIABILITY_TYPES: ReadonlySet<DeFiPositionType> =
  new Set<DeFiPositionType>(['lending']);

/**
 * An icon-group entry shown next to a protocol in the DeFi tab list.
 */
export type DeFiPositionIconGroupItem = {
  /** Token icon URL, when one can be built for the asset. */
  avatarValue?: string;
  symbol: string;
};

/**
 * A single underlying position row shown on the DeFi details page.
 */
export type DeFiUnderlyingPosition = {
  assetId: CaipAssetType;
  chainId: CaipChainId;
  symbol: string;
  name: string;
  decimals: number;
  /** Raw balance string as returned by the API. */
  balance: string;
  /** Fiat market value in the requested currency, when a price is available. */
  marketValue?: number;
  /** Position type from protocol metadata. */
  positionType: DeFiPositionType;
  /** Address of the pool this position belongs to. */
  poolAddress: string;
  /**
   * Upstream grouping id from the API. Rows that share a `productName` can
   * still carry distinct `groupId`s (e.g. multiple Pendle YT markets).
   */
  groupId: string;
  /** Token icon URL, when one can be built for the asset. */
  tokenImage?: string;
};

/**
 * A section of the details page, grouping positions that share the same
 * API `productName`. A single `protocolId` can have multiple products
 * (different pools/markets under one protocol), so a group may contain
 * several sections.
 */
export type DeFiPositionDetailsSection = {
  /** Section label from the API (`metadata.productName`). */
  productName: string;
  positions: DeFiUnderlyingPosition[];
};

/**
 * One row in the DeFi tab list (a protocol on a given chain), with the details
 * needed to render the details page embedded directly inside it.
 */
export type DeFiProtocolPositionGroup = {
  protocolId: string;
  /**
   * Product name from the first position seen for this protocol. Prefer
   * `protocolId` for the list-row title; use section `productName`s for
   * per-product detail headings.
   */
  productName: string;
  protocolIconUrl: string;
  chainId: CaipChainId;
  /**
   * Aggregated fiat market value across all positions in the group.
   * `lending` positions are subtracted; all other types are added.
   */
  marketValue: number;
  /** Icon-group entries for the list row. */
  iconGroup: DeFiPositionIconGroupItem[];
  /**
   * Detail sections consumed by the details page, one per distinct API
   * `productName` under this `protocolId`.
   */
  sections: DeFiPositionDetailsSection[];
};

/**
 * DeFi positions for every queried account, keyed by the internal MetaMask
 * account ID (`InternalAccount.id` UUID), the same key AssetsController uses.
 * Each account maps to a flat list of protocol groups; filter by each group's
 * `chainId` rather than digging through a nested chain map.
 */
export type DeFiPositionsByAccount = {
  [accountId: string]: DeFiProtocolPositionGroup[];
};

// Prefer ETH/WETH first in the list-row icon stack when a protocol has multiple
// underlyings. Display-only.
const SYMBOL_PRIORITY = ['ETH', 'WETH'];

type DefiBalanceWithMetadata = V6BalanceItem & { metadata: V6BalanceMetadata };

/**
 * Builds a static token icon URL for a CAIP asset ID.
 *
 * @param assetId - The CAIP-19 asset ID.
 * @returns The token icon URL, or `undefined` when it cannot be built.
 */
function getDefiTokenImageUrl(assetId: CaipAssetType): string | undefined {
  try {
    const { chainId } = parseCaipAssetType(assetId);
    const { namespace } = parseCaipChainId(chainId);
    const isEvm = namespace === KnownCaipNamespace.Eip155;
    const normalizedAssetId = (isEvm ? assetId.toLowerCase() : assetId).replace(
      /:/gu,
      '/',
    );

    return `${STATIC_METAMASK_BASE_URL}/api/v2/tokenIcons/assets/${normalizedAssetId}.png`;
  } catch {
    return undefined;
  }
}

/**
 * Returns whether a balance row is a DeFi position carrying protocol metadata.
 *
 * @param balance - A balance row from the v6 API.
 * @returns True when the row is a `category: defi` row with protocol metadata.
 */
function isDefiBalanceWithMetadata(
  balance: V6BalanceItem,
): balance is DefiBalanceWithMetadata {
  return (
    balance.category === 'defi' &&
    balance.metadata !== undefined &&
    (balance.metadata as Partial<V6BalanceMetadata>).protocolId !== undefined
  );
}

/**
 * Returns the fiat market value for a v6 DeFi balance row.
 *
 * @param balance - A balance row from the v6 API.
 * @returns The fiat value, or `undefined` when price is missing or the
 * balance/price is invalid.
 */
function getMarketValue(balance: V6BalanceItem): number | undefined {
  if (balance.price === undefined) {
    return undefined;
  }

  const normalizedBalance = Number.parseFloat(balance.balance);
  const price = Number.parseFloat(balance.price);

  if (!Number.isFinite(normalizedBalance) || !Number.isFinite(price)) {
    return undefined;
  }

  return normalizedBalance * price;
}

/**
 * Returns the sign used when rolling a position's market value into a protocol
 * group total. Liability types (currently `lending`) subtract; all others add.
 *
 * @param positionType - The position's protocol module type.
 * @returns `-1` for liabilities, `1` otherwise.
 */
function getMarketValueSign(positionType: DeFiPositionType): 1 | -1 {
  return DEFI_POSITION_LIABILITY_TYPES.has(positionType) ? -1 : 1;
}

/**
 * Moves a priority symbol (ETH/WETH) to the front of the icon group, in place.
 *
 * @param iconGroup - The icon-group entries to reorder.
 */
function orderIconGroup(iconGroup: DeFiPositionIconGroupItem[]): void {
  const priorityIndex = iconGroup.findIndex((item) =>
    SYMBOL_PRIORITY.includes(item.symbol),
  );

  if (priorityIndex > 0) {
    const [priorityIcon] = iconGroup.splice(priorityIndex, 1);
    iconGroup.unshift(priorityIcon);
  }
}

/**
 * Maps a DeFi balance row to a details-page underlying position.
 *
 * @param balance - A DeFi balance row with protocol metadata.
 * @returns The underlying position for the details page.
 */
function toUnderlyingPosition(
  balance: DefiBalanceWithMetadata,
): DeFiUnderlyingPosition {
  const assetId = balance.assetId as CaipAssetType;
  const { chainId } = parseCaipAssetType(assetId);
  const { positionType, poolAddress, groupId } = balance.metadata;

  return {
    assetId,
    chainId,
    symbol: balance.symbol,
    name: balance.name,
    balance: balance.balance,
    decimals: balance.decimals,
    marketValue: getMarketValue(balance),
    positionType,
    poolAddress,
    groupId,
    tokenImage: getDefiTokenImageUrl(assetId),
  };
}

/**
 * Builds a chain-reference-agnostic key (`namespace:address`) for matching the
 * CAIP-10 account IDs we request against the ones the v6 API echoes back.
 *
 * We request EVM balances with the all-chains reference (`eip155:0:<address>`),
 * but the response echoes a separate per-chain ID for every chain
 * (`eip155:1:<address>`, `eip155:137:<address>`, ...). Matching on the full
 * CAIP-10 string therefore fails, so we drop the reference and match on
 * namespace + address instead. EVM addresses are lowercased; other namespaces
 * keep their case.
 *
 * @param caipAccountId - A CAIP-10 account ID.
 * @returns The match key, or a case-normalized fallback if parsing fails.
 */
function toAccountMatchKey(caipAccountId: string): string {
  try {
    const {
      chain: { namespace },
      address,
    } = parseCaipAccountId(caipAccountId as CaipAccountId);
    const normalizedAddress =
      namespace === KnownCaipNamespace.Eip155 ? address.toLowerCase() : address;
    return `${namespace}:${normalizedAddress}`;
  } catch {
    return caipAccountId.startsWith(`${KnownCaipNamespace.Eip155}:`)
      ? caipAccountId.toLowerCase()
      : caipAccountId;
  }
}

/**
 * Transforms a v6 multiaccount balances response into the stored DeFi state:
 * positions keyed by internal account ID, each mapping to a flat list of
 * protocol groups. Every group carries its own `chainId` (so the client can
 * filter without a nested chain map) plus both the DeFi-tab summary and the
 * details-page sections. Accounts present in the response but with no DeFi
 * positions are included with an empty list so stale data is cleared.
 *
 * When `internalAccountIdByCaip` is provided, response account IDs are matched
 * to internal MetaMask account IDs via namespace + address (ignoring chain
 * reference and EVM case). Unmatched accounts are skipped. When omitted, the
 * response account ID is used as-is (handy for unit tests).
 *
 * @param response - The v6 multiaccount balances response.
 * @param internalAccountIdByCaip - Optional map of request CAIP-10 account IDs
 * to internal MetaMask account IDs.
 * @returns DeFi positions keyed by internal account ID.
 */
export function groupDeFiPositionsV6(
  response: V6BalancesResponse,
  internalAccountIdByCaip?: Map<string, string>,
): DeFiPositionsByAccount {
  const internalAccountIdByMatchKey = internalAccountIdByCaip
    ? new Map(
        [...internalAccountIdByCaip].map(([caipAccountId, internalId]) => [
          toAccountMatchKey(caipAccountId),
          internalId,
        ]),
      )
    : undefined;

  // Accumulate groups per resolved internal account ID. The v6 response returns
  // a separate entry per chain (e.g. `eip155:1:<addr>`, `eip155:137:<addr>`),
  // and several of them can resolve to the same internal account ID, so we must
  // merge across all of them rather than overwrite per response account.
  const groupsByAccountKey = new Map<
    string,
    Map<string, DeFiProtocolPositionGroup>
  >();

  for (const account of response.accounts) {
    const accountId = internalAccountIdByMatchKey
      ? internalAccountIdByMatchKey.get(toAccountMatchKey(account.accountId))
      : account.accountId;
    if (accountId === undefined) {
      continue;
    }

    // Seed every queried account so accounts that no longer hold positions
    // overwrite (clear) any previously stored data.
    let groupsByKey = groupsByAccountKey.get(accountId);
    if (!groupsByKey) {
      groupsByKey = new Map<string, DeFiProtocolPositionGroup>();
      groupsByAccountKey.set(accountId, groupsByKey);
    }

    for (const balance of account.balances) {
      if (!isDefiBalanceWithMetadata(balance)) {
        continue;
      }

      const position = toUnderlyingPosition(balance);
      const { protocolId, productName, protocolIconUrl } = balance.metadata;
      const groupKey = `${position.chainId}#${protocolId}`;

      let group = groupsByKey.get(groupKey);
      if (!group) {
        group = {
          protocolId,
          productName,
          protocolIconUrl,
          chainId: position.chainId,
          marketValue: 0,
          iconGroup: [],
          sections: [],
        };
        groupsByKey.set(groupKey, group);
      }

      if (position.marketValue !== undefined) {
        group.marketValue +=
          position.marketValue * getMarketValueSign(position.positionType);
      }

      if (!group.iconGroup.some((item) => item.symbol === position.symbol)) {
        group.iconGroup.push({
          symbol: position.symbol,
          avatarValue: position.tokenImage,
        });
      }

      // Sections are keyed by productName; distinct groupIds under the same
      // product remain available on each underlying position.
      let section = group.sections.find(
        (item) => item.productName === productName,
      );
      if (!section) {
        section = { productName, positions: [] };
        group.sections.push(section);
      }
      section.positions.push(position);
    }
  }

  const result: DeFiPositionsByAccount = {};
  for (const [accountId, groupsByKey] of groupsByAccountKey) {
    const groups = [...groupsByKey.values()];
    for (const group of groups) {
      orderIconGroup(group.iconGroup);
    }
    result[accountId] = groups;
  }

  return result;
}
