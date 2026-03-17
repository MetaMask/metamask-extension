import { HandlerType } from '@metamask/snaps-utils';
import log from 'loglevel';
import type { HandleSnapRequest } from '@metamask/snaps-controllers';
import { TRON_WALLET_SNAP_ID } from '../../../../../shared/lib/accounts';

export type SignRewardsMessageResult = {
  signature: string;
  signedMessage: string;
  signatureType: string;
};

export async function signTronRewardsMessage(
  handleSnapRequest: HandleSnapRequest['handler'],
  accountId: string,
  message: string,
): Promise<SignRewardsMessageResult> {
  try {
    const result = await handleSnapRequest({
      origin: 'metamask',
      snapId: TRON_WALLET_SNAP_ID,
      handler: HandlerType.OnClientRequest,
      request: {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'signRewardsMessage',
        params: {
          accountId,
          message,
        },
      },
    });

    return result as SignRewardsMessageResult;
  } catch (error) {
    log.error('Error signing Tron rewards message:', error);
    throw error;
  }
}
