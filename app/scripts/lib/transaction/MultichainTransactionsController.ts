import type { Json, JsonRpcRequest } from '@metamask/utils';

import {
  BaseController,
  type ControllerGetStateAction,
  type ControllerStateChangeEvent,
  type RestrictedControllerMessenger,
} from '@metamask/base-controller';
import {
  BtcAccountType,
  KeyringClient,
  type InternalAccount,
  isEvmAccountType,
  SolAccountType,
} from '@metamask/keyring-api';
import type { HandleSnapRequest } from '@metamask/snaps-controllers';
import type { SnapId } from '@metamask/snaps-sdk';
import { HandlerType } from '@metamask/snaps-utils';
import type { Draft } from 'immer';
import type {
  AccountsControllerAccountAddedEvent,
  AccountsControllerAccountRemovedEvent,
  AccountsControllerListMultichainAccountsAction,
} from '@metamask/accounts-controller';
import { TransactionsTracker } from './MultichainTransactionsTracker';

const controllerName = 'MultichainTransactionsController';

type TransactionEvent = {
  type: string;
  data: Record<string, Json>;
};

type Transaction = {
  id: string;
  account: string;
  chain: string;
  type: 'send' | 'receive';
  status: 'submitted' | 'confirmed' | 'failed';
  timestamp: number | null;
  from: Array<Record<string, Json>>;
  to: Array<Record<string, Json>>;
  fees: Array<Record<string, Json>>;
  events: TransactionEvent[];
};

export type PaginationOptions = {
  limit?: number;
  next?: string | null;
};

/**
 * State used by the {@link MultichainTransactionsController} to cache account balances.
 */
export type MultichainTransactionsControllerState = {
  transactions: {
    [accountId: string]: {
      data: Transaction[];
      next: string | null;
      lastUpdated: number;
    };
  };
};

/**
 * Default state of the {@link MultichainTransactionsController}.
 */
export const defaultState: MultichainTransactionsControllerState = {
  transactions: {},
};

/**
 * Returns the state of the {@link MultichainTransactionsController}.
 */
export type MultichainTransactionsControllerGetStateAction =
  ControllerGetStateAction<
    typeof controllerName,
    MultichainTransactionsControllerState
  >;

/**
 * Updates the balances of all supported accounts.
 */
export type MultichainTransactionsControllerListTransactionsAction = {
  type: `${typeof controllerName}:updateTransactions`;
  handler: MultichainTransactionsController['updateTransactions'];
};

/**
 * Event emitted when the state of the {@link MultichainTransactionsController} changes.
 */
export type MultichainTransactionsControllerStateChange =
  ControllerStateChangeEvent<
    typeof controllerName,
    MultichainTransactionsControllerState
  >;

/**
 * Actions exposed by the {@link MultichainTransactionsController}.
 */
export type MultichainTransactionsControllerActions =
  | MultichainTransactionsControllerGetStateAction
  | MultichainTransactionsControllerListTransactionsAction;

/**
 * Events emitted by {@link MultichainTransactionsController}.
 */
export type MultichainTransactionsControllerEvents =
  MultichainTransactionsControllerStateChange;

/**
 * Messenger type for the MultichainTransactionsController.
 */
export type MultichainTransactionsControllerMessenger =
  RestrictedControllerMessenger<
    typeof controllerName,
    MultichainTransactionsControllerActions | AllowedActions,
    MultichainTransactionsControllerEvents | AllowedEvents,
    AllowedActions['type'],
    AllowedEvents['type']
  >;

/**
 * Actions that this controller is allowed to call.
 */
export type AllowedActions =
  | HandleSnapRequest
  | AccountsControllerListMultichainAccountsAction;

/**
 * Events that this controller is allowed to subscribe.
 */
export type AllowedEvents =
  | AccountsControllerAccountAddedEvent
  | AccountsControllerAccountRemovedEvent;

/**
 * {@link MultichainTransactionsController}'s metadata.
 *
 * This allows us to choose if fields of the state should be persisted or not
 * using the `persist` flag; and if they can be sent to Sentry or not, using
 * the `anonymous` flag.
 */
const MultichainTransactionsControllerMetadata = {
  transactions: {
    persist: true,
    anonymous: false,
  },
};

const BTC_AVG_BLOCK_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
const SOLANA_AVG_BLOCK_TIME = 400; // 400 milliseconds

// NOTE: We set an interval of half the average block time to mitigate when our interval
// is de-synchronized with the actual block time.
export const BTC_BALANCES_UPDATE_TIME = BTC_AVG_BLOCK_TIME / 2;

const BALANCE_CHECK_INTERVALS = {
  [BtcAccountType.P2wpkh]: BTC_BALANCES_UPDATE_TIME,
  [SolAccountType.DataAccount]: SOLANA_AVG_BLOCK_TIME,
};
type TransactionStateEntry = {
  data: Transaction[];
  next: string | null;
  lastUpdated: number;
};
/**
 * The MultichainTransactionsController is responsible for fetching and caching account
 * balances.
 */
export class MultichainTransactionsController extends BaseController<
  typeof controllerName,
  MultichainTransactionsControllerState,
  MultichainTransactionsControllerMessenger
