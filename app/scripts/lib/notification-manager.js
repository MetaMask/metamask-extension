import extension from 'extensionizer'

const NOTIFICATION_HEIGHT = 620
const NOTIFICATION_WIDTH = 360

class NotificationManager {

  /**
   * A collection of methods for controlling the showing and hiding of the notification popup.
   *
   * @typedef {Object} NotificationManager
   *
   */

  /**
   * Either brings an existing MetaMask notification window into focus, or creates a new notification window. New
   * notification windows are given a 'popup' type.
   *
   */
  showPopup () {
    this._getPopup((err, popup) => {
      if (err) {
        throw err
      }

      // Bring focus to chrome popup
      if (popup) {
        // bring focus to existing chrome popup
        extension.windows.update(popup.id, { focused: true })
      } else {
        const { screenX, screenY, outerWidth, outerHeight } = window
        const notificationTop = Math.round(screenY + (outerHeight / 2) - (NOTIFICATION_HEIGHT / 2))
        const notificationLeft = Math.round(screenX + (outerWidth / 2) - (NOTIFICATION_WIDTH / 2))
        const cb = (currentPopup) => {
          this._popupId = currentPopup.id
        }
        // create new notification popup
        const creation = extension.windows.create({
          url: 'notification.html',
          type: 'popup',
          width: NOTIFICATION_WIDTH,
          height: NOTIFICATION_HEIGHT,
          top: Math.max(notificationTop, 0),
          left: Math.max(notificationLeft, 0),
        }, cb)
        creation && creation.then && creation.then(cb)
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
      if (err) {
        throw err
      }
      if (!popup) {
        return
      }
      extension.windows.remove(popup.id, console.error)
    })
  }

  /**
   * Checks all open MetaMask windows, and returns the first one it finds that is a notification window (i.e. has the
   * type 'popup')
   *
   * @private
   * @param {Function} cb - A node style callback that to whcih the found notification window will be passed.
   *
   */
  _getPopup (cb) {
    this._getWindows((err, windows) => {
      if (err) {
        throw err
      }
      cb(null, this._getPopupIn(windows))
    })
  }

  /**
   * Returns all open MetaMask windows.
   *
   * @private
   * @param {Function} cb - A node style callback that to which the windows will be passed.
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
   * Given an array of windows, returns the 'popup' that has been opened by MetaMask, or null if no such window exists.
   *
   * @private
   * @param {array} windows - An array of objects containing data about the open MetaMask extension windows.
   *
   */
  _getPopupIn (windows) {
    return windows ? windows.find((win) => {
      // Returns notification popup
      return (win && win.type === 'popup' && win.id === this._popupId)
    }) : null
  }

}

export default NotificationManager
