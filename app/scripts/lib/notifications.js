const extension = require('./extension')

const notifications = {
  show,
  getPopup,
  closePopup,
}
module.exports = notifications
window.METAMASK_NOTIFIER = notifications

function show () {
  getPopup((popup) => {
    if (popup) {
      return extension.windows.update(popup.id, { focused: true })
    }

    extension.windows.create({
      url: 'notification.html',
      type: 'detached_panel',
      focused: true,
      width: 360,
      height: 500,
    })
  })
}

function getPopup(cb) {

  // Ignore in test environment
  if (!extension.windows) {
    return cb(null)
  }

  extension.windows.getAll({}, (windows) => {
    let popup = windows.find((win) => {
      return win.type === 'popup'
    })

    cb(popup)
  })
}

function closePopup() {
  getPopup((popup) => {
    if (!popup) return
    extension.windows.remove(popup.id, console.error)
  })
}
