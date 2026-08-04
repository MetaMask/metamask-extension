import type {
  ActivityItem,
  ActivityKind,
  Status,
  TokenAmount,
  FiatAmount,
  Fee,
} from '@metamask/client-utils';

export type { ActivityKind, Status, TokenAmount, FiatAmount };

export type ActivityFee = Fee;

/**
 * Extension Activity list/details types for currently supported rows.
 * Exclude rampBuy/rampSell from the package ActivityItem union: those kinds
 * make chainId optional, but this client does not render ramps here yet.
 * When ramps land in Activity, stop excluding them (or add a dedicated
 * RampActivityListItem) and handle optional chainId deliberately.
 */
export type ActivityListItem = Exclude<
  ActivityItem,
  { type: 'rampBuy' | 'rampSell' }
>;

/**
 * Narrows a package ActivityItem to the extension's supported list item.
 * Package mappers are typed against the full ActivityItem union (including
 * ramps); use this at mapper call sites so Activity stays required-chainId.
 *
 * @param item - A mapped activity item from `@metamask/client-utils`.
 * @returns Whether the item is supported by extension Activity today.
 */
export function isActivityListItem(
  item: ActivityItem,
): item is ActivityListItem {
  return item.type !== 'rampBuy' && item.type !== 'rampSell';
}

/**
 * Asserts a client-utils mapper result is an extension ActivityListItem.
 * Safe for `mapLocalTransaction` / `mapApiTransaction` / `mapKeyringTransaction`,
 * which never emit rampBuy/rampSell.
 *
 * @param item - A mapped activity item from `@metamask/client-utils`.
 * @returns The same item typed as ActivityListItem.
 */
export function asActivityListItem(item: ActivityItem): ActivityListItem {
  if (!isActivityListItem(item)) {
    throw new Error(`Unexpected activity kind in Activity: ${item.type}`);
  }
  return item;
}
