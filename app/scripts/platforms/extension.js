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
    var info
    try {
      info = extension.runtime.getPlatformInfo(cb)
    } catch (e) {
      log.debug(e)
      info = undefined
    }
    return info
  }

}

module.exports = ExtensionPlatform
