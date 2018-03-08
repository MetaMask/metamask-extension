const extension = require('extensionizer')
const height = 620
const width = 360


class NotificationManager {

  //
  // Public
  //

  showPopup (cb) {
    this._getPopup((err, popup) => {
      if (err) throw err

      if (popup) {
        // bring focus to existing popup
        extension.windows.update(popup.id, { focused: true })
      } else {
        // create new popup
        extension.windows.create({
          url: 'notification.html',
          type: 'popup',
          width,
          height,
        }, (win) => {
          // naming of popup window and a popup in chrome extension sense is confusing
          cb((win.type == 'popup'));
        })
      }
    })
  }

  closePopup () {
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
      return (win && win.type === 'popup')
    }) : null
  }

}

module.exports = NotificationManager
