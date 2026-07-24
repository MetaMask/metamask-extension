import type { ActivityListItem } from './types';

/**
 * Activity fee marker for a network fee paid by MetaMask instead of the user.
 *
 * ActivityItem fees normally represent token amounts. Sponsored gas has no
 * user-paid token amount, so this marker preserves the sponsorship state while
 * allowing Activity Details to render the network-fee row.
 */
export const GAS_FEE_SPONSORED = 'gas-fee-sponsored';

/**
 * Retrieves sponsored fees from an ActivityListItem.
 *
 * Filters the fees array in the activity item's data to return only fees
 * that are marked as sponsored (where type is GAS_FEE_SPONSORED).
 *
 * @param item - The ActivityListItem to extract sponsored fees from.
 * @returns An array of sponsored fees if present, otherwise undefined.
 */
function getSponsoredFees(item: ActivityListItem) {
  return 'fees' in item.data
    ? item.data.fees?.filter((fee) => fee.type === GAS_FEE_SPONSORED)
    : undefined;
}

/**
 * Copies a sponsored network fee from a local ActivityItem to an API-enriched one.
 *
 * When we have both a local item and an API item for the same transaction, we prefer
 * the API item because it has better token metadata. However, the API doesn't know
 * about our local `isGasFeeSponsored` flag. This function transfers the sponsored
 * fee marker from the local item to the API item while removing any base network fee.
 *
 * @param sourceItem - The local ActivityItem that contains the sponsored fee marker.
 * @param targetItem - The API-enriched ActivityItem to update.
 * @returns The API item with the sponsored fee marker added.
 */
export function mergeActivityItemSponsoredFees(
  sourceItem: ActivityListItem,
  targetItem: ActivityListItem,
): ActivityListItem {
  const sponsoredFees = getSponsoredFees(sourceItem);

  if (!sponsoredFees?.length || !('fees' in targetItem.data)) {
    return targetItem;
  }

  const nonBaseTargetFees =
    targetItem.data.fees?.filter(
      (fee) => fee.type !== 'base' && fee.type !== GAS_FEE_SPONSORED,
    ) ?? [];

  return {
    ...targetItem,
    data: {
      ...targetItem.data,
      fees: [...sponsoredFees, ...nonBaseTargetFees],
    },
  } as ActivityListItem;
}
