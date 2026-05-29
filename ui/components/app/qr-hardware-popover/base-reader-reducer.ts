import {
  CameraReadyState,
  type CameraReadyStateValue,
  type WebcamError,
} from './base-reader.types';
import type { ScanErrorClassification } from './qr-utils/qr-utils';

export const ActionType = {
  SetReady: 'SET_READY',
  SetBlocked: 'SET_BLOCKED',
  SetNeeded: 'SET_NEEDED',
  SetAccessingCamera: 'SET_ACCESSING_CAMERA',
  SetError: 'SET_ERROR',
  ClearError: 'CLEAR_ERROR',
  SetScanError: 'SET_SCAN_ERROR',
  SetScanProgress: 'SET_SCAN_PROGRESS',
  SetPermissionActionLoading: 'SET_PERMISSION_ACTION_LOADING',
  Reset: 'RESET',
} as const;

type Action =
  | { type: typeof ActionType.SetReady }
  | { type: typeof ActionType.SetBlocked }
  | { type: typeof ActionType.SetNeeded }
  | { type: typeof ActionType.SetAccessingCamera }
  | { type: typeof ActionType.SetError; payload: WebcamError }
  | { type: typeof ActionType.ClearError }
  | { type: typeof ActionType.SetScanError; payload: ScanErrorClassification }
  | { type: typeof ActionType.SetScanProgress; payload: number }
  | { type: typeof ActionType.SetPermissionActionLoading; payload: boolean }
  | { type: typeof ActionType.Reset };

export type BaseReaderState = {
  readyState: CameraReadyStateValue;
  error: WebcamError | null;
  scanError: ScanErrorClassification | null;
  scanProgress: number;
  permissionActionLoading: boolean;
};

/**
 * Creates the initial state for the BaseReader reducer.
 *
 * @returns A fresh {@link BaseReaderState} with camera in accessing mode,
 * no error, zero progress, and no loading indicator.
 */
export function getInitialState(): BaseReaderState {
  return {
    readyState: CameraReadyState.AccessingCamera,
    error: null,
    scanError: null,
    scanProgress: 0,
    permissionActionLoading: false,
  };
}

/**
 * Pure reducer for the BaseReader component state machine.
 *
 * Handles transitions between camera readiness phases, error state,
 * scan progress updates, and permission action loading indicators.
 *
 * @param state - The current reducer state.
 * @param action - The dispatched action describing the state transition.
 * @returns The next state after applying the action.
 */
export function baseReaderReducer(
  state: BaseReaderState,
  action: Action,
): BaseReaderState {
  switch (action.type) {
    case ActionType.SetReady:
      return {
        ...state,
        readyState: CameraReadyState.Ready,
        permissionActionLoading: false,
      };
    case ActionType.SetBlocked:
      return {
        ...state,
        readyState: CameraReadyState.CameraAccessBlocked,
        permissionActionLoading: false,
      };
    case ActionType.SetNeeded:
      return {
        ...state,
        readyState: CameraReadyState.CameraAccessNeeded,
        permissionActionLoading: false,
      };
    case ActionType.SetAccessingCamera:
      return { ...state, readyState: CameraReadyState.AccessingCamera };
    case ActionType.SetError:
      return { ...state, error: action.payload };
    case ActionType.ClearError:
      return { ...state, error: null };
    case ActionType.SetScanError:
      return { ...state, scanError: action.payload };
    case ActionType.SetScanProgress:
      return { ...state, scanProgress: action.payload };
    case ActionType.SetPermissionActionLoading:
      return { ...state, permissionActionLoading: action.payload };
    case ActionType.Reset:
      return getInitialState();
    default:
      return state;
  }
}
