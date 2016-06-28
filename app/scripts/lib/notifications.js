const createId = require('hat')
const extend = require('xtend')
const unmountComponentAtNode = require('react-dom').unmountComponentAtNode
const findDOMNode = require('react-dom').findDOMNode
const render = require('react-dom').render
const h = require('react-hyperscript')
const PendingTxDetails = require('../../../ui/app/components/pending-tx-details')
const PendingMsgDetails = require('../../../ui/app/components/pending-msg-details')
const MetaMaskUiCss = require('../../../ui/css')
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

  var state = {
    title: 'New Unsigned Transaction',
    imageifyIdenticons: false,
    txData: {
      txParams: opts.txParams,
      time: (new Date()).getTime(),
    },
    identities: {

    },
    accounts: {

    },
    onConfirm: opts.confirm,
    onCancel: opts.cancel,
  }

  renderTxNotificationSVG(state, function(err, notificationSvgSource){
    if (err) throw err

    showNotification(extend(state, {
      imageUrl: toSvgUri(notificationSvgSource),
    }))

  })
}

function createMsgNotification (opts) {
  // guard for chrome bug https://github.com/MetaMask/metamask-plugin/issues/236
  if (!chrome.notifications) return console.error('Chrome notifications API missing...')

  var state = {
    title: 'New Unsigned Message',
    imageifyIdenticons: false,
    txData: {
      msgParams: opts.msgParams,
      time: (new Date()).getTime(),
    },
    identities: {

    },
    accounts: {

    },
    onConfirm: opts.confirm,
    onCancel: opts.cancel,
  }

  renderMsgNotificationSVG(state, function(err, notificationSvgSource){
    if (err) throw err

    showNotification(extend(state, {
      imageUrl: toSvgUri(notificationSvgSource),
    }))

  })
}

function showNotification (state) {
  // guard for chrome bug https://github.com/MetaMask/metamask-plugin/issues/236
  if (!chrome.notifications) return console.error('Chrome notifications API missing...')

  var id = createId()
  chrome.notifications.create(id, {
    type: 'image',
    requireInteraction: true,
    iconUrl: '/images/icon-128.png',
    imageUrl: state.imageUrl,
    title: state.title,
    message: '',
    buttons: [{
      title: 'confirm',
    }, {
      title: 'cancel',
    }],
  })
  notificationHandlers[id] = {
    confirm: state.onConfirm,
    cancel: state.onCancel,
  }

}

function renderTxNotificationSVG(state, cb){
  var content = h(PendingTxDetails, state)
  renderNotificationSVG(content, cb)
}

function renderMsgNotificationSVG(state, cb){
  var content = h(PendingMsgDetails, state)
  renderNotificationSVG(content, cb)
}

function renderNotificationSVG(content, cb){
  var container = document.createElement('div')
  var confirmView = h('div.app-primary', {
    style: {
      width: '360px',
      height: '240px',
      padding: '16px',
      // background: '#F7F7F7',
      background: 'white',
    },
  }, [
    h('style', MetaMaskUiCss()),
    content,
  ])

  render(confirmView, container, function ready(){
    var rootElement = findDOMNode(this)
    var viewSource = rootElement.outerHTML
    unmountComponentAtNode(container)
    var svgSource = svgWrapper(viewSource)
    // insert content into svg wrapper
    cb(null, svgSource)
  })
}

function svgWrapper(content){
  var wrapperSource = `    
  <svg xmlns="http://www.w3.org/2000/svg" width="360" height="240">
     <foreignObject x="0" y="0" width="100%" height="100%">
        <body xmlns="http://www.w3.org/1999/xhtml" height="100%">{{content}}</body>
     </foreignObject>
  </svg>
  `
  return wrapperSource.split('{{content}}').join(content)
}

function toSvgUri(content){
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(content)
}