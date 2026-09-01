/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { DecryptMessageController } from './decrypt-message';

/**
 * Reset the controller state to the initial state.
 */
export type DecryptMessageControllerResetStateAction = {
  type: `DecryptMessageController:resetState`;
  handler: DecryptMessageController['resetState'];
};

/**
 * Clears all unapproved messages from memory.
 */
export type DecryptMessageControllerClearUnapprovedAction = {
  type: `DecryptMessageController:clearUnapproved`;
  handler: DecryptMessageController['clearUnapproved'];
};

/**
 * Called when a dapp uses the eth_decrypt method
 *
 * @param messageParams - The params passed to eth_decrypt.
 * @param req - The original request, containing the origin.
 * @returns Promise resolving to the raw data of the signature request.
 */
export type DecryptMessageControllerNewRequestDecryptMessageAction = {
  type: `DecryptMessageController:newRequestDecryptMessage`;
  handler: DecryptMessageController['newRequestDecryptMessage'];
};

/**
 * Signifies a user's approval to decrypt a message in queue.
 * Triggers decrypt, and the callback function from newUnsignedDecryptMessage.
 *
 * @param messageParams - The params of the message to decrypt & return to the Dapp.
 * @returns A full state update.
 */
export type DecryptMessageControllerDecryptMessageAction = {
  type: `DecryptMessageController:decryptMessage`;
  handler: DecryptMessageController['decryptMessage'];
};

/**
 * Only decrypt message and don't touch transaction state
 *
 * @param messageParams - The params of the message to decrypt.
 * @returns A full state update.
 */
export type DecryptMessageControllerDecryptMessageInlineAction = {
  type: `DecryptMessageController:decryptMessageInline`;
  handler: DecryptMessageController['decryptMessageInline'];
};

/**
 * Used to cancel a eth_decrypt type message.
 *
 * @param messageId - The ID of the message to cancel.
 * @returns A full state update.
 */
export type DecryptMessageControllerCancelDecryptMessageAction = {
  type: `DecryptMessageController:cancelDecryptMessage`;
  handler: DecryptMessageController['cancelDecryptMessage'];
};

/**
 * Reject all unapproved messages of any type.
 *
 * @param reason - A message to indicate why.
 */
export type DecryptMessageControllerRejectUnapprovedAction = {
  type: `DecryptMessageController:rejectUnapproved`;
  handler: DecryptMessageController['rejectUnapproved'];
};

/**
 * Union of all DecryptMessageController action types.
 */
export type DecryptMessageControllerMethodActions =
  | DecryptMessageControllerResetStateAction
  | DecryptMessageControllerClearUnapprovedAction
  | DecryptMessageControllerNewRequestDecryptMessageAction
  | DecryptMessageControllerDecryptMessageAction
  | DecryptMessageControllerDecryptMessageInlineAction
  | DecryptMessageControllerCancelDecryptMessageAction
  | DecryptMessageControllerRejectUnapprovedAction;
