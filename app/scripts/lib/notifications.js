const extension = require('./extension')

const notifications = {
  show: showNotification,
  getPopup,
}
module.exports = notifications
window.METAMASK_NOTIFIER = notifications

function showNotification() {
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
  extension.windows.getAll({}, (windows) => {
    let popup = windows.find((win) => {
      return win.type === 'popup'
    })

    cb(popup)
  })
}

