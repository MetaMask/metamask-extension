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

  openExtensionInBrowser () {
    const extensionURL = extension.runtime.getURL('home.html')
    this.openWindow({ url: extensionURL })
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

  addMessageListener (cb) {
    extension.runtime.onMessage.addListener(cb)
  }

}

module.exports = ExtensionPlatform
