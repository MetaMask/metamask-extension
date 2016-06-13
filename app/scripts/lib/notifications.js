const createId = require('hat')
const uiUtils = require('../../../ui/app/util')
var notificationHandlers = {}

module.exports = {
  createUnlockRequestNotification: createUnlockRequestNotification,
  createTxNotification: createTxNotification,
  createMsgNotification: createMsgNotification,
}

setupListeners()

function setupListeners(){
  
  // guard for chrome bug https://github.com/MetaMask/metamask-plugin/issues/236
  if (!chrome.notifications) return console.error('Chrome notifications API missing...')

  // notification button press
  chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex){
    var handlers = notificationHandlers[notificationId]
    if (buttonIndex === 0) {
      handlers.confirm()
    } else {
      handlers.cancel()
    }
    chrome.notifications.clear(notificationId)
  })

  // notification teardown
  chrome.notifications.onClosed.addListener(function(notificationId){
    delete notificationHandlers[notificationId]
  })

}

// creation helper
function createUnlockRequestNotification(opts){
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

function createTxNotification(opts){
  if (!chrome.notifications) return console.error('Chrome notifications API missing...')

  var message = 'Ethereum Transaction Requested from:\n' + opts.txParams.origin
  var id = createId()
  chrome.notifications.create(id, {
    type: 'image',
    imageUrl: "data:image/svg+xml;utf8," + transactionNotificationSVG(opts),
    iconUrl: '/images/icon-128.png',
    title: opts.title,
    message: message,
    buttons: [{
      title: 'confirm',
    },{
      title: 'cancel',
    }]
  })
  notificationHandlers[id] = {
    confirm: opts.confirm,
    cancel: opts.cancel,
  }
}

function createMsgNotification(opts){
  // guard for chrome bug https://github.com/MetaMask/metamask-plugin/issues/236
  if (!chrome.notifications) return console.error('Chrome notifications API missing...')
  var message = [
    'Submitted by '+opts.msgParams.origin,
    'to be signed by: '+uiUtils.addressSummary(opts.msgParams.from),
    'message:\n'+opts.msgParams.data,
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
    },{
      title: 'cancel',
    }]
  })
  notificationHandlers[id] = {
    confirm: opts.confirm,
    cancel: opts.cancel,
  }
}

function transactionNotificationSVG(opts){
  var origin = opts.txParams.origin
  var toAddr = opts.txParams.to
  var fromAddr = opts.txParams.from
  var value = uiUtils.formatBalance(opts.txParams.value)
  var data = opts.txParams.data
  var color = uiUtils.colorBasedOnEthCost(opts.txParams.value)


  return `<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1440 960">
    <defs>
      <style>
        .cls-1 {
          fill: #ffffff;
        }

        .cls-2, .cls-7 {
          fill: none;
          stroke-miterlimit: 10;
        }

        .cls-2 {
          stroke: #ff9100;
          stroke-width: 2px;
        }

        .cls-3, .cls-6 {
          font-size: 72px;
        }

        .cls-11, .cls-12, .cls-3 {
          fill: #ff9100;
        }

        .cls-11, .cls-12, .cls-3, .cls-6 {
          font-family: Myriad Pro;
        }

        .cls-4 {
          letter-spacing: -2px;
        }

        .cls-5 {
          letter-spacing: -3px;
        }

        .cls-6 {
          fill: #686868;
        }

        .cls-7 {
          stroke: #7a7a7a;
        }

        .cls-8 {
          font-size: 48px;
        }

        .cls-15, .cls-8 {
          font-family: Menlo;
        }

        .cls-9 {
          fill: url(#linear-gradient);
        }

        .cls-10 {
          fill: url(#linear-gradient-2);
        }

        .cls-11 {
          font-size: 60px;
        }

        .cls-12 {
          font-size: 128px;
        }

        .cls-12, .cls-15 {
          font-weight: 700;
        }

        .cls-13 {
          letter-spacing: -4px;
        }

        .cls-14 {
          fill: #`+color+`;
        }

        .cls-15 {
          font-size: 80px;
        }
      </style>
      <linearGradient id="linear-gradient" x1="705" y1="504" x2="705" y2="342" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ff6e00"/>
        <stop offset="0.22" stop-color="#ff7129" stop-opacity="0.76"/>
        <stop offset="0.6" stop-color="#ff766f" stop-opacity="0.36"/>
        <stop offset="0.87" stop-color="#ff7a9b" stop-opacity="0.1"/>
        <stop offset="1" stop-color="#ff7bac" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="linear-gradient-2" x1="706" y1="504" x2="706" y2="342" xlink:href="#linear-gradient"/>
    </defs>
    <title>metamask_transaction_notification</title>
    <rect class="cls-1" width="1440" height="960"/>
    <rect class="cls-2" x="130" y="384" width="400.67" height="147.5" rx="5" ry="5"/>
    <text class="cls-3" transform="translate(304.53 106.67)">New Transaction Requested</text>
    <text class="cls-6" transform="translate(424.12 209.33)">`+origin+`</text>
    <line class="cls-7" x1="90.67" y1="266.67" x2="1344" y2="266.67"/>
    <line class="cls-7" x1="90.67" y1="649.33" x2="1344" y2="649.33"/>
    <text class="cls-8" transform="translate(113.13 346.67)">`+fromAddr+`</text>
    <g>
      <polygon class="cls-9" points="648 432 648 464 560 464 706.75 535.5 850 464 764 464 764 432 648 432"/>
      <polyline class="cls-10" points="764 424 764 400 648 400 648 424"/>
      <polyline class="cls-10" points="764 392 764 384 648 384 648 392"/>
    </g>
    <text class="cls-11" transform="translate(222.45 442)">Contract <tspan x="-24.3" y="72">Invocation</tspan></text>
    <text class="cls-12" transform="translate(355.22 830)"><tspan class="cls-13">Value :</tspan></text>
    <text class="cls-8" transform="translate(113.13 602.67)">`+toAddr+`</text>
    <rect class="cls-14" x="754" y="702" width="590" height="188" rx="5" ry="5"/>
    <text class="cls-15" transform="translate(832.26 824.8)">`+value+`</text>
  </svg>`
}
