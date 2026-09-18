import { StatusTypes } from '@metamask/bridge-controller';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import type { Status } from '../../../../../shared/lib/activity/types';

/**
 * Resolves the status to display for a bridge activity item.
 *
 * The indexed accounts API only sees the source chain, so an API-derived bridge
 * item reports `success` as soon as the source transaction confirms — even while
 * the destination leg is still in flight. When local bridge history is
 * available it carries the true end-to-end status, so prefer it.
 *
 * @param fallbackStatus - The status from the activity item (source-chain only).
 * @param bridgeHistoryItem - The local bridge history item, if available.
 * @returns The status to display for the bridge.
 */
export function getBridgeDisplayStatus(
  fallbackStatus: Status,
  bridgeHistoryItem?: BridgeHistoryItem,
): Status {
  const bridgeStatus = bridgeHistoryItem?.status?.status;

  if (!bridgeStatus) {
    return fallbackStatus;
  }

  switch (bridgeStatus) {
    case StatusTypes.COMPLETE:
      return 'success';
    case StatusTypes.FAILED:
      return 'failed';
    default:
      // The destination leg is still in flight, but if the source-chain
      // transaction already failed the whole bridge has failed, so let that
      // take precedence over showing a misleading pending state.
      return fallbackStatus === 'failed' ? 'failed' : 'pending';
  }
}
