import { SnapKeyringInternalOptions } from '@metamask/eth-snap-keyring';
import { KeyringAccount } from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { Sender } from '@metamask/keyring-snap-client';
import { SnapId } from '@metamask/snaps-sdk';
import { HandlerType } from '@metamask/snaps-utils';
import { Json, JsonRpcRequest } from '@metamask/utils';
import { useMemo } from 'react';
import {
  getNextAvailableSnapAccountName,
  SnapAccountNameOptions,
  WalletSnapClient,
  CreateAccountSnapOptions,
} from '../../../shared/lib/accounts';
import {
  BITCOIN_WALLET_NAME,
  BITCOIN_WALLET_SNAP_ID,
} from '../../../shared/lib/accounts/bitcoin-wallet-snap';
import {
  SOLANA_WALLET_NAME,
  SOLANA_WALLET_SNAP_ID,
} from '../../../shared/lib/accounts/solana-wallet-snap';
import {
  createSnapAccount,
  getNextAvailableAccountName,
  handleSnapRequest,
} from '../../store/actions';

export enum WalletClientType {
  Bitcoin = 'bitcoin-wallet-snap',
  Solana = 'solana-wallet-snap',
}

export const EVM_WALLET_TYPE = 'evm' as const;

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
    options: CreateAccountSnapOptions,
    internalOptions?: SnapKeyringInternalOptions,
  ): Promise<KeyringAccount> {
    const snapOptions =
      this.#snapId === BITCOIN_WALLET_SNAP_ID
        ? { ...options, synchronize: true }
        : options;

    // This will trigger the Snap account creation flow (+ account renaming)
    const account = await createSnapAccount(
      this.#snapId,
      snapOptions,
      internalOptions,
    );

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
