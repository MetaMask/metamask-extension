import { BridgeStatusControllerState } from '../../../../shared/types/bridge-status';

export const REFRESH_INTERVAL_MS = 10 * 1000;

export const BRIDGE_STATUS_CONTROLLER_NAME = 'BridgeStatusController';

export const DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE: BridgeStatusControllerState =
  {
    txHistory: {},
  };
