const createId = require('hat')
const extend = require('xtend')
const unmountComponentAtNode = require('react-dom').unmountComponentAtNode
const findDOMNode = require('react-dom').findDOMNode
const render = require('react-dom').render
const h = require('react-hyperscript')
const PendingTxDetails = require('../../../ui/app/components/pending-tx-details')
const PendingMsgDetails = require('../../../ui/app/components/pending-msg-details')
const MetaMaskUiCss = require('../../../ui/css')
const extension = require('./extension')
var notificationHandlers = {}

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
    url:"notification.html",
    type:"panel",
    width:360,
    height:500,
  })
}

