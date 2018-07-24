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

  sendMessage (message, query = {}) {
    extension.tabs.query(query, tabs => {
      const activeTab = tabs.filter(tab => tab.active)[0]
      extension.tabs.sendMessage(activeTab.id, message)
      console.log('QR-SCANNER: message sent to tab', message, activeTab)
    })
  }
}

module.exports = ExtensionPlatform
