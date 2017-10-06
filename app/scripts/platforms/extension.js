const extension = require('extensionizer')

class ExtensionPlatform {

  //
  // Public
  //
  reload () {
    extension.runtime.reload()
  }

  openWindow ({ url }) {
    extension.tabs.create({ url })
  }

  getVersion () {
    return extension.runtime.getManifest().version
  }

  getPlatformInfo (cb) {
    try {
      return extension.runtime.getPlatformInfo(cb)
    } catch (e) {
      log.debug(e)
      return undefined
    }
  }

}

module.exports = ExtensionPlatform
