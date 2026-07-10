import { HandlerType } from '@metamask/snaps-utils';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';

import { STELLAR_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/stellar-wallet-snap';
import { handleSnapRequest } from '../../../store/actions';

/** Response from the Stellar snap `changeTrustOpt` client request. */
export type StellarChangeTrustOptResult = {
  status: boolean;
  transactionId?: string;
};

/**
 * Request the Stellar wallet snap to add a classic trustline (`changeTrustOpt` with action `add`).
 * @param params - The parameters for the request.
 * @param params.accountId - The account ID.
 * @param params.assetId - The asset ID.
 * @param params.scope - The scope.
 * @param params.limit - The limit.
 *
 * @returns The result of the request.
 */
export async function requestStellarChangeTrustOptAdd(params: {
  accountId: string;
  assetId: CaipAssetType;
  scope: CaipChainId;
  limit?: string;
}): Promise<StellarChangeTrustOptResult> {
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
  }) as Promise<StellarChangeTrustOptResult>;
}

/**
 * Request the Stellar wallet snap to remove a classic trustline (`changeTrustOpt` with action `delete`).
 * Requires a zero balance on the trustline; the snap validates and prompts for confirmation.
 *
 * @param params - The parameters for the request.
 * @param params.accountId - The account ID.
 * @param params.assetId - The asset ID.
 * @param params.scope - The scope.
 */
export async function requestStellarChangeTrustOptDelete(params: {
  accountId: string;
  assetId: CaipAssetType;
  scope: CaipChainId;
}): Promise<void> {
  await handleSnapRequest({
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
