import type {
  V6BalanceItem,
  V6BalanceMetadata,
  V6BalancesResponse,
} from '@metamask/core-backend';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { parseCaipAssetType } from '@metamask/utils';
import { getCaipAssetImageUrl } from '../../../../../../shared/lib/asset-utils';

export type DefiProtocolDetailsPosition = {
  assetId: CaipAssetType;
  chainId: CaipChainId;
  symbol: string;
  name: string;
  balance: string;
  normalizedBalance: number;
  decimals: number;
  tokenFiatAmount: number;
  positionType: string;
  poolAddress: string;
  tokenImage: string;
};

export type DefiProtocolDetailsPoolGroup = {
  poolAddress: string;
  positions: DefiProtocolDetailsPosition[];
};

export type DefiProtocolDetailsSection = {
  protocolName: string;
  poolGroups: DefiProtocolDetailsPoolGroup[];
};

export type DefiProtocolDetails = {
  protocolId: string;
  chainId: CaipChainId;
  protocolIconUrl: string;
  aggregatedMarketValue: number;
  sections: DefiProtocolDetailsSection[];
};

type DefiBalanceWithMetadata = V6BalanceItem & { metadata: V6BalanceMetadata };

function isDefiBalanceWithMetadata(
  balance: V6BalanceItem,
): balance is DefiBalanceWithMetadata {
  return (
    balance.category === 'defi' &&
    balance.metadata !== undefined &&
    'protocolId' in balance.metadata
  );
}

function getDefiPositionMarketValue(balance: V6BalanceItem): number {
  const normalizedBalance =
    Number.parseFloat(balance.balance) / 10 ** balance.decimals;

  if (!Number.isFinite(normalizedBalance)) {
    return 0;
  }

  const price = Number.parseFloat(balance.price ?? '0');
  if (!Number.isFinite(price)) {
    return 0;
  }

  return normalizedBalance * price;
}

function getNormalizedBalance(balance: V6BalanceItem): number {
  const normalizedBalance =
    Number.parseFloat(balance.balance) / 10 ** balance.decimals;

  return Number.isFinite(normalizedBalance) ? normalizedBalance : 0;
}

function toDefiProtocolDetailsPosition(
  balance: DefiBalanceWithMetadata,
): DefiProtocolDetailsPosition {
  const { chainId } = parseCaipAssetType(balance.assetId as CaipAssetType);
  const { positionType, poolAddress, protocolIconUrl } = balance.metadata;

  return {
    assetId: balance.assetId as CaipAssetType,
    chainId,
    symbol: balance.symbol,
    name: balance.name,
    balance: balance.balance,
    normalizedBalance: getNormalizedBalance(balance),
    decimals: balance.decimals,
    tokenFiatAmount: getDefiPositionMarketValue(balance),
    positionType,
    poolAddress,
    tokenImage:
      getCaipAssetImageUrl(balance.assetId as CaipAssetType) ??
      protocolIconUrl,
  };
}

/**
 * Filters v6 DeFi balance rows to a specific chain and protocol.
 *
 * @param response - Multi-account balances response from the v6 API.
 * @param chainId - CAIP chain ID for the selected protocol.
 * @param protocolId - Protocol identifier for the selected protocol.
 * @returns Matching DeFi balance rows across all accounts.
 */
export function filterDefiBalancesByProtocol(
  response: V6BalancesResponse | undefined,
  chainId: CaipChainId,
  protocolId: string,
): DefiBalanceWithMetadata[] {
  if (!response) {
    return [];
  }

  const balances: DefiBalanceWithMetadata[] = [];

  for (const account of response.accounts) {
    for (const balance of account.balances) {
      if (!isDefiBalanceWithMetadata(balance)) {
        continue;
      }

      const { chainId: balanceChainId } = parseCaipAssetType(
        balance.assetId as CaipAssetType,
      );

      if (
        balanceChainId === chainId &&
        balance.metadata.protocolId === protocolId
      ) {
        balances.push(balance);
      }
    }
  }

  return balances;
}

/**
 * Groups DeFi balance rows by protocol name, then by pool address.
 *
 * @param balances - DeFi balance rows for a single protocol.
 * @returns Sections keyed by protocol name with pool-address groups inside.
 */
export function groupDefiProtocolDetailsSections(
  balances: DefiBalanceWithMetadata[],
): DefiProtocolDetailsSection[] {
  const sectionMap = new Map<
    string,
    Map<string, DefiProtocolDetailsPosition[]>
  >();

  for (const balance of balances) {
    const { protocolName } = balance.metadata;
    const position = toDefiProtocolDetailsPosition(balance);

    let poolGroups = sectionMap.get(protocolName);
    if (!poolGroups) {
      poolGroups = new Map();
      sectionMap.set(protocolName, poolGroups);
    }

    const existingPositions = poolGroups.get(position.poolAddress) ?? [];
    existingPositions.push(position);
    poolGroups.set(position.poolAddress, existingPositions);
  }

  return [...sectionMap.entries()].map(([protocolName, poolGroups]) => ({
    protocolName,
    poolGroups: [...poolGroups.entries()].map(
      ([poolAddress, positions]) => ({
        poolAddress,
        positions,
      }),
    ),
  }));
}

/**
 * Builds the DeFi protocol details view model for a selected protocol.
 *
 * @param response - Multi-account balances response from the v6 API.
 * @param chainId - CAIP chain ID for the selected protocol.
 * @param protocolId - Protocol identifier for the selected protocol.
 * @returns Aggregated protocol details, or undefined when no rows match.
 */
export function groupDefiProtocolDetails(
  response: V6BalancesResponse | undefined,
  chainId: CaipChainId,
  protocolId: string,
): DefiProtocolDetails | undefined {
  const balances = filterDefiBalancesByProtocol(response, chainId, protocolId);

  if (balances.length === 0) {
    return undefined;
  }

  const sections = groupDefiProtocolDetailsSections(balances);
  const aggregatedMarketValue = balances.reduce(
    (total, balance) => total + getDefiPositionMarketValue(balance),
    0,
  );

  return {
    protocolId,
    chainId,
    protocolIconUrl: balances[0].metadata.protocolIconUrl,
    aggregatedMarketValue,
    sections,
  };
}
