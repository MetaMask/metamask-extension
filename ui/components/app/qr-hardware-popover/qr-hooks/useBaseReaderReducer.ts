import { useReducer, useCallback } from 'react';
import {
  baseReaderReducer,
  getInitialState,
  ActionType,
} from '../base-reader-reducer';
import type { ScanErrorClassification } from '../qr-utils/qr-utils';

/**
 * Wraps the BaseReader reducer and provides typed dispatch helpers so callers
 * don't need to construct action objects directly.
 *
 * @returns An object containing the current state and memoized dispatch
 * functions: `setReady`, `setBlocked`, `setNeeded`, `setAccessingCamera`,
 * `setError`, `clearError`, `setScanProgress`, `setPermissionActionLoading`,
 * and `reset`.
 */
export function useBaseReaderReducer() {
  const [state, dispatch] = useReducer(
    baseReaderReducer,
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
    (error: Error & { type?: string }) =>
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
