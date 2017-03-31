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

}

module.exports = ExtensionPlatform
