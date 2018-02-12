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

  isInBrowser () {
    return new Promise((resolve, reject) => {
      try {
        extension.tabs.getCurrent(currentTab => {
          if (currentTab) {
            resolve(true)
          } else {
            resolve(false)
          }
        })
      } catch (e) {
        reject(e)
      }
    })
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
}

module.exports = ExtensionPlatform
