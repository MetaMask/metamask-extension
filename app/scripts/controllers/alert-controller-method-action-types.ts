/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { AlertController } from './alert-controller';

export type AlertControllerSetAlertEnablednessAction = {
  type: `AlertController:setAlertEnabledness`;
  handler: AlertController['setAlertEnabledness'];
};

/**
 * Sets the "switch to connected" alert as shown for the given origin
 *
 * @param origin - The origin the alert has been shown for
 */
export type AlertControllerSetUnconnectedAccountAlertShownAction = {
  type: `AlertController:setUnconnectedAccountAlertShown`;
  handler: AlertController['setUnconnectedAccountAlertShown'];
};

/**
 * Gets the web3 shim usage state for the given origin.
 *
 * @param origin - The origin to get the web3 shim usage state for.
 * @returns The web3 shim usage state for the given
 * origin, or undefined.
 */
export type AlertControllerGetWeb3ShimUsageStateAction = {
  type: `AlertController:getWeb3ShimUsageState`;
  handler: AlertController['getWeb3ShimUsageState'];
};

/**
 * Sets the web3 shim usage state for the given origin to RECORDED.
 *
 * @param origin - The origin the that used the web3 shim.
 */
export type AlertControllerSetWeb3ShimUsageRecordedAction = {
  type: `AlertController:setWeb3ShimUsageRecorded`;
  handler: AlertController['setWeb3ShimUsageRecorded'];
};

/**
 * Sets the web3 shim usage state for the given origin to DISMISSED.
 *
 * @param origin - The origin that the web3 shim notification was
 * dismissed for.
 */
export type AlertControllerSetWeb3ShimUsageAlertDismissedAction = {
  type: `AlertController:setWeb3ShimUsageAlertDismissed`;
  handler: AlertController['setWeb3ShimUsageAlertDismissed'];
};

/**
 * Union of all AlertController action types.
 */
export type AlertControllerMethodActions =
  | AlertControllerSetAlertEnablednessAction
  | AlertControllerSetUnconnectedAccountAlertShownAction
  | AlertControllerGetWeb3ShimUsageStateAction
  | AlertControllerSetWeb3ShimUsageRecordedAction
  | AlertControllerSetWeb3ShimUsageAlertDismissedAction;
