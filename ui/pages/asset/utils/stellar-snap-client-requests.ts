import { HandlerType } from '@metamask/snaps-utils';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';

import { STELLAR_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/stellar-wallet-snap';
import { handleSnapRequest } from '../../../store/actions';

/**
 * Request the Stellar wallet snap to add a classic trustline (`changeTrustOpt` with action `add`).
 * @param params
 * @param params.accountId
 * @param params.assetId
 * @param params.scope
 * @param params.limit
 */
export async function requestStellarChangeTrustOptAdd(params: {
  accountId: string;
  assetId: CaipAssetType;
  scope: CaipChainId;
  limit?: string;
}): Promise<unknown> {
  return handleSnapRequest({
    snapId: STELLAR_WALLET_SNAP_ID,
    origin: 'metamask',
    handler: HandlerType.OnClientRequest,
    request: {
      method: 'changeTrustOpt',
      params: {
        ...params,
        action: 'add',
      },
    },
  });
}

/**
 * Request the Stellar wallet snap to remove a classic trustline (`changeTrustOpt` with action `delete`).
 * Requires a zero balance on the trustline; the snap validates and prompts for confirmation.
 * @param params
 * @param params.accountId
 * @param params.assetId
 * @param params.scope
 */
export async function requestStellarChangeTrustOptDelete(params: {
  accountId: string;
  assetId: CaipAssetType;
  scope: CaipChainId;
}): Promise<unknown> {
  return handleSnapRequest({
    snapId: STELLAR_WALLET_SNAP_ID,
    origin: 'metamask',
    handler: HandlerType.OnClientRequest,
    request: {
      method: 'changeTrustOpt',
      params: {
        ...params,
        action: 'delete',
      },
    },
  });
}
