import { BridgeStatusControllerState } from './types';

export const REFRESH_INTERVAL_MS = 30 * 1000;

export const BRIDGE_STATUS_CONTROLLER_NAME = 'BridgeStatusController';

export const DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE: BridgeStatusControllerState =
  {
    txHistory: {},
  };
