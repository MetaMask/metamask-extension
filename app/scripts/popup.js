const injectCss = require('inject-css')
const MetaMaskUiCss = require('../../ui/css')
const startPopup = require('./popup-core')
const PortStream = require('./lib/port-stream.js')
const isPopupOrNotification = require('./lib/is-popup-or-notification')
const extension = require('extensionizer')
const NotificationManager = require('./lib/notification-manager')
const notificationManager = new NotificationManager()

// inject css
const css = MetaMaskUiCss()
injectCss(css)

// identify window type (popup, notification)
const windowType = isPopupOrNotification()
global.METAMASK_UI_TYPE = windowType
closePopupIfOpen(windowType)

// setup stream to background
const extensionPort = extension.runtime.connect({ name: windowType })
const connectionStream = new PortStream(extensionPort)

// start ui
const container = document.getElementById('app-content')
startPopup({ container, connectionStream }, (err, store) => {
  if (err) return displayCriticalError(err)
  store.subscribe(() => {
    const state = store.getState()
    if (state.appState.shouldClose) notificationManager.closePopup()
  })
})


function closePopupIfOpen (windowType) {
  if (windowType !== 'notification') {
    notificationManager.closePopup()
  }
}

function displayCriticalError(err) {
  container.innerHTML = '<div class="critical-error">The MetaMask app failed to load: please open and close MetaMask again to restart.</div>'
  container.style.height = '80px'
  log.error(err.stack)
  throw err
}
