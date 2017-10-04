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

  getPlatformInfo () {
    return extension.runtime.getPlatformInfo()
  }

}

module.exports = ExtensionPlatform
