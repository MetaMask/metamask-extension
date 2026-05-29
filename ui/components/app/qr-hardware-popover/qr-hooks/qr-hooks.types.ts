import type { WebcamError } from '../base-reader.types';
import type { ScanErrorClassification } from '../qr-utils/qr-utils';

/**
 * State dispatch functions consumed by the camera permission hook.
 */
export type StateDispatchers = {
  setReady: () => void;
  setBlocked: () => void;
  setNeeded: () => void;
  setError: (error: WebcamError) => void;
  setPermissionActionLoading: (loading: boolean) => void;
};

/**
 * MetaMetrics tracking callbacks for camera recovery CTA events.
 */
export type TrackingCallbacks = {
  trackCameraRecoveryCtaClicked: () => void;
};

/**
 * State update callbacks consumed by the decoder lifecycle hook.
 */
export type DecoderCallbacks = {
  setScanProgress: (progress: number) => void;
  setScanError: (scanError: ScanErrorClassification) => void;
  setError: (error: WebcamError) => void;
};
