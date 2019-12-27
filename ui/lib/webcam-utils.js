'use strict'

import DetectRTC from 'detectrtc'
import { ENVIRONMENT_TYPE_POPUP, PLATFORM_BRAVE, PLATFORM_FIREFOX } from '../../app/scripts/lib/enums'
import { getEnvironmentType, getPlatform } from '../../app/scripts/lib/util'

class WebcamUtils {

  static checkStatus () {
    return new Promise((resolve, reject) => {
      const isPopup = getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP
      const isFirefoxOrBrave = getPlatform() === (PLATFORM_FIREFOX || PLATFORM_BRAVE)
      try {
        DetectRTC.load(_ => {
          if (DetectRTC.hasWebcam) {
            let environmentReady = true
            if ((isFirefoxOrBrave && isPopup) || (isPopup && !DetectRTC.isWebsiteHasWebcamPermissions)) {
              environmentReady = false
            }
            resolve({
              permissions: DetectRTC.isWebsiteHasWebcamPermissions,
              environmentReady,
            })
          } else {
            reject({ type: 'NO_WEBCAM_FOUND' })
          }
        })
      } catch (e) {
        reject({ type: 'UNKNOWN_ERROR' })
      }
    })
  }
}

export default WebcamUtils
