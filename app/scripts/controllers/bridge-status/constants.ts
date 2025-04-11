import { BridgeStatusControllerState } from '@metamask/bridge-status-controller';
import { BRIDGE_API_BASE_URL } from '../../../../shared/constants/bridge';

export const REFRESH_INTERVAL_MS = 10 * 1000;

export const BRIDGE_STATUS_CONTROLLER_NAME = 'BridgeStatusController';

export const DEFAULT_BRIDGE_STATUS_STATE: BridgeStatusControllerState = {
  txHistory: {},
};

export const DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE = {
  bridgeStatusState: { ...DEFAULT_BRIDGE_STATUS_STATE },
};

export const BRIDGE_STATUS_BASE_URL = `${BRIDGE_API_BASE_URL}/getTxStatus`;
