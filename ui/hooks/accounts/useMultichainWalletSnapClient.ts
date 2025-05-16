import { Sender } from '@metamask/keyring-snap-client';
import { HandlerType } from '@metamask/snaps-utils';
import { Json, JsonRpcRequest } from '@metamask/utils';
import { SnapId } from '@metamask/snaps-sdk';
import { useMemo } from 'react';
import { SnapKeyringInternalOptions } from '@metamask/eth-snap-keyring';
import { KeyringAccount } from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  createSnapAccount,
  getNextAvailableAccountName,
  handleSnapRequest,
  multichainUpdateBalance,
  multichainUpdateTransactions,
} from '../../store/actions';
import {
  BITCOIN_WALLET_SNAP_ID,
  BITCOIN_WALLET_NAME,
} from '../../../shared/lib/accounts/bitcoin-wallet-snap';
import {
  SOLANA_WALLET_SNAP_ID,
  SOLANA_WALLET_NAME,
} from '../../../shared/lib/accounts/solana-wallet-snap';
import {
  getNextAvailableSnapAccountName,
  SnapAccountNameOptions,
  WalletSnapClient,
  WalletSnapOptions,
} from '../../../shared/lib/accounts';

export enum WalletClientType {
  Bitcoin = 'bitcoin-wallet-snap',
  Solana = 'solana-wallet-snap',
}

const WALLET_SNAP_MAP: Record<WalletClientType, { id: SnapId; name: string }> =
  {
    [WalletClientType.Bitcoin]: {
      id: BITCOIN_WALLET_SNAP_ID,
      name: BITCOIN_WALLET_NAME,
    },
    [WalletClientType.Solana]: {
      id: SOLANA_WALLET_SNAP_ID,
      name: SOLANA_WALLET_NAME,
    },
  };

export class MultichainWalletSnapSender implements Sender {
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

export function useMultichainWalletSnapSender(snapId: SnapId) {
  const client = useMemo(() => {
    return new MultichainWalletSnapSender(snapId);
  }, [snapId]);

  return client;
}

export type MultichainWalletSnapOptions = WalletSnapOptions;

export class MultichainWalletSnapClient implements WalletSnapClient {
  readonly #snapId: SnapId;

  readonly #snapName: string;

  constructor(clientType: WalletClientType) {
    const { id, name } = WALLET_SNAP_MAP[clientType];
    this.#snapId = id;
    this.#snapName = name;
    if (!this.#snapId) {
      throw new Error(`Unsupported client type: ${clientType}`);
    }
  }

  getSnapId(): SnapId {
    return this.#snapId;
  }

  getSnapName(): string {
    return this.#snapName;
  }

  async createAccount(
    options: WalletSnapOptions,
    internalOptions?: SnapKeyringInternalOptions,
  ): Promise<KeyringAccount> {
    // This will trigger the Snap account creation flow (+ account renaming)
    const account = await createSnapAccount(
      this.#snapId,
      options,
      internalOptions,
    );

    // NOTE: The account's balance is going to be tracked automatically on when the new account
    // will be added to the Snap bridge keyring (see `MultichainBalancesController:#handleOnAccountAdded`).
    // However, the balance won't be fetched right away. To workaround this, we trigger the
    // fetch explicitly here (since we are already in a `async` call) and wait for it to be updated!
    await multichainUpdateBalance(account.id);
    // TODO: Remove this and the above line once Snap account creation flow is async
    await multichainUpdateTransactions(account.id);

    return account;
  }

  async getNextAvailableAccountName(
    options?: SnapAccountNameOptions,
  ): Promise<string> {
    return getNextAvailableSnapAccountName(
      async () => getNextAvailableAccountName(KeyringTypes.snap),
      this.#snapId,
      options,
    );
  }
}

export function useMultichainWalletSnapClient(clientType: WalletClientType) {
  const client = useMemo(() => {
    return new MultichainWalletSnapClient(clientType);
  }, [clientType]);

  return client;
}
