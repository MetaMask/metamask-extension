const createId = require('hat')
const unmountComponentAtNode = require('react-dom').unmountComponentAtNode
const findDOMNode = require('react-dom').findDOMNode
const render = require('react-dom').render
const h = require('react-hyperscript')
const uiUtils = require('../../../ui/app/util')
const renderPendingTx = require('../../../ui/app/components/pending-tx').prototype.renderGeneric
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

  renderTransactionNotificationSVG(opts, function(err, source){
    
    var imageUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(source)

    var id = createId()
    chrome.notifications.create(id, {
      type: 'image',
      // requireInteraction: true,
      iconUrl: '/images/icon-128.png',
      imageUrl: imageUrl,
      title: opts.title,
      message: '',
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

  })
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

function renderTransactionNotificationSVG(opts, cb){
  var state = {
    nonInteractive: true,
    inlineIdenticons: true,
    txData: {
      txParams: opts.txParams,
      time: (new Date()).getTime(),
    },
    identities: {

    },
    accounts: {

    },
  }

  var container = document.createElement('div')
  var confirmView = h('div.app-primary', {
    style: {
      width: '450px',
      height: '300px',
      padding: '16px',
      // background: '#F7F7F7',
      background: 'white',
    },
  }, [
    h('style', MetaMaskUiCss()),
    renderPendingTx(h, state),
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
  <svg xmlns="http://www.w3.org/2000/svg" width="450" height="300">
     <foreignObject x="0" y="0" width="100%" height="100%">
        <body xmlns="http://www.w3.org/1999/xhtml" height="100%">{{content}}</body>
     </foreignObject>
  </svg>
  `
  return wrapperSource.split('{{content}}').join(content)
}