import { HandlerType } from '@metamask/snaps-utils';
import log from 'loglevel';
import type { HandleSnapRequest } from '@metamask/snaps-controllers';
import { SOLANA_WALLET_SNAP_ID } from '../../../../../shared/lib/accounts';

export type SignRewardsMessageResult = {
  signature: string;
  signedMessage: string;
  signatureType: 'ed25519';
};

export async function signSolanaRewardsMessage(
  handleSnapRequest: HandleSnapRequest['handler'],
  accountId: string,
  message: string,
): Promise<SignRewardsMessageResult> {
  try {
    const result = await handleSnapRequest({
      origin: 'metamask',
      snapId: SOLANA_WALLET_SNAP_ID,
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
        'Solana snap account not yet initialized for rewards message signing. This is expected during app initialization.',
        { accountId },
      );
      throw new Error(
        'Solana snap account state not yet synchronized. Silent auth will be retried.',
      );
    }
    log.error('Error signing Solana rewards message:', error);
    throw error;
  }
}
