'use strict';

import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { CameraPermissionState } from '../../contexts/hardware-wallets/constants';
import {
  openCameraVideoStream,
  queryCameraPermissionWithStatus,
  stopMediaStreamTracks,
} from '../../contexts/hardware-wallets/webConnectionUtils';

class WebcamUtils {
  /**
   * Queries the Permissions API for the camera. Some browsers (e.g. older Safari)
   * do not support `name: 'camera'` — callers should treat failures as `'prompt'`
   * and rely on `getUserMedia` errors for classification.
   *
   * @returns {Promise<{ state: 'granted' | 'denied' | 'prompt', permissionStatus: PermissionStatus | null }>}
   */
  static async queryCameraPermission() {
    return queryCameraPermissionWithStatus();
  }

  /**
   * @returns {Promise<MediaStream>}
   */
  static async requestVideoStream() {
    return openCameraVideoStream();
  }

  /**
   * @param {MediaStream} stream
   */
  static stopVideoStream(stream) {
    stopMediaStreamTracks(stream);
  }

  static async checkStatus() {
    const environmentType = getEnvironmentType();
    const isRestrictedEnvironment =
      environmentType === ENVIRONMENT_TYPE_POPUP ||
      environmentType === ENVIRONMENT_TYPE_SIDEPANEL;

    const devices = await window.navigator.mediaDevices.enumerateDevices();
    const hasWebcam = devices.some((device) => device.kind === 'videoinput');

    if (!hasWebcam) {
      const error = new Error('No webcam found');
      error.type = 'NO_WEBCAM_FOUND';
      throw error;
    }

    // Detect permission via the Permissions API rather than device labels.
    // Device labels stay blank until `getUserMedia` has succeeded in the
    // current document (per the media-capture spec, and reinforced by Brave's
    // anti-fingerprinting "farbling"), so they can't tell us whether the
    // extension origin already holds a persisted grant.
    const { state } = await queryCameraPermissionWithStatus();
    const hasWebcamPermissions = state === CameraPermissionState.Granted;

    // No Chromium context (popup or side panel) can surface a camera prompt,
    // so redirect those to fullscreen whenever the grant isn't already in
    // place. Once granted, the origin-scoped permission is reused in place —
    // this is what lets the user sign entirely within the side panel.
    const environmentReady = !(
      isRestrictedEnvironment && !hasWebcamPermissions
    );

    return {
      permissions: hasWebcamPermissions,
      environmentReady,
    };
  }
}

export default WebcamUtils;
