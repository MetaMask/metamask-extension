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
      extension.runtime.getPlatformInfo((platform) => {
        cb(null, platform)
      })
    } catch (e) {
      cb(e)
    }
  }

  isOnline () {
    return navigator.onLine
  }

  onLine (cb) {
    window.addEventListener('online', cb)
  }
}

module.exports = ExtensionPlatform
