import { Poller } from '../accounts/Poller';
import { PaginationOptions } from './MultichainTransactionsController';

type TransactionInfo = {
  lastUpdated: number;
  blockTime: number;
  pagination: PaginationOptions;
};

// Every 7s in milliseconds.
const TRANSACTIONS_TRACKING_INTERVAL = 7 * 1000;

export class TransactionsTracker {
  #poller: Poller;

  #updateTransactions: (accountId: string, pagination: PaginationOptions) => Promise<void>;

  #transactions: Record<string, TransactionInfo> = {};

  constructor(
    updateTransactionsCallback: (accountId: string, pagination: PaginationOptions) => Promise<void>,
  ) {
    this.#updateTransactions = updateTransactionsCallback;

    this.#poller = new Poller(() => {
      this.updateTransactions();
    }, TRANSACTIONS_TRACKING_INTERVAL);
  }

  /**
   * Starts the tracking process.
   */
  async start(): Promise<void> {
    this.#poller.start();
  }

  /**
   * Stops the tracking process.
   */
  async stop(): Promise<void> {
    this.#poller.stop();
  }

  /**
   * Checks if an account ID is being tracked.
   *
   * @param accountId - The account ID.
   * @returns True if the account is being tracked, false otherwise.
   */
  isTracked(accountId: string) {
    return accountId in this.#transactions;
  }

  /**
   * Asserts that an account ID is being tracked.
   *
   * @param accountId - The account ID.
   * @throws If the account ID is not being tracked.
   */
  assertBeingTracked(accountId: string) {
    if (!this.isTracked(accountId)) {
      throw new Error(`Account is not being tracked: ${accountId}`);
    }
  }

  /**
   * Starts tracking a new account ID. This method has no effect on already tracked
   * accounts.
   *
   * @param accountId - The account ID.
   * @param blockTime - The block time (used when refreshing the account transactions).
   */
  track(accountId: string, blockTime: number, pagination: PaginationOptions = { limit: 10 }) {
    if (!this.isTracked(accountId)) {
      this.#transactions[accountId] = {
        lastUpdated: 0,
        blockTime,
        pagination,
      };
    }
  }

  /**
   * Stops tracking a tracked account ID.
   *
   * @param accountId - The account ID.
   * @throws If the account ID is not being tracked.
   */
  untrack(accountId: string) {
    this.assertBeingTracked(accountId);
    delete this.#transactions[accountId];
  }

  /**
   * Update the transactions for a tracked account ID.
   *
   * @param accountId - The account ID.
   * @throws If the account ID is not being tracked.
   */
  async updateTransactionsForAccount(accountId: string) {
    this.assertBeingTracked(accountId);

    const info = this.#transactions[accountId];
    const isOutdated = Date.now() - info.lastUpdated >= info.blockTime;
    const hasNoTransactionsYet = info.lastUpdated === 0;

    if (hasNoTransactionsYet || isOutdated) {
      await this.#updateTransactions(accountId, info.pagination);
      this.#transactions[accountId].lastUpdated = Date.now();
    }
  }

  /**
   * Update the transactions of all tracked accounts
   */
  async updateTransactions() {
    await Promise.allSettled(
      Object.keys(this.#transactions).map(async (accountId) => {
        await this.updateTransactionsForAccount(accountId);
      }),
    );
  }
}
