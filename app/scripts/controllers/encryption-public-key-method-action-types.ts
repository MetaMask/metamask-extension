/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { EncryptionPublicKeyController } from './encryption-public-key';

/**
 * Reset the controller state to the initial state.
 */
export type EncryptionPublicKeyControllerResetStateAction = {
  type: `EncryptionPublicKeyController:resetState`;
  handler: EncryptionPublicKeyController['resetState'];
};

/**
 * Called when a Dapp uses the eth_getEncryptionPublicKey method, to request user approval.
 *
 * @param address - The address from the encryption public key will be extracted.
 * @param [req] - The original request, containing the origin.
 */
export type EncryptionPublicKeyControllerNewRequestEncryptionPublicKeyAction = {
  type: `EncryptionPublicKeyController:newRequestEncryptionPublicKey`;
  handler: EncryptionPublicKeyController['newRequestEncryptionPublicKey'];
};

/**
 * Signifies a user's approval to receiving encryption public key in queue.
 *
 * @param msgParams - The params of the message to receive & return to the Dapp.
 * @returns A full state update.
 */
export type EncryptionPublicKeyControllerEncryptionPublicKeyAction = {
  type: `EncryptionPublicKeyController:encryptionPublicKey`;
  handler: EncryptionPublicKeyController['encryptionPublicKey'];
};

/**
 * Used to cancel a message submitted via eth_getEncryptionPublicKey.
 *
 * @param msgId - The id of the message to cancel.
 */
export type EncryptionPublicKeyControllerCancelEncryptionPublicKeyAction = {
  type: `EncryptionPublicKeyController:cancelEncryptionPublicKey`;
  handler: EncryptionPublicKeyController['cancelEncryptionPublicKey'];
};

/**
 * Reject all unapproved messages of any type.
 *
 * @param reason - A message to indicate why.
 */
export type EncryptionPublicKeyControllerRejectUnapprovedAction = {
  type: `EncryptionPublicKeyController:rejectUnapproved`;
  handler: EncryptionPublicKeyController['rejectUnapproved'];
};

/**
 * Clears all unapproved messages from memory.
 */
export type EncryptionPublicKeyControllerClearUnapprovedAction = {
  type: `EncryptionPublicKeyController:clearUnapproved`;
  handler: EncryptionPublicKeyController['clearUnapproved'];
};

/**
 * Union of all EncryptionPublicKeyController action types.
 */
export type EncryptionPublicKeyControllerMethodActions =
  | EncryptionPublicKeyControllerResetStateAction
  | EncryptionPublicKeyControllerNewRequestEncryptionPublicKeyAction
  | EncryptionPublicKeyControllerEncryptionPublicKeyAction
  | EncryptionPublicKeyControllerCancelEncryptionPublicKeyAction
  | EncryptionPublicKeyControllerRejectUnapprovedAction
  | EncryptionPublicKeyControllerClearUnapprovedAction;
