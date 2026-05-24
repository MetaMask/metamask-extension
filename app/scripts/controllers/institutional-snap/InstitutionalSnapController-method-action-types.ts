/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { InstitutionalSnapController } from './InstitutionalSnapController';

export type InstitutionalSnapControllerPublishHookAction = {
  type: `InstitutionalSnapController:publishHook`;
  handler: InstitutionalSnapController['publishHook'];
};

export type InstitutionalSnapControllerBeforeCheckPendingTransactionHookAction =
  {
    type: `InstitutionalSnapController:beforeCheckPendingTransactionHook`;
    handler: InstitutionalSnapController['beforeCheckPendingTransactionHook'];
  };

/**
 * Union of all InstitutionalSnapController action types.
 */
export type InstitutionalSnapControllerMethodActions =
  | InstitutionalSnapControllerPublishHookAction
  | InstitutionalSnapControllerBeforeCheckPendingTransactionHookAction;
