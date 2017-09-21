const extension = require('extensionizer')

class ExtensionPlatform {

  //
  // Public
  //
  get isExtension () {
    return true
  }

  reload () {
    extension.runtime.reload()
  }

  openWindow ({ url }) {
    extension.tabs.create({ url })
  }

  getVersion () {
    return extension.runtime.getManifest().version
  }

}

module.exports = ExtensionPlatform
