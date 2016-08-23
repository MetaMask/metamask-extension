const extension = require('./extension')

const notifications = {
  show: showNotification,
}
module.exports = notifications
window.METAMASK_NOTIFIER = notifications

function showNotification() {
  extension.windows.getAll({}, (windows) => {

    let popupWindow = windows.find((win) => {
      return win.type === 'popup'
    })

    if (popupWindow) {
      return extension.windows.update(popupWindow.id, { focused: true })
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

