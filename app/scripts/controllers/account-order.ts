import {
  BaseController,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';

// Unique name for the controller
const controllerName = 'AccountOrderController';

/**
 * The account ID of a account.
 */
export type AccountAddress = string;

// State shape for AccountOrderController
export type AccountOrderControllerState = {
  pinnedAccountList: AccountAddress[];
  hiddenAccountList: AccountAddress[];
};

// Describes the action for updating the accounts list
export type AccountOrderControllerupdateAccountsListAction = {
  type: `${typeof controllerName}:updateAccountsList`;
  handler: AccountOrderController['updateAccountsList'];
};

// Describes the action for updating the accounts list
export type AccountOrderControllerhideAccountsListAction = {
  type: `${typeof controllerName}:updateHiddenAccountsList`;
  handler: AccountOrderController['updateHiddenAccountsList'];
};

// Union of all possible actions for the messenger
export type AccountOrderControllerMessengerActions =
  | AccountOrderControllerupdateAccountsListAction
  | AccountOrderControllerhideAccountsListAction;

// Type for the messenger of AccountOrderController
export type AccountOrderControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  AccountOrderControllerMessengerActions,
  never,
  never,
  never
>;

// Default state for the controller
const defaultState = {
  pinnedAccountList: [],
  hiddenAccountList: [],
};

// Metadata for the controller state
const metadata = {
  pinnedAccountList: {
    persist: true,
    anonymous: true,
  },
  hiddenAccountList: {
    persist: true,
    anonymous: true,
  },
};

/**
 * Controller that updates the order of the account list.
 * This controller subscribes to account state changes and ensures
 * that the account list is updated based on the latest account configurations.
 */
export class AccountOrderController extends BaseController<
  typeof controllerName,
  AccountOrderControllerState,
  AccountOrderControllerMessenger
> {
  /**
   * Creates a AccountOrderController instance.
   *
   * @param args - The arguments to this function.
   * @param args.messenger - Messenger used to communicate with BaseV2 controller.
   * @param args.state - Initial state to set on this controller.
   */
  constructor({
    messenger,
    state,
  }: {
    messenger: AccountOrderControllerMessenger;
    state?: AccountOrderControllerState;
  }) {
    // Call the constructor of BaseControllerV2
    super({
      messenger,
      metadata,
      name: controllerName,
      state: { ...defaultState, ...state },
    });
  }

  /**
   * Updates the accounts list in the state with the provided list of accounts.
   *
   * @param accountList - The list of accounts to update in the state.
   */

  updateAccountsList(accountList: []) {
    this.update((state) => {
      state.pinnedAccountList = accountList;
      return state;
    });
  }

  /**
   * Hides the accounts list in the state with the provided list of accounts.
   *
   * @param accountList - The list of accounts to hide in the state.
   */

  updateHiddenAccountsList(accountList: []) {
    this.update((state) => {
      state.hiddenAccountList = accountList;
      return state;
    });
  }
}
