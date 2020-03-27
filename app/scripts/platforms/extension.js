import extension from 'extensionizer'
const explorerLinks = require('eth-net-props').explorerLinks
const { capitalizeFirstLetter, getEnvironmentType, checkForError } = require('../lib/util')
const { ENVIRONMENT_TYPE_BACKGROUND } = require('../lib/enums')

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

  /**
   * Closes all notifications windows, when action is confirmed in popup
   * or closes notification window itself, when action is confirmed from it
   */
  closeNotificationWindow () {
    return extension.windows.getCurrent((curWindowsDetails) => {
      if (curWindowsDetails.type === 'popup') {
        return extension.windows.remove(curWindowsDetails.id)
      } else {
        extension.windows.getAll((windowsDetails) => {
          const windowsDetailsFiltered = windowsDetails.filter((windowDetails) => windowDetails.id !== curWindowsDetails.id)
          return windowsDetailsFiltered.forEach((windowDetails) => {
            if (windowDetails.type === 'popup') {
              extension.windows.remove(windowDetails.id)
            }
          })
        })
      }
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

  currentTab () {
    return new Promise((resolve, reject) => {
      extension.tabs.getCurrent((tab) => {
        const err = checkForError()
        if (err) {
          reject(err)
        } else {
          resolve(tab)
        }
      })
    })
  }

  switchToTab (tabId) {
    return new Promise((resolve, reject) => {
      extension.tabs.update(tabId, { highlighted: true }, (tab) => {
        const err = checkForError()
        if (err) {
          reject(err)
        } else {
          resolve(tab)
        }
      })
    })
  }

  closeTab (tabId) {
    return new Promise((resolve, reject) => {
      extension.tabs.remove(tabId, () => {
        const err = checkForError()
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  _showConfirmedTransaction (txMeta) {

    this._subscribeToNotificationClicked()

    const { url, explorerName } = this._getExplorer(txMeta.hash, parseInt(txMeta.metamaskNetworkId))
    const nonce = parseInt(txMeta.txParams.nonce, 16)

    const title = 'Confirmed transaction'
    const message = `Transaction ${nonce} confirmed! View on ${explorerName}`
    this._showNotification(title, message, url)
  }

  _showFailedTransaction (txMeta, errorMessage) {

    const nonce = parseInt(txMeta.txParams.nonce, 16)
    const title = 'Failed transaction'
    const message = `Transaction ${nonce} failed! ${errorMessage || capitalizeFirstLetter(txMeta.err.message)}`
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
    if (!extension.notifications.onClicked.hasListener(this._viewOnExplorer)) {
      extension.notifications.onClicked.removeListener(this._viewOnExplorer)
    }
    extension.notifications.onClicked.addListener(this._viewOnExplorer)
  }

  _viewOnExplorer (url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      global.metamaskController.platform.openWindow({ url })
    }
  }

  _getExplorer (hash, networkId) {
    const explorerName = 'BlockScout'

    return {
      explorerName: explorerName,
      url: explorerLinks.getExplorerTxLinkFor(hash, networkId),
    }
  }
}

module.exports = ExtensionPlatform
