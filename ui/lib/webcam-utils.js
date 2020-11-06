'use strict'

import {
  ENVIRONMENT_TYPE_POPUP,
  PLATFORM_BRAVE,
  PLATFORM_FIREFOX,
} from '../../app/scripts/lib/enums'
import { getEnvironmentType, getPlatform } from '../../app/scripts/lib/util'

class WebcamUtils {
  static async checkStatus() {
    const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
    const isFirefoxOrBrave =
      getPlatform() === (PLATFORM_FIREFOX || PLATFORM_BRAVE)

    const devices = await window.navigator.mediaDevices.enumerateDevices()
    const webcams = devices.filter((device) => device.kind === 'videoinput')
    const hasWebcam = webcams.length > 0
    // A non-empty-string label implies that the webcam has been granted permission, as
    // otherwise the label is kept blank to prevent fingerprinting
    const hasWebcamPermissions = webcams.some(
      (webcam) => webcam.label && webcam.label.length > 0,
    )

    if (hasWebcam) {
      let environmentReady = true
      if ((isFirefoxOrBrave && isPopup) || (isPopup && !hasWebcamPermissions)) {
        environmentReady = false
      }
      return {
        permissions: hasWebcamPermissions,
        environmentReady,
      }
    }
    const error = new Error('No webcam found')
    error.type = 'NO_WEBCAM_FOUND'
    throw error
  }
}

export default WebcamUtils
