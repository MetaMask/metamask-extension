import EventEmitter from 'events';
import type { BlockTracker, NetworkState } from '@metamask/network-controller';
import type { Hex } from '@metamask/utils';
import log from 'loglevel';
import {
  TransactionMeta,
  TransactionStatus,
} from '../../../../shared/constants/transaction';
import { RemoteTransactionSource } from './types';

export class IncomingTransactionHelper {
  hub: EventEmitter;

  #blockTracker: BlockTracker;

  #getCurrentAccount: () => string;

  #getLocalTransactions: () => TransactionMeta[];

  #getNetworkState: () => NetworkState;

  #incomingOnly: boolean;

  #isEnabled: () => boolean;

  #isRunning: boolean;

  #lastFetchedBlockNumbers: Record<string, number>;

  #onLatestBlock: (blockNumberHex: Hex) => Promise<void>;

  #remoteTransactionSource: RemoteTransactionSource;

  #transactionLimit?: number;

  constructor({
    blockTracker,
    getCurrentAccount,
    getLocalTransactions,
    getNetworkState,
    incomingOnly,
    isEnabled,
    lastFetchedBlockNumbers,
    remoteTransactionSource,
    transactionLimit,
  }: {
    blockTracker: BlockTracker;
    getCurrentAccount: () => string;
    getNetworkState: () => NetworkState;
    getLocalTransactions?: () => TransactionMeta[];
    incomingOnly?: boolean;
    isEnabled?: () => boolean;
    lastFetchedBlockNumbers?: Record<string, number>;
    remoteTransactionSource: RemoteTransactionSource;
    transactionLimit?: number;
  }) {
    this.hub = new EventEmitter();

    this.#blockTracker = blockTracker;
    this.#getCurrentAccount = getCurrentAccount;
    this.#getLocalTransactions = getLocalTransactions || (() => []);
    this.#getNetworkState = getNetworkState;
    this.#incomingOnly = incomingOnly ?? false;
    this.#isEnabled = isEnabled ?? (() => true);
    this.#isRunning = false;
    this.#lastFetchedBlockNumbers = lastFetchedBlockNumbers ?? {};
    this.#remoteTransactionSource = remoteTransactionSource;
    this.#transactionLimit = transactionLimit;

    // Using a property instead of a method to provide a listener reference
    // with the correct scope that we can remove later if stopped.
    this.#onLatestBlock = async (blockNumberHex: Hex) => {
      try {
        await this.#update(blockNumberHex);
      } catch (error) {
        log.error('Error while checking incoming transactions', error);
      }
    };
  }

  start() {
    if (this.#isRunning) {
      return;
    }

    if (!this.#canStart()) {
      return;
    }

    this.#blockTracker.addListener('latest', this.#onLatestBlock);
    this.#isRunning = true;
  }

  stop() {
    this.#blockTracker.removeListener('latest', this.#onLatestBlock);
    this.#isRunning = false;
  }

  async #update(latestBlockNumberHex: Hex): Promise<void> {
    if (!this.#canStart()) {
      return;
    }

    const latestBlockNumber = parseInt(latestBlockNumberHex, 16);
    const fromBlock = this.#getFromBlock(latestBlockNumber);
    const address = this.#getCurrentAccount();
    const localTransactions = this.#getLocalTransactions();
    const currentChainId = this.#getCurrentChainId();
    const currentNetworkId = this.#getCurrentNetworkId();

    let remoteTransactions = [];

    try {
      remoteTransactions =
        await this.#remoteTransactionSource.fetchTransactions({
          address,
          currentChainId,
          currentNetworkId,
          fromBlock,
          limit: this.#transactionLimit,
        });
    } catch (error: any) {
      log.debug('Ignoring failure to fetch remote transactions', {
        error: error.message,
      });
      return;
    }

    if (this.#incomingOnly) {
      remoteTransactions = remoteTransactions.filter((tx) => {
        return tx.txParams.to?.toLowerCase() === address.toLowerCase();
      });
    }

    const [updateRequired, transactions] = this.#reconcileTransactions(
      localTransactions,
      remoteTransactions,
    );

    this.#updateLastFetchedBlockNumber(address, remoteTransactions);

    if (updateRequired) {
      this.#sortTransactionsByTime(transactions);
      this.hub.emit('updatedTransactions', transactions);
    }
  }

  #sortTransactionsByTime(transactions: TransactionMeta[]) {
    transactions.sort((a, b) => (a.time < b.time ? -1 : 1));
  }

  #reconcileTransactions(
    localTxs: TransactionMeta[],
    remoteTxs: TransactionMeta[],
  ): [boolean, TransactionMeta[]] {
    const updatedTxs: TransactionMeta[] = this.#getUpdatedTransactions(
      remoteTxs,
      localTxs,
    );

    const newTxs: TransactionMeta[] = this.#getNewTransactions(
      remoteTxs,
      localTxs,
    );

    const updatedLocalTxs = localTxs.map((tx: TransactionMeta) => {
      const txIdx = updatedTxs.findIndex(({ hash }) => hash === tx.hash);
      return txIdx === -1 ? tx : updatedTxs[txIdx];
    });

    const updateRequired = newTxs.length > 0 || updatedTxs.length > 0;
    const transactions = [...newTxs, ...updatedLocalTxs];

    return [updateRequired, transactions];
  }

  #getNewTransactions(
    remoteTxs: TransactionMeta[],
    localTxs: TransactionMeta[],
  ): TransactionMeta[] {
    return remoteTxs.filter((tx) => {
      const alreadyInTransactions = localTxs.find(
        ({ hash }) => hash === tx.hash,
      );
      return !alreadyInTransactions;
    });
  }

  #getUpdatedTransactions(
    remoteTxs: TransactionMeta[],
    localTxs: TransactionMeta[],
  ): TransactionMeta[] {
    return remoteTxs.filter((remoteTx) => {
      const isTxOutdated = localTxs.find((localTx) => {
        return (
          remoteTx.hash === localTx.hash &&
          this.#isTransactionOutdated(remoteTx, localTx)
        );
      });
      return isTxOutdated;
    });
  }

  #isTransactionOutdated(
    remoteTx: TransactionMeta,
    localTx: TransactionMeta,
  ): boolean {
    return this.#isStatusOutdated(
      remoteTx.hash,
      localTx.hash,
      remoteTx.status,
      localTx.status,
    );
  }

  #isStatusOutdated(
    remoteTxHash: string | undefined,
    localTxHash: string | undefined,
    remoteTxStatus: TransactionStatus,
    localTxStatus: TransactionStatus,
  ): boolean {
    return remoteTxHash === localTxHash && remoteTxStatus !== localTxStatus;
  }

  #getFromBlock(latestBlockNumber: number): number {
    const lastFetchedKey = this.#getBlockNumberKey();

    const lastFetchedBlockNumber =
      this.#lastFetchedBlockNumbers[lastFetchedKey];

    if (lastFetchedBlockNumber) {
      return lastFetchedBlockNumber + 1;
    }

    // Avoid using latest block as remote transaction source
    // may not have indexed it yet
    return Math.max(latestBlockNumber - 10, 0);
  }

  #updateLastFetchedBlockNumber(
    address: string,
    transactions: TransactionMeta[],
  ) {
    let lastFetchedBlockNumber = -1;

    for (const tx of transactions) {
      const toCurrentAccount =
        tx.txParams.to?.toLowerCase() === address.toLowerCase();

      if (!toCurrentAccount) {
        continue;
      }

      const currentBlockNumberValue = tx.blockNumber
        ? parseInt(tx.blockNumber, 10)
        : -1;

      lastFetchedBlockNumber = Math.max(
        lastFetchedBlockNumber,
        currentBlockNumberValue,
      );
    }

    if (lastFetchedBlockNumber === -1) {
      return;
    }

    const lastFetchedKey = this.#getBlockNumberKey();
    const previousValue = this.#lastFetchedBlockNumbers[lastFetchedKey];

    if (previousValue === lastFetchedBlockNumber) {
      return;
    }

    this.#lastFetchedBlockNumbers[lastFetchedKey] = lastFetchedBlockNumber;

    this.hub.emit(
      'updatedLastFetchedBlockNumbers',
      this.#lastFetchedBlockNumbers,
    );
  }

  #getBlockNumberKey(): string {
    return `${this.#getCurrentChainId()}#${this.#getCurrentAccount().toLowerCase()}`;
  }

  #canStart(): boolean {
    const isEnabled = this.#isEnabled();
    const currentChainId = this.#getCurrentChainId();
    const currentNetworkId = this.#getCurrentNetworkId();

    const isSupportedNetwork = this.#remoteTransactionSource.isSupportedNetwork(
      currentChainId,
      currentNetworkId,
    );

    return isEnabled && isSupportedNetwork;
  }

  #getCurrentChainId(): Hex {
    return this.#getNetworkState().providerConfig.chainId;
  }

  #getCurrentNetworkId(): string {
    return this.#getNetworkState().networkId as string;
  }
}
