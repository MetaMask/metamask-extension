import ExtensionPlatform from '../platforms/extension'

const NOTIFICATION_HEIGHT = 620
const NOTIFICATION_WIDTH = 360

class NotificationManager {

  /**
   * A collection of methods for controlling the showing and hiding of the notification popup.
   *
   * @typedef {Object} NotificationManager
   *
   */

  constructor () {
    this.platform = new ExtensionPlatform()
  }

  /**
   * Either brings an existing MetaMask notification window into focus, or creates a new notification window. New
   * notification windows are given a 'popup' type.
   *
   */
  async showPopup () {
    const popup = await this._getPopup()

    // Bring focus to chrome popup
    if (popup) {
      // bring focus to existing chrome popup
      await this.platform.focusWindow(popup.id)
    } else {
      const { screenX, screenY, outerWidth, outerHeight } = window
      const notificationTop = Math.round(screenY + (outerHeight / 2) - (NOTIFICATION_HEIGHT / 2))
      const notificationLeft = Math.round(screenX + (outerWidth / 2) - (NOTIFICATION_WIDTH / 2))
      // create new notification popup
      const popupWindow = await this.platform.openWindow({
        url: 'notification.html',
        type: 'popup',
        width: NOTIFICATION_WIDTH,
        height: NOTIFICATION_HEIGHT,
        top: Math.max(notificationTop, 0),
        left: Math.max(notificationLeft, 0),
      })
      this._popupId = popupWindow.id
    }
  }

  /**
   * Closes a MetaMask notification if it window exists.
   *
   */
  async closePopup () {
    const popup = this._getPopup()
    if (!popup) {
      return
    }
    await this.platform.removeWindow(popup.id)
  }

  /**
   * Checks all open MetaMask windows, and returns the first one it finds that is a notification window (i.e. has the
   * type 'popup')
   *
   * @private
   * @param {Function} cb - A node style callback that to whcih the found notification window will be passed.
   *
   */
  async _getPopup () {
    const windows = await this.platform.getAllWindows()
    return this._getPopupIn(windows)
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
