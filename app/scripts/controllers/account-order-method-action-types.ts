/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { AccountOrderController } from './account-order';

/**
 * Updates the accounts list in the state with the provided list of accounts.
 *
 * @param accountList - The list of accounts to update in the state.
 */
export type AccountOrderControllerUpdateAccountsListAction = {
  type: `AccountOrderController:updateAccountsList`;
  handler: AccountOrderController['updateAccountsList'];
};

/**
 * Hides the accounts list in the state with the provided list of accounts.
 *
 * @param accountList - The list of accounts to hide in the state.
 */
export type AccountOrderControllerUpdateHiddenAccountsListAction = {
  type: `AccountOrderController:updateHiddenAccountsList`;
  handler: AccountOrderController['updateHiddenAccountsList'];
};

/**
 * Union of all AccountOrderController action types.
 */
export type AccountOrderControllerMethodActions =
  | AccountOrderControllerUpdateAccountsListAction
  | AccountOrderControllerUpdateHiddenAccountsListAction;
