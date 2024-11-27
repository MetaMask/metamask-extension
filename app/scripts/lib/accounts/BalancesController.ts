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
  type Balance,
  type CaipAssetType,
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
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { MULTICHAIN_NETWORK_TO_ASSET_TYPES } from '../../../../shared/constants/multichain/assets';
import { isBtcMainnetAddress } from '../../../../shared/lib/multichain';
import { BalancesTracker } from './BalancesTracker';

const controllerName = 'BalancesController';

/**
 * State used by the {@link BalancesController} to cache account balances.
 */
export type BalancesControllerState = {
  balances: {
    [account: string]: {
      [asset: string]: {
        amount: string;
        unit: string;
      };
    };
  };
};

/**
 * Default state of the {@link BalancesController}.
 */
export const defaultState: BalancesControllerState = { balances: {} };

/**
 * Returns the state of the {@link BalancesController}.
 */
export type BalancesControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  BalancesControllerState
>;

/**
 * Updates the balances of all supported accounts.
 */
export type BalancesControllerUpdateBalancesAction = {
  type: `${typeof controllerName}:updateBalances`;
  handler: BalancesController['updateBalances'];
};

/**
 * Event emitted when the state of the {@link BalancesController} changes.
 */
export type BalancesControllerStateChange = ControllerStateChangeEvent<
  typeof controllerName,
  BalancesControllerState
>;

/**
 * Actions exposed by the {@link BalancesController}.
 */
export type BalancesControllerActions =
  | BalancesControllerGetStateAction
  | BalancesControllerUpdateBalancesAction;

/**
 * Events emitted by {@link BalancesController}.
 */
export type BalancesControllerEvents = BalancesControllerStateChange;

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
 * Messenger type for the BalancesController.
 */
export type BalancesControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  BalancesControllerActions | AllowedActions,
  BalancesControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

/**
 * {@link BalancesController}'s metadata.
 *
 * This allows us to choose if fields of the state should be persisted or not
 * using the `persist` flag; and if they can be sent to Sentry or not, using
 * the `anonymous` flag.
 */
const balancesControllerMetadata = {
  balances: {
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

/**
 * The BalancesController is responsible for fetching and caching account
 * balances.
 */
export class BalancesController extends BaseController<
  typeof controllerName,
  BalancesControllerState,
  BalancesControllerMessenger
> {
  #tracker: BalancesTracker;

  constructor({
    messenger,
    state,
  }: {
    messenger: BalancesControllerMessenger;
    state: BalancesControllerState;
  }) {
    super({
      messenger,
      name: controllerName,
      metadata: balancesControllerMetadata,
      state: {
        ...defaultState,
        ...state,
      },
    });

    this.#tracker = new BalancesTracker(
      async (accountId: string) => await this.#updateBalance(accountId),
    );

    // Register all non-EVM accounts into the tracker
    for (const account of this.#listAccounts()) {
      if (this.#isNonEvmAccount(account)) {
        this.#tracker.track(account.id, this.#getBlockTimeFor(account));
      }
    }

    this.messagingSystem.subscribe(
      'AccountsController:accountAdded',
      (account) => this.#handleOnAccountAdded(account),
    );
    this.messagingSystem.subscribe(
      'AccountsController:accountRemoved',
      (account) => this.#handleOnAccountRemoved(account),
    );
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
   * Get a non-EVM account from its ID.
   *
   * @param accountId - The account ID.
   */
  #getAccount(accountId: string): InternalAccount {
    const account: InternalAccount | undefined =
      this.#listMultichainAccounts().find(
        (multichainAccount) => multichainAccount.id === accountId,
      );

    if (!account) {
      throw new Error(`Unknown account: ${accountId}`);
    }
    if (!this.#isNonEvmAccount(account)) {
      throw new Error(`Account is not a non-EVM account: ${accountId}`);
    }
    return account;
  }

  /**
   * Updates the balances of one account. This method doesn't return
   * anything, but it updates the state of the controller.
   *
   * @param accountId - The account ID.
   */
  async #updateBalance(accountId: string) {
    const account = this.#getAccount(accountId);
    const partialState: BalancesControllerState = { balances: {} };

    if (account.metadata.snap) {
      const scope = this.#getScopeFrom(account);
      const assetTypes = MULTICHAIN_NETWORK_TO_ASSET_TYPES[scope];

      partialState.balances[account.id] = await this.#getBalances(
        account.id,
        account.metadata.snap.id,
        assetTypes,
      );
    }

    this.update((state: Draft<BalancesControllerState>) => ({
      ...state,
      balances: {
        ...state.balances,
        ...partialState.balances,
      },
    }));
  }

  /**
   * Updates the balances of one account. This method doesn't return
   * anything, but it updates the state of the controller.
   *
   * @param accountId - The account ID.
   */
  async updateBalance(accountId: string) {
    // NOTE: No need to track the account here, since we start tracking those when
    // the "AccountsController:accountAdded" is fired.
    await this.#tracker.updateBalance(accountId);
  }

  /**
   * Updates the balances of all supported accounts. This method doesn't return
   * anything, but it updates the state of the controller.
   */
  async updateBalances() {
    await this.#tracker.updateBalances();
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

    if (accountId in this.state.balances) {
      this.update((state: Draft<BalancesControllerState>) => {
        delete state.balances[accountId];
        return state;
      });
    }
  }

  /**
   * Get the balances for an account.
   *
   * @param accountId - ID of the account to get balances for.
   * @param snapId - ID of the Snap which manages the account.
   * @param assetTypes - Array of asset types to get balances for.
   * @returns A map of asset types to balances.
   */
  async #getBalances(
    accountId: string,
    snapId: string,
    assetTypes: CaipAssetType[],
  ): Promise<Record<CaipAssetType, Balance>> {
    return await this.#getClient(snapId).getAccountBalances(
      accountId,
      assetTypes,
    );
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

  /**
   * Gets the network scope for a given account.
   *
   * @param account - The account to get the scope for.
   * @returns The network scope for the account.
   * @throws If the account type is unknown or unsupported.
   */
  #getScopeFrom(account: InternalAccount): MultichainNetworks {
    // TODO: Use the new `account.scopes` once available in the `keyring-api`.

    // For Bitcoin accounts, we get the scope based on the address format.
    if (account.type === BtcAccountType.P2wpkh) {
      if (isBtcMainnetAddress(account.address)) {
        return MultichainNetworks.BITCOIN;
      }
      return MultichainNetworks.BITCOIN_TESTNET;
    }

    // For Solana accounts, we know we have a `scope` on the account's `options` bag.
    if (account.type === SolAccountType.DataAccount) {
      if (!account.options.scope) {
        throw new Error('Solana account scope is undefined');
      }
      return account.options.scope as MultichainNetworks;
    }

    throw new Error(`Unsupported non-EVM account type: ${account.type}`);
  }
}
