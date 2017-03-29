const extension = require('./extension')
const height = 520
const width = 360

const notifications = {
  show,
  getPopup,
  closePopup,
}
module.exports = notifications
window.METAMASK_NOTIFIER = notifications

function show () {
  getPopup((err, popup) => {
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
        log.error("failed to create poupup", reason)
      })
    }
  })
}

function getWindows (cb) {
  // Ignore in test environment
  if (!extension.windows) {
    return cb()
  }

  extension.windows.getAll({}, (windows) => {
    cb(null, windows)
  })
}

function getPopup (cb) {
  getWindows((err, windows) => {
    if (err) throw err
    cb(null, getPopupIn(windows))
  })
}

function getPopupIn (windows) {
  return windows ? windows.find((win) => {
    return (win && win.type === 'popup' &&
      win.height === height &&
      win.width === width)
  }) : null
}

function closePopup () {
  getPopup((err, popup) => {
    if (err) throw err
    if (!popup) return
    extension.windows.remove(popup.id, console.error)
  })
}
