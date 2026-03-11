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
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string' &&
      error.message.toLowerCase().includes('account not found')
    ) {
      log.debug(
        'Tron snap account not yet initialized for rewards message signing. This is expected during app initialization.',
        { accountId },
      );
      throw new Error(
        'Tron snap account state not yet synchronized. Silent auth will be retried.',
      );
    }
    log.error('Error signing Tron rewards message:', error);
    throw error;
  }
}
