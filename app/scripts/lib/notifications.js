const extension = require('./extension')

const notifications = {
  createUnlockRequestNotification: createUnlockRequestNotification,
  createTxNotification: createTxNotification,
  createMsgNotification: createMsgNotification,
}
module.exports = notifications
window.METAMASK_NOTIFIER = notifications

function createUnlockRequestNotification (opts) {
  showNotification()
}

function createTxNotification (state) {
  showNotification()
}

function createMsgNotification (state) {
  showNotification()
}

function showNotification() {
  extension.windows.create({
    url: 'notification.html',
    type: 'detached_panel',
    focused: true,
    width: 360,
    height: 500,
  })
}