> {
  #tracker: TransactionsTracker;

  constructor({
    messenger,
    state,
  }: {
    messenger: MultichainTransactionsControllerMessenger;
    state: MultichainTransactionsControllerState;
  }) {
    super({
      messenger,
      name: controllerName,
      metadata: MultichainTransactionsControllerMetadata,
      state: {
        ...defaultState,
        ...state,
      },
    });

    this.#tracker = new TransactionsTracker(
      async (accountId: string, pagination: PaginationOptions) =>
        await this.#updateTransactions(accountId, pagination),
    );

    // Register all non-EVM accounts into the tracker
    for (const account of this.#listAccounts()) {
      if (this.#isNonEvmAccount(account)) {
        this.#tracker.track(account.id, this.#getBlockTimeFor(account));
      }
    }

    this.messagingSystem.subscribe(
      'AccountsController:accountAdded',
      (account: InternalAccount) => this.#handleOnAccountAdded(account),
    );
    this.messagingSystem.subscribe(
      'AccountsController:accountRemoved',
      (accountId: string) => this.#handleOnAccountRemoved(accountId),
    );
  }

  /**
   * Lists the multichain accounts coming from the `AccountsController`.
   *
   * @returns A list of multichain accounts.
   */
  #listMultichainAccounts(): InternalAccount[] {
    return this.messagingSystem.call(
      'AccountsController:listMultichainAccounts',
    );
  }

  /**
   * Lists the accounts that we should get balances for.
   *
   * @returns A list of accounts that we should get balances for.
   */
  #listAccounts(): InternalAccount[] {
    const accounts = this.#listMultichainAccounts();

    return accounts.filter(
      (account) =>
        account.type === SolAccountType.DataAccount ||
        account.type === BtcAccountType.P2wpkh,
    );
  }

  /**
   * Updates the transactions for one account.
   */
  async #updateTransactions(accountId: string, pagination: PaginationOptions) {
    const account = this.#listAccounts().find(
      (account) => account.id === accountId,
    );

    if (account && account.metadata.snap) {
      const response = await this.#getTransactions(
        account.id,
        account.metadata.snap.id,
        pagination,
      );

      this.update((state: Draft<MultichainTransactionsControllerState>) => {
        const entry: TransactionStateEntry = {
          data: response.data,
          next: response.next,
          lastUpdated: Date.now(),
        };
        state.transactions[account.id] = entry as any;
      });
    }
  }

  /**
   * Gets transactions for an account.
   */
  async #getTransactions(
    accountId: string,
    snapId: string,
    pagination: PaginationOptions,
  ): Promise<{
    data: Transaction[];
    next: string | null;
  }> {
    // @ts-expect-error Will exist in the future
    return await this.#getClient(snapId).listAccountTransactions(
      accountId,
      pagination,
    );
  }

  /**
   * Gets transactions for a specific account
   */
  getTransactions(accountId: string): Transaction[] {
    return this.state.transactions[accountId]?.data ?? [];
  }

  /**
   * Updates transactions for a specific account
   */
  async updateTransactionsForAccount(accountId: string) {
    await this.#tracker.updateTransactionsForAccount(accountId);
  }

    /**
   * Updates the balances of all supported accounts. This method doesn't return
   * anything, but it updates the state of the controller.
   */
  async updateTransactions() {
    await this.#tracker.updateTransactions();
  }

  /**
   * Starts the polling process.
   */
  async start(): Promise<void> {
    this.#tracker.start();
  }

  /**
   * Stops the polling process.
   */
  async stop(): Promise<void> {
    this.#tracker.stop();
  }

  /**
   * Gets the block time for a given account.
   *
   * @param account - The account to get the block time for.
   * @returns The block time for the account.
   */
  #getBlockTimeFor(account: InternalAccount): number {
    if (account.type in BALANCE_CHECK_INTERVALS) {
      return BALANCE_CHECK_INTERVALS[
        account.type as keyof typeof BALANCE_CHECK_INTERVALS
      ];
    }
    throw new Error(
      `Unsupported account type for balance tracking: ${account.type}`,
    );
  }

  /**
   * Checks for non-EVM accounts.
   *
   * @param account - The new account to be checked.
   * @returns True if the account is a non-EVM account, false otherwise.
   */
  #isNonEvmAccount(account: InternalAccount): boolean {
    return (
      !isEvmAccountType(account.type) &&
      // Non-EVM accounts are backed by a Snap for now
      account.metadata.snap !== undefined
    );
  }

  /**
   * Handles changes when a new account has been added.
   *
   * @param account - The new account being added.
   */
  async #handleOnAccountAdded(account: InternalAccount) {
    if (!this.#isNonEvmAccount(account)) {
      // Nothing to do here for EVM accounts
      return;
    }

    this.#tracker.track(account.id, this.#getBlockTimeFor(account));
    // NOTE: Unfortunately, we cannot update the balance right away here, because
    // messenger's events are running synchronously and fetching the balance is
    // asynchronous.
    // Updating the balance here would resume at some point but the event emitter
    // will not `await` this (so we have no real control "when" the balance will
    // really be updated), see:
    // - https://github.com/MetaMask/core/blob/v213.0.0/packages/accounts-controller/src/AccountsController.ts#L1036-L1039
  }

  /**
   * Handles changes when a new account has been removed.
   *
   * @param accountId - The account ID being removed.
   */
  async #handleOnAccountRemoved(accountId: string) {
    if (this.#tracker.isTracked(accountId)) {
      this.#tracker.untrack(accountId);
    }

    if (accountId in this.state.transactions) {
      this.update((state: Draft<MultichainTransactionsControllerState>) => {
        delete state.transactions[accountId];
      });
    }
  }

  /**
   * Gets a `KeyringClient` for a Snap.
   *
   * @param snapId - ID of the Snap to get the client for.
   * @returns A `KeyringClient` for the Snap.
   */
  #getClient(snapId: string): KeyringClient {
    return new KeyringClient({
      send: async (request: JsonRpcRequest) =>
        (await this.messagingSystem.call('SnapController:handleRequest', {
          snapId: snapId as SnapId,
          origin: 'metamask',
          handler: HandlerType.OnKeyringRequest,
          request,
        })) as Promise<Json>,
    });
  }
}
