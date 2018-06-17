const extension = require('extensionizer')
const height = 620
const width = 360


class NotificationManager {

  /**
   * A collection of methods for controlling the showing and hiding of the notification popup.
   *
   * @typedef {Object} NotificationManager
   *
   */

   /**
    * A success callback for when popup window is created. Saves the popup window ID in an instance variable.
    * @param {Object} created popup window object.
    */
   _onCreated(popUpInfo) {
    this._popUpId = popUpInfo.id;
   }

  /**
   * Either brings an existing MetaMask notification window into focus, or creates a new notification window. New
   * notification windows are given a 'popup' type.
   *
   */
  showPopup () {
    this._getPopup((err, popup) => {
      if (err) throw err

      // Bring focus to chrome popup
      if (popup) {
        // bring focus to existing chrome popup
        extension.windows.update(popup.id, { focused: true })
      } else {
        // create new notification popup
        let popUp = extension.windows.create({
          url: 'notification.html',
          type: 'popup',
          width,
          height,
        });

        popUp.then(this._onCreated);
      }
    })
  }

  /**
   * Closes a MetaMask notification if it window exists.
   *
   */
  closePopup () {
    // closes notification popup
    this._getPopup((err, popup) => {
      if (err) throw err
      if (!popup) return
      extension.windows.remove(popup.id, console.error)
    })
  }

  /**
   * Checks all open MetaMask windows, and returns the first one it finds that is a notification window (i.e. has the
   * type 'popup')
   *
   * @private
   * @param {Function} cb A node style callback that to whcih the found notification window will be passed.
   *
   */
  _getPopup (cb) {
    this._getWindows((err, windows) => {
      if (err) throw err
      cb(null, this._getPopupIn(windows))
    })
  }

  /**
   * Returns all open MetaMask windows.
   *
   * @private
   * @param {Function} cb A node style callback that to which the windows will be passed.
   *
   */
  _getWindows (cb) {
    // Ignore in test environment
    if (!extension.windows) {
      return cb()
    }

    extension.windows.getAll({}, (windows) => {
      cb(null, windows)
    })
  }

  /**
   * Given an array of windows, returns the first that has a 'popup' type, or null if no such window exists.
   *
   * @private
   * @param {array} windows An array of objects containing data about the open MetaMask extension windows.
   *
   */
  _getPopupIn (windows) {
    return windows ? windows.find((win) => {
      // Returns notification popup
      return (win && win.type === 'popup' && win.id === this._popUpId)
    }) : null
  }

}

module.exports = NotificationManager
