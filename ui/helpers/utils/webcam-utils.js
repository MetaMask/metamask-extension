'use strict';

import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
  PLATFORM_BRAVE,
  PLATFORM_FIREFOX,
} from '../../../shared/constants/app';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { getBrowserName } from '../../../shared/lib/browser-runtime.utils';
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
    const isPopup = environmentType === ENVIRONMENT_TYPE_POPUP;
    const isSidepanel = environmentType === ENVIRONMENT_TYPE_SIDEPANEL;
    const browserName = getBrowserName();
    const isFirefoxOrBrave =
      browserName === PLATFORM_FIREFOX || browserName === PLATFORM_BRAVE;

    const devices = await window.navigator.mediaDevices.enumerateDevices();
    const webcams = devices.filter((device) => device.kind === 'videoinput');
    const hasWebcam = webcams.length > 0;
    // A non-empty-string label implies that the webcam has been granted permission, as
    // otherwise the label is kept blank to prevent fingerprinting
    const hasWebcamPermissions = webcams.some(
      (webcam) => webcam.label && webcam.label.length > 0,
    );

    if (hasWebcam) {
      let environmentReady = true;
      // Popup and sidepanel modes have limited camera permission capabilities.
      // When permissions aren't granted, redirect to fullscreen mode where
      // the browser can properly prompt for camera access.
      const isRestrictedEnvironment = isPopup || isSidepanel;
      if (
        (isFirefoxOrBrave && isRestrictedEnvironment) ||
        (isRestrictedEnvironment && !hasWebcamPermissions)
      ) {
        environmentReady = false;
      }
      return {
        permissions: hasWebcamPermissions,
        environmentReady,
      };
    }
    const error = new Error('No webcam found');
    error.type = 'NO_WEBCAM_FOUND';
    throw error;
  }
}

export default WebcamUtils;
