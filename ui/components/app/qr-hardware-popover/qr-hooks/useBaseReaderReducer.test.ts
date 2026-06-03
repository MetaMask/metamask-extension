import { renderHook, act } from '@testing-library/react-hooks';
import { CameraReadyState, WebcamErrorType } from '../base-reader.types';
import {
  baseReaderReducer,
  getInitialState,
  ActionType,
} from '../base-reader-reducer';
import { ScanErrorCategory } from '../qr-utils/qr-utils';
import type { ScanErrorClassification } from '../qr-utils/qr-utils';
import { useBaseReaderReducer } from './useBaseReaderReducer';

describe('baseReaderReducer', () => {
  describe('getInitialState', () => {
    it('returns AccessingCamera with no error and zero progress', () => {
      const state = getInitialState();
      expect(state).toStrictEqual({
        readyState: CameraReadyState.AccessingCamera,
        error: null,
        scanError: null,
        scanProgress: 0,
        permissionActionLoading: false,
      });
    });
  });

  describe('SetReady', () => {
    it('transitions readyState to Ready and clears permissionActionLoading', () => {
      const prev = {
        ...getInitialState(),
        permissionActionLoading: true,
      };
      const next = baseReaderReducer(prev, { type: ActionType.SetReady });
      expect(next.readyState).toBe(CameraReadyState.Ready);
      expect(next.permissionActionLoading).toBe(false);
    });
  });

  describe('SetBlocked', () => {
    it('transitions readyState to CameraAccessBlocked', () => {
      const next = baseReaderReducer(getInitialState(), {
        type: ActionType.SetBlocked,
      });
      expect(next.readyState).toBe(CameraReadyState.CameraAccessBlocked);
      expect(next.permissionActionLoading).toBe(false);
    });
  });

  describe('SetNeeded', () => {
    it('transitions readyState to CameraAccessNeeded', () => {
      const next = baseReaderReducer(getInitialState(), {
        type: ActionType.SetNeeded,
      });
      expect(next.readyState).toBe(CameraReadyState.CameraAccessNeeded);
      expect(next.permissionActionLoading).toBe(false);
    });
  });

  describe('SetAccessingCamera', () => {
    it('transitions readyState to AccessingCamera', () => {
      const prev = {
        ...getInitialState(),
        readyState: CameraReadyState.Ready,
      };
      const next = baseReaderReducer(prev, {
        type: ActionType.SetAccessingCamera,
      });
      expect(next.readyState).toBe(CameraReadyState.AccessingCamera);
    });
  });

  describe('SetError', () => {
    it('stores the error object', () => {
      const error = new Error('webcam broken') as Error & { type?: string };
      error.type = WebcamErrorType.NoWebcamFound;
      const next = baseReaderReducer(getInitialState(), {
        type: ActionType.SetError,
        payload: error,
      });
      expect(next.error).toBe(error);
    });
  });

  describe('ClearError', () => {
    it('sets error to null', () => {
      const prev = {
        ...getInitialState(),
        error: new Error('something'),
      };
      const next = baseReaderReducer(prev, { type: ActionType.ClearError });
      expect(next.error).toBeNull();
    });
  });

  describe('SetScanError', () => {
    it('stores the scan error classification', () => {
      const scanError: ScanErrorClassification = {
        category: ScanErrorCategory.NonUrQrScanned,
        isUrFormat: false,
      };
      const next = baseReaderReducer(getInitialState(), {
        type: ActionType.SetScanError,
        payload: scanError,
      });
      expect(next.scanError).toBe(scanError);
    });
  });

  describe('SetScanProgress', () => {
    it('updates scanProgress', () => {
      const next = baseReaderReducer(getInitialState(), {
        type: ActionType.SetScanProgress,
        payload: 0.75,
      });
      expect(next.scanProgress).toBe(0.75);
    });
  });

  describe('SetPermissionActionLoading', () => {
    it('toggles the loading flag', () => {
      const next = baseReaderReducer(getInitialState(), {
        type: ActionType.SetPermissionActionLoading,
        payload: true,
      });
      expect(next.permissionActionLoading).toBe(true);
    });
  });

  describe('Reset', () => {
    it('returns the initial state regardless of current state', () => {
      const dirty = {
        readyState: CameraReadyState.Ready,
        error: new Error('whoops'),
        scanError: {
          category: ScanErrorCategory.ScanException,
          isUrFormat: false,
          rawMessage: 'crash',
        } as ScanErrorClassification,
        scanProgress: 0.5,
        permissionActionLoading: true,
      };
      const next = baseReaderReducer(dirty, { type: ActionType.Reset });
      expect(next).toStrictEqual(getInitialState());
    });
  });

  describe('unknown action', () => {
    it('returns current state unchanged', () => {
      const state = getInitialState();
      const next = baseReaderReducer(state, {
        type: 'UNKNOWN_ACTION',
      } as never);
      expect(next).toBe(state);
    });
  });
});

describe('useBaseReaderReducer', () => {
  it('exposes dispatch helpers that update state correctly', () => {
    const { result } = renderHook(() => useBaseReaderReducer());

    expect(result.current.state.readyState).toBe(
      CameraReadyState.AccessingCamera,
    );

    act(() => result.current.setReady());
    expect(result.current.state.readyState).toBe(CameraReadyState.Ready);

    act(() => result.current.setBlocked());
    expect(result.current.state.readyState).toBe(
      CameraReadyState.CameraAccessBlocked,
    );

    act(() => result.current.setNeeded());
    expect(result.current.state.readyState).toBe(
      CameraReadyState.CameraAccessNeeded,
    );

    act(() => result.current.setAccessingCamera());
    expect(result.current.state.readyState).toBe(
      CameraReadyState.AccessingCamera,
    );

    const err = new Error('test error');
    act(() => result.current.setError(err));
    expect(result.current.state.error).toBe(err);

    act(() => result.current.clearError());
    expect(result.current.state.error).toBeNull();

    const scanError: ScanErrorClassification = {
      category: ScanErrorCategory.WrongUrType,
      isUrFormat: true,
      receivedUrType: 'crypto-psbt',
    };
    act(() => result.current.setScanError(scanError));
    expect(result.current.state.scanError).toBe(scanError);

    act(() => result.current.setScanProgress(0.42));
    expect(result.current.state.scanProgress).toBe(0.42);

    act(() => result.current.setPermissionActionLoading(true));
    expect(result.current.state.permissionActionLoading).toBe(true);

    act(() => result.current.reset());
    expect(result.current.state).toStrictEqual(getInitialState());
  });
});
