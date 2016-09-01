const extension = require('./extension')

const notifications = {
  show,
  getPopup,
  closePopup,
}
module.exports = notifications
window.METAMASK_NOTIFIER = notifications

function show () {
  getWindows((windows) => {

    if (windows.length > 0) {
      const win = windows[0]
      return extension.windows.update(win.id, { focused: true })
    }

    extension.windows.create({
      url: 'notification.html',
      type: 'popup',
      focused: true,
      width: 360,
      height: 500,
    })
  })
}

function getWindows(cb) {
  // Ignore in test environment
  if (!extension.windows) {
    return cb()
  }

  extension.windows.getAll({}, (windows) => {
    cb(null, windows)
  })
}

function getPopup(cb) {
  getWindows((windows) => {
    cb(getPopupIn(windows))
  })
}

function getPopupIn(windows) {
  return  windows ? windows.find((win) => {
    return win.type === 'popup'
  }) : null
}

function closePopup() {
  getPopup((popup) => {
    if (!popup) return
    extension.windows.remove(popup.id, console.error)
  })
}
