import { HandlerType } from '@metamask/snaps-utils';
import log from 'loglevel';
import { SOLANA_WALLET_SNAP_ID } from '../../../../../shared/lib/accounts';
import { handleSnapRequest } from '../../../../../ui/store/actions';

export interface SignRewardsMessageResult {
  signature: string;
  signedMessage: string;
  signatureType: 'ed25519';
}

export async function signSolanaRewardsMessage(
  address: string,
  message: string,
): Promise<SignRewardsMessageResult> {
  try {
    // Method 1: Using handleSnapRequest directly
    const result = await handleSnapRequest({
      origin: 'metamask',
      snapId: SOLANA_WALLET_SNAP_ID,
      handler: HandlerType.OnClientRequest,
      request: {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'signRewardsMessage',
        params: {
          account: {
            address,
          },
          message,
        },
      },
    });

    return result as SignRewardsMessageResult;
  } catch (error) {
    log.error('Error signing Solana rewards message:', error);
    throw error;
  }
}
