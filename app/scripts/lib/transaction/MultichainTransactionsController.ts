import type { Json, JsonRpcRequest } from '@metamask/utils';

import {
  BaseController,
  type ControllerGetStateAction,
  type ControllerStateChangeEvent,
  type RestrictedControllerMessenger,
} from '@metamask/base-controller';
import {
  BtcAccountType,
  isEvmAccountType,
  SolAccountType,
} from '@metamask/keyring-api';
import { KeyringClient } from '@metamask/keyring-snap-client';
import { type InternalAccount } from '@metamask/keyring-internal-api';
import type { HandleSnapRequest } from '@metamask/snaps-controllers';
import type { SnapId } from '@metamask/snaps-sdk';
import { HandlerType } from '@metamask/snaps-utils';
import type { Draft } from 'immer';
import type {
  AccountsControllerAccountAddedEvent,
  AccountsControllerAccountRemovedEvent,
  AccountsControllerListMultichainAccountsAction,
} from '@metamask/accounts-controller';
import type { Transaction } from '../../../../shared/types/multichain/transactions';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { MultichainTransactionsTracker } from './MultichainTransactionsTracker';

const controllerName = 'MultichainTransactionsController';

export type PaginationOptions = {
  limit: number;
  next?: string | null;
};

/**
 * State used by the {@link MultichainTransactionsController} to cache account transactions.
 */
export type MultichainTransactionsControllerState = {
  nonEvmTransactions: {
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
  nonEvmTransactions: {},
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
 * Updates the transactions of all supported accounts.
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
  nonEvmTransactions: {
    persist: true,
    anonymous: false,
  },
};

const BTC_AVG_BLOCK_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
const SOLANA_TRANSACTIONS_UPDATE_TIME = 7000; // 7 seconds
const BTC_TRANSACTIONS_UPDATE_TIME = BTC_AVG_BLOCK_TIME / 2;

const TRANSACTIONS_CHECK_INTERVALS = {
  [BtcAccountType.P2wpkh]: BTC_TRANSACTIONS_UPDATE_TIME,
  [SolAccountType.DataAccount]: SOLANA_TRANSACTIONS_UPDATE_TIME,
};

/**
 * The state of transactions for a specific account.
 */
type TransactionStateEntry = {
  data: Transaction[];
  next: string | null;
  lastUpdated: number;
};

/**
 * The MultichainTransactionsController is responsible for fetching and caching account
 * transactions for non-EVM accounts.
 */
export class MultichainTransactionsController extends BaseController<
  typeof controllerName,
  MultichainTransactionsControllerState,
  MultichainTransactionsControllerMessenger
> {
  #tracker: MultichainTransactionsTracker;

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

    this.#tracker = new MultichainTransactionsTracker(
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
   * Lists the accounts that we should get transactions for.
   *
   * @returns A list of accounts that we should get transactions for.
   */
  #listAccounts(): InternalAccount[] {
    const accounts = this.#listMultichainAccounts();
    return accounts.filter((account) => this.#isNonEvmAccount(account));
  }

  /**
   * Updates the transactions for one account.
   *
   * @param accountId - The ID of the account to update transactions for.
   * @param pagination - Options for paginating transaction results.
   */
  async #updateTransactions(accountId: string, pagination: PaginationOptions) {
    const account = this.#listAccounts().find(
      (accountItem) => accountItem.id === accountId,
    );

    if (account?.metadata.snap) {
      const response = await this.#getTransactions(
        account.id,
        account.metadata.snap.id,
        pagination,
      );

      /**
       * Filter mainnet transactions based on chain prefix
       * For now, we don't look at the current network, but we will in the future
       */
      const mainnetTransactions = response.data.filter(
        (tx) =>
          tx.chain.startsWith(MultichainNetworks.SOLANA) ||
          tx.chain.startsWith(MultichainNetworks.BITCOIN),
      );

      this.update((state: Draft<MultichainTransactionsControllerState>) => {
        const entry: TransactionStateEntry = {
          data: mainnetTransactions,
          next: response.next,
          lastUpdated: Date.now(),
        };

        Object.assign(state.nonEvmTransactions, { [account.id]: entry });
      });
    }
  }

  /**
   * Gets transactions for an account.
   *
   * @param accountId - The ID of the account to get transactions for.
   * @param snapId - The ID of the snap that manages the account.
   * @param pagination - Options for paginating transaction results.
   * @returns A promise that resolves to the transaction data and pagination info.
   */
  async #getTransactions(
    accountId: string,
    snapId: string,
    pagination: PaginationOptions,
  ): Promise<{
    data: Transaction[];
    next: string | null;
  }> {
    return await this.#getClient(snapId).listAccountTransactions(
      accountId,
      pagination,
    );
  }

  /**
   * Updates transactions for a specific account
   *
   * @param accountId - The ID of the account to get transactions for.
   */
  async updateTransactionsForAccount(accountId: string) {
    await this.#tracker.updateTransactionsForAccount(accountId);
  }

  /**
   * Updates the transactions of all supported accounts. This method doesn't return
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
    if (account.type in TRANSACTIONS_CHECK_INTERVALS) {
      return TRANSACTIONS_CHECK_INTERVALS[
        account.type as keyof typeof TRANSACTIONS_CHECK_INTERVALS
      ];
    }
    throw new Error(
      `Unsupported account type for transactions tracking: ${account.type}`,
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
      return;
    }

    this.#tracker.track(account.id, this.#getBlockTimeFor(account));
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

    if (accountId in this.state.nonEvmTransactions) {
      this.update((state: Draft<MultichainTransactionsControllerState>) => {
        delete state.nonEvmTransactions[accountId];
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
