const extension = require('extensionizer')
const height = 620
const width = 360


class NotificationManager {

  //
  // Public
  //

  showPopup () {
    this._getPopup((err, popup) => {
      if (err) throw err

      // Bring focus to chrome popup
      if (popup) {
        // bring focus to existing chrome popup
        extension.windows.update(popup.id, { focused: true })
      } else {
        // create new notification popup
        extension.windows.create({
          url: 'notification.html',
          type: 'popup',
          width,
          height,
        })
      }
    })
  }

  closePopup () {
    // closes notification popup
    this._getPopup((err, popup) => {
      if (err) throw err
      if (!popup) return
      extension.windows.remove(popup.id, console.error)
    })
  }

  //
  // Private
  //

  _getPopup (cb) {
    this._getWindows((err, windows) => {
      if (err) throw err
      console.log(windows);
      cb(null, this._getPopupIn(windows))
    })
  }

  _getWindows (cb) {
    // Ignore in test environment
    if (!extension.windows) {
      return cb()
    }

    extension.windows.getAll({}, (windows) => {
      cb(null, windows)
    })
  }

  _getPopupIn (windows) {
    return windows ? windows.find((win) => {
      // Returns notification popup
      console.log(win);
      return (win && win.type === 'popup')
    }) : null
  }

}

module.exports = NotificationManager
