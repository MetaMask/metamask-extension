import EventEmitter from 'events';
import type { BlockTracker, NetworkState } from '@metamask/network-controller';
import type { Hex } from '@metamask/utils';

import log from 'loglevel';
import { TransactionMeta } from '../../../../shared/constants/transaction';
import { RemoteTransactionSource } from './types';

const UPDATE_CHECKS: ((txMeta: TransactionMeta) => any)[] = [
  (txMeta) => txMeta.status,
];

export class IncomingTransactionHelper {
  hub: EventEmitter;

  #blockTracker: BlockTracker;

  #getCurrentAccount: () => string;

  #getLocalTransactions: () => TransactionMeta[];

  #getNetworkState: () => NetworkState;

  #isEnabled: () => boolean;

  #isRunning: boolean;

  #isUpdating: boolean;

  #lastFetchedBlockNumbers: Record<string, number>;

  #onLatestBlock: (blockNumberHex: Hex) => Promise<void>;

  #remoteTransactionSource: RemoteTransactionSource;

  #transactionLimit?: number;

  #updateTransactions: boolean;

  constructor({
    blockTracker,
    getCurrentAccount,
    getLocalTransactions,
    getNetworkState,
    isEnabled,
    lastFetchedBlockNumbers,
    remoteTransactionSource,
    transactionLimit,
    updateTransactions,
  }: {
    blockTracker: BlockTracker;
    getCurrentAccount: () => string;
    getNetworkState: () => NetworkState;
    getLocalTransactions?: () => TransactionMeta[];
    isEnabled?: () => boolean;
    lastFetchedBlockNumbers?: Record<string, number>;
    remoteTransactionSource: RemoteTransactionSource;
    transactionLimit?: number;
    updateTransactions?: boolean;
  }) {
    this.hub = new EventEmitter();

    this.#blockTracker = blockTracker;
    this.#getCurrentAccount = getCurrentAccount;
    this.#getLocalTransactions = getLocalTransactions || (() => []);
    this.#getNetworkState = getNetworkState;
    this.#isEnabled = isEnabled ?? (() => true);
    this.#isRunning = false;
    this.#isUpdating = false;
    this.#lastFetchedBlockNumbers = lastFetchedBlockNumbers ?? {};
    this.#remoteTransactionSource = remoteTransactionSource;
    this.#transactionLimit = transactionLimit;
    this.#updateTransactions = updateTransactions ?? false;

    // Using a property instead of a method to provide a listener reference
    // with the correct scope that we can remove later if stopped.
    this.#onLatestBlock = async (blockNumberHex: Hex) => {
      await this.update(blockNumberHex);
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

  async update(latestBlockNumberHex?: Hex): Promise<void> {
    if (this.#isUpdating) {
      return;
    }

    this.#isUpdating = true;

    try {
      if (!this.#canStart()) {
        return;
      }

      const latestBlockNumber = parseInt(
        latestBlockNumberHex || (await this.#blockTracker.getLatestBlock()),
        16,
      );

      const fromBlock = this.#getFromBlock(latestBlockNumber);
      const address = this.#getCurrentAccount();
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
        return;
      }

      if (!this.#updateTransactions) {
        remoteTransactions = remoteTransactions.filter(
          (tx) => tx.txParams.to?.toLowerCase() === address.toLowerCase(),
        );
      }

      const localTransactions = this.#updateTransactions
        ? this.#getLocalTransactions()
        : [];

      const newTransactions = this.#getNewTransactions(
        remoteTransactions,
        localTransactions,
      );

      const updatedTransactions = this.#getUpdatedTransactions(
        remoteTransactions,
        localTransactions,
      );

      if (newTransactions.length > 0 || updatedTransactions.length > 0) {
        this.#sortTransactionsByTime(newTransactions);
        this.#sortTransactionsByTime(updatedTransactions);

        this.hub.emit('transactions', {
          added: newTransactions,
          updated: updatedTransactions,
        });
      }

      this.#updateLastFetchedBlockNumber(remoteTransactions);
    } catch (error) {
      log.error('Error while checking incoming transactions', error);
    } finally {
      this.#isUpdating = false;
    }
  }

  #sortTransactionsByTime(transactions: TransactionMeta[]) {
    transactions.sort((a, b) => (a.time < b.time ? -1 : 1));
  }

  #getNewTransactions(
    remoteTxs: TransactionMeta[],
    localTxs: TransactionMeta[],
  ): TransactionMeta[] {
    return remoteTxs.filter(
      (tx) => !localTxs.some(({ hash }) => hash === tx.hash),
    );
  }

  #getUpdatedTransactions(
    remoteTxs: TransactionMeta[],
    localTxs: TransactionMeta[],
  ): TransactionMeta[] {
    return remoteTxs.filter((remoteTx) =>
      localTxs.some(
        (localTx) =>
          remoteTx.hash === localTx.hash &&
          this.#isTransactionOutdated(remoteTx, localTx),
      ),
    );
  }

  #isTransactionOutdated(
    remoteTx: TransactionMeta,
    localTx: TransactionMeta,
  ): boolean {
    return UPDATE_CHECKS.some(
      (getValue) => getValue(remoteTx) !== getValue(localTx),
    );
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

  #updateLastFetchedBlockNumber(remoteTxs: TransactionMeta[]) {
    let lastFetchedBlockNumber = -1;

    for (const tx of remoteTxs) {
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

    this.hub.emit('updatedLastFetchedBlockNumbers', {
      lastFetchedBlockNumbers: this.#lastFetchedBlockNumbers,
      blockNumber: lastFetchedBlockNumber,
    });
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
