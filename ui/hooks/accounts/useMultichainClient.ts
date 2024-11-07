import { KeyringClient, Sender } from '@metamask/keyring-api';
import { HandlerType } from '@metamask/snaps-utils';
import { CaipChainId, Json, JsonRpcRequest } from '@metamask/utils';
import { useMemo } from 'react';
import {
  handleSnapRequest,
  multichainUpdateBalance,
} from '../../store/actions';
import { BITCOIN_WALLET_SNAP_ID } from '../../../shared/lib/accounts/bitcoin-wallet-snap';
import { SOLANA_WALLET_SNAP_ID } from '../../../shared/lib/accounts/solana-wallet-snap';

export enum WalletClientType {
  Bitcoin = 'bitcoin-wallet-snap',
  Solana = 'solana-wallet-snap',
}

const SNAP_ID_MAP: Record<WalletClientType, SnapId> = {
  [WalletClientType.Bitcoin]: BITCOIN_WALLET_SNAP_ID,
  [WalletClientType.Solana]: SOLANA_WALLET_SNAP_ID,
};

export class MultichainSender implements Sender {
  private snapId: SnapId;

  constructor(snapId: SnapId) {
    this.snapId = snapId;
  }

  send = async (request: JsonRpcRequest): Promise<Json> => {
    // We assume the caller of this module is aware of this. If we try to use this module
    // without having the pre-installed Snap, this will likely throw an error in
    // the `handleSnapRequest` action.
    return (await handleSnapRequest({
      origin: 'metamask',
      snapId: this.snapId,
      handler: HandlerType.OnKeyringRequest,
      request,
    })) as Json;
  };
}

export class MultichainClient {
  readonly #client: KeyringClient;

  constructor(clientType: WalletClientType) {
    const snapId = SNAP_ID_MAP[clientType];
    if (!snapId) {
      throw new Error(`Unsupported client type: ${clientType}`);
    }
    this.#client = new KeyringClient(new MultichainSender(snapId));
  }

  async createAccount(scope: CaipChainId) {
    // This will trigger the Snap account creation flow (+ account renaming)
    const account = await this.#client.createAccount({
      scope,
    });

    await multichainUpdateBalance(account.id);
  }
}

export function useMultichainClient(clientType: WalletClientType) {
  const client = useMemo(() => {
    return new MultichainClient(clientType);
  }, [clientType]);

  return client;
}
