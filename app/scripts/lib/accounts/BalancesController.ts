import { type AccountsControllerListAccountsAction } from '@metamask/accounts-controller';
import { assert } from 'superstruct';

import { JsonRpcRequest } from '@metamask/utils';
import {
  BaseController,
  type ControllerGetStateAction,
  type ControllerStateChangeEvent,
  type RestrictedControllerMessenger,
} from '@metamask/base-controller';
import {
  BtcAccountType,
  GetAccountBalancesResponseStruct,
  InternalAccount,
  KeyringRpcMethod,
  type Balance,
  type CaipAssetType,
} from '@metamask/keyring-api';
import type { HandleSnapRequest } from '@metamask/snaps-controllers';
import type { SnapId } from '@metamask/snaps-sdk';
import { HandlerType } from '@metamask/snaps-utils';
import type { Draft } from 'immer';
import { v4 as uuid } from 'uuid';
import { Poller } from './Poller';

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
const defaultState: BalancesControllerState = { balances: {} };

/**
 * Returns the state of the {@link BalancesController}.
 */
export type GetBalancesControllerState = ControllerGetStateAction<
  typeof controllerName,
  BalancesControllerState
>;

/**
 * Updates the balances of all supported accounts.
 */
export type UpdateBalances = {
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
  | GetBalancesControllerState
  | UpdateBalances;

/**
 * Events emitted by {@link BalancesController}.
 */
export type BalancesControllerEvents = BalancesControllerStateChange;

/**
 * Actions that this controller is allowed to call.
 */
export type AllowedActions =
  | HandleSnapRequest
  | AccountsControllerListAccountsAction;

/**
 * Messenger type for the BalancesController.
 */
export type BalancesControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  BalancesControllerActions | AllowedActions,
  BalancesControllerEvents,
  AllowedActions['type'],
  never
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

const ASSETS_LIST = ['bip122:000000000019d6689c085ae165831e93/slip44:0'];

/**
 * The BalancesController is responsible for fetching and caching account
 * balances.
 */
export class BalancesController extends BaseController<
  typeof controllerName,
  BalancesControllerState,
  BalancesControllerMessenger
> {
  #poller: Poller;

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

    this.#poller = new Poller(() => this.updateBalances(), 10000);
    this.#poller.start();
  }

  /**
   * Lists the accounts that we should get balances for.
   *
   * Currently, we only get balances for P2WPKH accounts, but this will change
   * in the future when we start support other non-EVM account types.
   *
   * @returns A list of accounts that we should get balances for.
   */
  async #listAccounts(): Promise<InternalAccount[]> {
    const accounts = await this.messagingSystem.call(
      'AccountsController:listAccounts',
    );

    return accounts.filter((account) => account.type === BtcAccountType.P2wpkh);
  }

  async updateBalances() {
    const accounts = await this.#listAccounts();
    for (const account of accounts) {
      if (account.metadata.snap) {
        const balances = await this.#getBalances(
          account.id,
          account.metadata.snap.id,
          ASSETS_LIST,
        );

        this.update((state: Draft<BalancesControllerState>) => {
          state.balances[account.id] = {
            ...state.balances[account.id],
            ...balances,
          };
        });
      }
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
    const response = await this.#handleRequest(snapId, {
      method: KeyringRpcMethod.GetAccountBalances,
      params: {
        id: accountId,
        assets: assetTypes,
      },
    });

    assert(response, GetAccountBalancesResponseStruct);
    return response;
  }

  /**
   * Call a Snap to handle a JSON-RPC request.
   *
   * @param snapId - ID of the Snap to call.
   * @param request - JSON-RPC request to execute. The fields `id` and
   * `jsonrpc` of the request can optionally be omitted.
   * @returns The JSON-RPC response from the Snap.
   */
  async #handleRequest(
    snapId: string,
    request: Omit<JsonRpcRequest, 'id' | 'jsonrpc'>,
  ) {
    return await this.messagingSystem.call('SnapController:handleRequest', {
      snapId: snapId as SnapId,
      origin: 'metamask',
      handler: HandlerType.OnKeyringRequest,
      request: {
        id: uuid(),
        jsonrpc: '2.0',
        ...request,
      },
    });
  }
}
