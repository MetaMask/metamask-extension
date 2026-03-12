'use strict';

import browser from 'webextension-polyfill';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
  PLATFORM_BRAVE,
  PLATFORM_EDGE,
  PLATFORM_FIREFOX,
} from '../../../shared/constants/app';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { getBrowserName } from '../../../shared/lib/browser-runtime.utils';

class WebcamUtils {
  static async checkStatus() {
    const environmentType = getEnvironmentType();
    const isPopup = environmentType === ENVIRONMENT_TYPE_POPUP;
    const isSidepanel = environmentType === ENVIRONMENT_TYPE_SIDEPANEL;
    const isFirefoxOrBrave =
      getBrowserName() === (PLATFORM_FIREFOX || PLATFORM_BRAVE);

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

  /**
   * Queries the Permissions API for the current camera permission state.
   * Returns the PermissionStatus object (with .state and .onchange) so the
   * caller can both read the state and subscribe to changes.
   *
   * Returns null on browsers that don't support querying camera permission
   * (e.g. older Safari), in which case callers should fall back to inferring
   * state from getUserMedia errors.
   */
  static async getPermissionState() {
    try {
      return await navigator.permissions.query({ name: 'camera' });
    } catch {
      return null;
    }
  }

  /**
   * Returns the current extension's ID using the webextension-polyfill
   * (works in Chrome, Brave, Edge, and Firefox).
   *
   * @returns The extension ID, or null if unavailable.
   */
  static getExtensionId() {
    return browser?.runtime?.id ?? null;
  }

  /**
   * Returns true when the current browser is Firefox.
   */
  static isFirefox() {
    return getBrowserName() === PLATFORM_FIREFOX;
  }

  /**
   * Returns a browser-specific settings URL that links to the page where
   * the user can grant camera access for this extension.
   *
   * - Chromium (Chrome, Brave, Edge): links directly to the extension's
   *   site-detail permissions page.
   * - Firefox: links to the Privacy & Security settings page (the closest
   *   available deep-link — Firefox has no per-site equivalent).
   *
   * @returns The settings URL, or null if the extension ID is unavailable.
   */
  static getCameraSettingsUrl() {
    const currentBrowser = getBrowserName();

    if (currentBrowser === PLATFORM_FIREFOX) {
      return 'about:preferences#privacy';
    }

    const extensionId = WebcamUtils.getExtensionId();
    if (!extensionId) {
      return null;
    }

    const site = encodeURIComponent(`chrome-extension://${extensionId}`);

    let scheme;
    if (currentBrowser === PLATFORM_BRAVE) {
      scheme = 'brave';
    } else if (currentBrowser === PLATFORM_EDGE) {
      scheme = 'edge';
    } else {
      scheme = 'chrome';
    }

    return `${scheme}://settings/content/siteDetails?site=${site}`;
  }

  /**
   * Opens the browser's camera permission settings page for this extension
   * in a new tab using the extension tabs API. Regular <a> tags and
   * window.open() cannot navigate to chrome:// / brave:// / about: URLs
   * from extension pages, so we use browser.tabs.create() instead.
   */
  static async openCameraSettings() {
    const url = WebcamUtils.getCameraSettingsUrl();
    if (!url) {
      return;
    }
    await browser.tabs.create({ url });
  }
}

export default WebcamUtils;
