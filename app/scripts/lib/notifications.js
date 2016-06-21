const createId = require('hat')
const uiUtils = require('../../../ui/app/util')
var notificationHandlers = {}

module.exports = {
  createUnlockRequestNotification: createUnlockRequestNotification,
  createTxNotification: createTxNotification,
  createMsgNotification: createMsgNotification,
}

setupListeners()

function setupListeners () {
  // guard for chrome bug https://github.com/MetaMask/metamask-plugin/issues/236
  if (!chrome.notifications) return console.error('Chrome notifications API missing...')

  // notification button press
  chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
    var handlers = notificationHandlers[notificationId]
    if (buttonIndex === 0) {
      handlers.confirm()
    } else {
      handlers.cancel()
    }
    chrome.notifications.clear(notificationId)
  })

  // notification teardown
  chrome.notifications.onClosed.addListener(function (notificationId) {
    delete notificationHandlers[notificationId]
  })
}

// creation helper
function createUnlockRequestNotification (opts) {
  // guard for chrome bug https://github.com/MetaMask/metamask-plugin/issues/236
  if (!chrome.notifications) return console.error('Chrome notifications API missing...')
  var message = 'An Ethereum app has requested a signature. Please unlock your account.'

  var id = createId()
  chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: '/images/icon-128.png',
    title: opts.title,
    message: message,
  })
}

function createTxNotification (opts) {
  // guard for chrome bug https://github.com/MetaMask/metamask-plugin/issues/236
  if (!chrome.notifications) return console.error('Chrome notifications API missing...')
  var message = [
    'Submitted by ' + opts.txParams.origin,
    'to: ' + uiUtils.addressSummary(opts.txParams.to),
    'from: ' + uiUtils.addressSummary(opts.txParams.from),
    'value: ' + uiUtils.formatBalance(opts.txParams.value),
    'data: ' + uiUtils.dataSize(opts.txParams.data),
  ].join('\n')

  var id = createId()
  chrome.notifications.create(id, {
    type: 'basic',
    requireInteraction: true,
    iconUrl: '/images/icon-128.png',
    title: opts.title,
    message: message,
    buttons: [{
      title: 'confirm',
    }, {
      title: 'cancel',
    }],
  })
  notificationHandlers[id] = {
    confirm: opts.confirm,
    cancel: opts.cancel,
  }
}

function createMsgNotification (opts) {
  // guard for chrome bug https://github.com/MetaMask/metamask-plugin/issues/236
  if (!chrome.notifications) return console.error('Chrome notifications API missing...')
  var message = [
    'Submitted by ' + opts.msgParams.origin,
    'to be signed by: ' + uiUtils.addressSummary(opts.msgParams.from),
    'message:\n' + opts.msgParams.data,
  ].join('\n')

  var id = createId()
  chrome.notifications.create(id, {
    type: 'basic',
    requireInteraction: true,
    iconUrl: '/images/icon-128.png',
    title: opts.title,
    message: message,
    buttons: [{
      title: 'confirm',
    }, {
      title: 'cancel',
    }],
  })
  notificationHandlers[id] = {
    confirm: opts.confirm,
    cancel: opts.cancel,
  }
}
