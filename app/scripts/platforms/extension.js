const extension = require('extensionizer')
const {createExplorerLink: explorerLink} = require('etherscan-link')

const {getEnvironmentType} = require('../lib/util')
const {ENVIRONMENT_TYPE_BACKGROUND} = require('../lib/enums')

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

  closeCurrentWindow () {
    return extension.windows.getCurrent((windowDetails) => {
      return extension.windows.remove(windowDetails.id)
    })
  }

  getVersion () {
    return extension.runtime.getManifest().version
  }

  openExtensionInBrowser (route = null, queryString = null) {
    let extensionURL = extension.runtime.getURL('home.html')

    if (queryString) {
      extensionURL += `?${queryString}`
    }

    if (route) {
      extensionURL += `#${route}`
    }
    this.openWindow({ url: extensionURL })
    if (getEnvironmentType() !== ENVIRONMENT_TYPE_BACKGROUND) {
      window.close()
    }
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

  showTransactionNotification (txMeta) {
    const { status, txReceipt: { status: receiptStatus } = {} } = txMeta

    if (status === 'confirmed') {
      // There was an on-chain failure
      receiptStatus === '0x0'
        ? this._showFailedTransaction(txMeta, 'Transaction encountered an error.')
        : this._showConfirmedTransaction(txMeta)
    } else if (status === 'failed') {
      this._showFailedTransaction(txMeta)
    }
  }

  _showConfirmedTransaction (txMeta) {

    this._subscribeToNotificationClicked()

    const url = explorerLink(txMeta.hash, parseInt(txMeta.metamaskNetworkId))
    const nonce = parseInt(txMeta.txParams.nonce, 16)

    const title = 'Confirmed transaction'
    const message = `Transaction ${nonce} confirmed! View on Etherscan`
    this._showNotification(title, message, url)
  }

  _showFailedTransaction (txMeta, errorMessage) {

    const nonce = parseInt(txMeta.txParams.nonce, 16)
    const title = 'Failed transaction'
    const message = `Transaction ${nonce} failed! ${errorMessage || txMeta.err.message}`
    this._showNotification(title, message)
  }

  _showNotification (title, message, url) {
    extension.notifications.create(
      url,
      {
        'type': 'basic',
        'title': title,
        'iconUrl': extension.extension.getURL('../../images/icon-64.png'),
        'message': message,
      })
  }

  _subscribeToNotificationClicked () {
    if (!extension.notifications.onClicked.hasListener(this._viewOnEtherscan)) {
      extension.notifications.onClicked.addListener(this._viewOnEtherscan)
    }
  }

  _viewOnEtherscan (txId) {
    if (txId.startsWith('http://')) {
      extension.tabs.create({ url: txId })
    }
  }
}

module.exports = ExtensionPlatform
