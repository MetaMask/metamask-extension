'use strict'

import DetectRTC from 'detectrtc'
const { ENVIRONMENT_TYPE_POPUP } = require('../../app/scripts/lib/enums')
const { getEnvironmentType, getPlatform } = require('../../app/scripts/lib/util')
const { PLATFORM_BRAVE, PLATFORM_FIREFOX } = require('../../app/scripts/lib/enums')

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
            reject({type: 'NO_WEBCAM_FOUND'})
          }
        })
      } catch (e) {
        reject({type: 'UNKNOWN_ERROR'})
      }
    })
  }
}

module.exports = WebcamUtils
