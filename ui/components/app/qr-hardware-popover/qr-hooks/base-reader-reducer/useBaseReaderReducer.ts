import { useReducer, useCallback } from 'react';
import {
  baseQrReaderReducer,
  getInitialState,
  ActionType,
} from '../../base-qr-reader/base-qr-reader-reducer';
import type { WebcamError } from '../../base-qr-reader/base-qr-reader.types';
import type { ScanErrorClassification } from '../../qr-utils/qr-utils';

/**
 * Wraps the BaseQrReader reducer and provides typed dispatch helpers so callers
 * do not need to construct action objects directly.
 *
 * @returns An object containing the current state and memoized dispatch
 * functions: `setAccessingCamera`, `setReady`, `setBlocked`, `setNeeded`,
 * `setError`, `clearError`, `setScanError`, `setScanProgress`,
 * `setPermissionActionLoading`, and `reset`.
 */
export function useBaseReaderReducer() {
  const [state, dispatch] = useReducer(
    baseQrReaderReducer,
    undefined,
    getInitialState,
  );

  const setReady = useCallback(
    () => dispatch({ type: ActionType.SetReady }),
    [],
  );
  const setBlocked = useCallback(
    () => dispatch({ type: ActionType.SetBlocked }),
    [],
  );
  const setNeeded = useCallback(
    () => dispatch({ type: ActionType.SetNeeded }),
    [],
  );
  const setAccessingCamera = useCallback(
    () => dispatch({ type: ActionType.SetAccessingCamera }),
    [],
  );
  const setError = useCallback(
    (error: WebcamError) =>
      dispatch({ type: ActionType.SetError, payload: error }),
    [],
  );
  const clearError = useCallback(
    () => dispatch({ type: ActionType.ClearError }),
    [],
  );
  const setScanError = useCallback(
    (scanError: ScanErrorClassification) =>
      dispatch({ type: ActionType.SetScanError, payload: scanError }),
    [],
  );
  const setScanProgress = useCallback(
    (progress: number) =>
      dispatch({ type: ActionType.SetScanProgress, payload: progress }),
    [],
  );
  const setPermissionActionLoading = useCallback(
    (loading: boolean) =>
      dispatch({
        type: ActionType.SetPermissionActionLoading,
        payload: loading,
      }),
    [],
  );
  const reset = useCallback(() => dispatch({ type: ActionType.Reset }), []);

  return {
    state,
    setReady,
    setBlocked,
    setNeeded,
    setAccessingCamera,
    setError,
    clearError,
    setScanError,
    setScanProgress,
    setPermissionActionLoading,
    reset,
  } as const;
}
