const extension = require('extensionizer')
const height = 520
const width = 360


class NotificationManager {

  //
  // Public
  //

  show () {
    this.getPopup((err, popup) => {
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
        })
        .catch((reason) => {
          log.error('failed to create poupup', reason)
        })
      }
    })
  }

  getPopup (cb) {
    this._getWindows((err, windows) => {
      if (err) throw err
      cb(null, this._getPopupIn(windows))
    })
  }

  closePopup () {
    this.getPopup((err, popup) => {
      if (err) throw err
      if (!popup) return
      extension.windows.remove(popup.id, console.error)
    })
  }

  //
  // Private
  //

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
      return (win && win.type === 'popup' &&
        win.height === height &&
        win.width === width)
    }) : null
  }

}

module.exports = NotificationManager