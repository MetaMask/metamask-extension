const createId = require('hat')
const svg = require('virtual-dom/virtual-hyperscript/svg')
const stringifyVdom = require('virtual-dom-stringify')
const uiUtils = require('../../../ui/app/util')
const renderPendingTx = require('../../../ui/app/components/pending-tx').prototype.renderGeneric
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

  transactionNotificationSVG(opts, function(err, source){
    
    var imageUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(source)

    var id = createId()
    chrome.notifications.create(id, {
      type: 'image',
      // requireInteraction: true,
      iconUrl: '/images/icon-128.png',
      imageUrl: imageUrl,
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

function transactionNotificationSVG(opts, cb){
  var state = {
    txData: {
      txParams: {
        from: '0xabcd',
      },
    },
    identities: {

    },
    accounts: {

    },
  }

  const unmountComponentAtNode = require('react-dom').unmountComponentAtNode
  const findDOMNode = require('react-dom').findDOMNode
  const render = require('react-dom').render
  const h = require('react-hyperscript')
  const MetaMaskUiCss = require('../../../ui/css')
  var css = MetaMaskUiCss()

  var container = document.createElement('div')
  var confirmView = h('div', [
    h('style', css),
    renderPendingTx(h, state),
  ])

  render(confirmView, container, function ready(){
    var rootElement = findDOMNode(this)
    var source = rootElement.outerHTML
    unmountComponentAtNode(container)
    var vnode = svgWrapper()
    var tagSource = stringifyVdom(vnode)
    // workaround for https://github.com/alexmingoia/virtual-dom-stringify/issues/26
    tagSource = tagSource.split('foreignobject').join('foreignObject')
    // insert content into svg wrapper
    tagSource = tagSource.split('{{content}}').join(source)
    cb(null, tagSource)
  })
}

function svgWrapper(){
  var h = svg
  return (
    
    h('svg', {
      'xmlns': 'http://www.w3.org/2000/svg',
      // 'width': '300',
      // 'height': '200',
      'width': '450',
      'height': '300',
    }, [
      h('rect', {
        'x': '0',
        'y': '0',
        'width': '100%',
        'height': '100%',
        'fill': 'white',
      }),
      h('foreignObject', {
        'x': '0',
        'y': '0',
        'width': '100%',
        'height': '100%',
      }, [
        h('body', {
          xmlns: 'http://www.w3.org/1999/xhtml',
        },'{{content}}')
      ])
    ])

  )
}