import { formatChainIdToCaip } from '@metamask/bridge-controller';
import {
  type CaipChainId,
  hasProperty,
  isCaipChainId,
  isPlainObject,
} from '@metamask/utils';
import { ALLOWED_BRIDGE_CHAIN_IDS } from '../../constants/bridge';

export type ChainRankingEntry = {
  chainId: CaipChainId;
  name: string;
};

export type PromotedChain = ChainRankingEntry;

export type ChainValueOrderOverride = {
  positionOverrides: PromotedChain[];
};

export type HoldingsByChain = Partial<Record<CaipChainId, number>>;

const EMPTY_POSITION_OVERRIDES: readonly PromotedChain[] = Object.freeze([]);
const ALLOWED_CAIP_CHAIN_IDS = new Set(
  ALLOWED_BRIDGE_CHAIN_IDS.map(formatChainIdToCaip),
);

function isPromotedChain(value: unknown): value is PromotedChain {
  return (
    isPlainObject(value) &&
    hasProperty(value, 'chainId') &&
    isCaipChainId(value.chainId) &&
    ALLOWED_CAIP_CHAIN_IDS.has(value.chainId) &&
    hasProperty(value, 'name') &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0
  );
}

/**
 * Parses the controller-processed chain-order override configuration.
 *
 * @param value - Processed remote feature flag value.
 * @returns Ordered, valid chain promotions.
 */
export function parsePositionOverrides(
  value: unknown,
): readonly PromotedChain[] {
  if (
    !isPlainObject(value) ||
    !hasProperty(value, 'positionOverrides') ||
    !Array.isArray(value.positionOverrides)
  ) {
    return EMPTY_POSITION_OVERRIDES;
  }

  const seenChainIds = new Set<CaipChainId>();
  const promotedChains: PromotedChain[] = [];

  for (const entry of value.positionOverrides) {
    if (!isPromotedChain(entry) || seenChainIds.has(entry.chainId)) {
      continue;
    }

    seenChainIds.add(entry.chainId);
    promotedChains.push({
      chainId: entry.chainId,
      name: entry.name,
    });
  }

  return promotedChains.length > 0 ? promotedChains : EMPTY_POSITION_OVERRIDES;
}

function getHoldingsValue(
  holdingsByChain: HoldingsByChain,
  chainId: CaipChainId,
): number {
  const value = holdingsByChain[chainId];

  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

/**
 * Orders allowed chains by holdings value, then applies remote promotions.
 *
 * @param chainRanking - Allowed chains in LaunchDarkly ranking order.
 * @param holdingsByChain - Selected-account-group fiat totals by chain.
 * @param promotedChains - Ordered remote promotion list.
 * @returns A new ordered chain array.
 */
export function getChainValueOrder(
  chainRanking: readonly ChainRankingEntry[],
  holdingsByChain: HoldingsByChain,
  promotedChains: readonly PromotedChain[],
): ChainRankingEntry[] {
  const rankedChains = chainRanking
    .map((chain, rankingIndex) => ({
      chain,
      holdingsValue: getHoldingsValue(holdingsByChain, chain.chainId),
      rankingIndex,
    }))
    .sort(
      (first, second) =>
        second.holdingsValue - first.holdingsValue ||
        first.rankingIndex - second.rankingIndex,
    );

  const rankedChainsById = new Map(
    rankedChains.map((rankedChain) => [rankedChain.chain.chainId, rankedChain]),
  );
  const promotedChainIds = new Set<CaipChainId>();
  const promotedPrefix = promotedChains.flatMap(({ chainId }) => {
    const rankedChain = rankedChainsById.get(chainId);

    if (!rankedChain || promotedChainIds.has(chainId)) {
      return [];
    }

    promotedChainIds.add(chainId);
    return [rankedChain];
  });

  return [
    ...promotedPrefix,
    ...rankedChains.filter(({ chain }) => !promotedChainIds.has(chain.chainId)),
  ].map(({ chain }) => chain);
}
