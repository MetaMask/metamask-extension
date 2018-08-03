'use strict'

import DetectRTC from 'detectrtc'
const { ENVIRONMENT_TYPE_POPUP } = require('../../app/scripts/lib/enums')
const { getEnvironmentType } = require('../../app/scripts/lib/util')

class WebcamUtils {

  static checkStatus () {
    return new Promise((resolve, reject) => {
      reject({type: 'UNKNOWN_ERROR'})
    //   const isPopup = getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP
    //   const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
    //   const isBrave = !!window.chrome.ipcRenderer
    //   const isFirefoxOrBrave = isFirefox || isBrave
    //   try {
    //     DetectRTC.load(_ => {
    //       if (DetectRTC.hasWebcam) {
    //           let environmentReady = true
    //           if ((isFirefoxOrBrave && isPopup) || (isPopup && !DetectRTC.isWebsiteHasWebcamPermissions)) {
    //             environmentReady = false
    //           }
    //           resolve({
    //             permissions: DetectRTC.isWebsiteHasWebcamPermissions,
    //             environmentReady,
    //           })
    //       } else {
    //           reject({type: 'NO_WEBCAM_FOUND'})
    //       }
    //     })
    //   } catch (e) {
    //     reject({type: 'UNKNOWN_ERROR'})
    //   }
    })
  }
}

module.exports = WebcamUtils
