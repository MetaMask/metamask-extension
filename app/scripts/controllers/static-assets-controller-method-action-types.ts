/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { StaticAssetsController } from './static-assets-controller';

export type StaticAssetsControllerStartPollingAction = {
  type: `StaticAssetsController:startPolling`;
  handler: StaticAssetsController['startPolling'];
};

export type StaticAssetsControllerStopPollingByPollingTokenAction = {
  type: `StaticAssetsController:stopPollingByPollingToken`;
  handler: StaticAssetsController['stopPollingByPollingToken'];
};

/**
 * Union of all StaticAssetsController action types.
 */
export type StaticAssetsControllerMethodActions =
  | StaticAssetsControllerStartPollingAction
  | StaticAssetsControllerStopPollingByPollingTokenAction;
