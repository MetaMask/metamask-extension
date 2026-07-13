import type {
  V6BalanceItem,
  V6BalanceMetadata,
  V6BalancesResponse,
} from '@metamask/core-backend';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { parseCaipAssetType } from '@metamask/utils';
import { getCaipAssetImageUrl } from '../../../../../../shared/lib/asset-utils';

export type GroupedDeFiProtocolPosition = {
  chainId: CaipChainId;
  protocolId: string;
  title: string;
  tokenImage: string;
  underlyingSymbols: string[];
  iconGroup: { avatarValue: string; symbol: string }[];
  tokenFiatAmount: number;
};

type MutableGroupedPosition = GroupedDeFiProtocolPosition & {
  symbolMap: Map<string, { avatarValue: string; symbol: string }>;
};

const SYMBOL_PRIORITY = ['ETH', 'WETH'];

function isDefiBalanceWithMetadata(
  balance: V6BalanceItem,
): balance is V6BalanceItem & { metadata: V6BalanceMetadata } {
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

function orderIconGroup(
  iconGroup: { avatarValue: string; symbol: string }[],
): { avatarValue: string; symbol: string }[] {
  const orderedIcons = [...iconGroup];
  const priorityIndex = orderedIcons.findIndex((item) =>
    SYMBOL_PRIORITY.includes(item.symbol),
  );

  if (priorityIndex > 0) {
    const [priorityIcon] = orderedIcons.splice(priorityIndex, 1);
    orderedIcons.unshift(priorityIcon);
  }

  return orderedIcons;
}

function toGroupedPosition(
  group: MutableGroupedPosition,
): GroupedDeFiProtocolPosition {
  const iconGroup = orderIconGroup([...group.symbolMap.values()]);

  return {
    chainId: group.chainId,
    protocolId: group.protocolId,
    title: group.title,
    tokenImage: group.tokenImage,
    underlyingSymbols: iconGroup.map(({ symbol }) => symbol),
    iconGroup,
    tokenFiatAmount: group.tokenFiatAmount,
  };
}

/**
 * Groups flat v6 DeFi balance rows by chain and protocol ID.
 *
 * @param response - Multi-account balances response from the v6 API.
 * @returns Aggregated protocol positions keyed by chain and protocol.
 */
export function groupDefiProtocolPositions(
  response: V6BalancesResponse | undefined,
): GroupedDeFiProtocolPosition[] {
  if (!response) {
    return [];
  }

  const groups = new Map<string, MutableGroupedPosition>();

  for (const account of response.accounts) {
    for (const balance of account.balances) {
      if (!isDefiBalanceWithMetadata(balance)) {
        continue;
      }

      const { chainId } = parseCaipAssetType(balance.assetId as CaipAssetType);
      const { protocolId, protocolIconUrl } = balance.metadata;
      const groupKey = `${chainId}#${protocolId}`;
      const marketValue = getDefiPositionMarketValue(balance);
      const avatarValue =
        getCaipAssetImageUrl(balance.assetId as CaipAssetType) ?? '';
      const symbolEntry = {
        symbol: balance.symbol,
        avatarValue,
      };

      const existingGroup = groups.get(groupKey);
      if (existingGroup) {
        existingGroup.tokenFiatAmount += marketValue;
        existingGroup.symbolMap.set(balance.symbol, symbolEntry);
        continue;
      }

      groups.set(groupKey, {
        chainId,
        protocolId,
        title: protocolId,
        tokenImage: protocolIconUrl,
        underlyingSymbols: [],
        iconGroup: [],
        tokenFiatAmount: marketValue,
        symbolMap: new Map([[balance.symbol, symbolEntry]]),
      });
    }
  }

  return [...groups.values()].map(toGroupedPosition);
}

/**
 * Returns whether any account in the response is still indexing DeFi positions.
 *
 * @param response - Multi-account balances response from the v6 API.
 * @returns True when upstream DeFi indexing is still in progress.
 */
export function isDefiBalancesProcessing(
  response: V6BalancesResponse | undefined,
): boolean {
  return (
    response?.accounts.some(
      (account) => account.processingDefiPositions === true,
    ) ?? false
  );
}

/**
 * Filters grouped DeFi protocol positions to enabled CAIP chain IDs.
 *
 * @param positions - Grouped protocol positions.
 * @param enabledCaipChainIds - Enabled networks as CAIP chain IDs.
 * @returns Positions whose chain is enabled in the wallet.
 */
export function filterGroupedDefiProtocolPositions(
  positions: GroupedDeFiProtocolPosition[],
  enabledCaipChainIds: CaipChainId[],
): GroupedDeFiProtocolPosition[] {
  const enabledChainIds = new Set(enabledCaipChainIds);

  return positions.filter((position) => enabledChainIds.has(position.chainId));
}
