const Root = require('../../ui/app/pages')
const startPopup = require('./popup-core')
const PortStream = require('extension-port-stream')
const { getEnvironmentType } = require('./lib/util')
const { ENVIRONMENT_TYPE_NOTIFICATION, ENVIRONMENT_TYPE_FULLSCREEN } = require('./lib/enums')
const extension = require('extensionizer')
const ExtensionPlatform = require('./platforms/extension')
const NotificationManager = require('./lib/notification-manager')
const notificationManager = new NotificationManager()
const setupSentry = require('./lib/setupSentry')
const log = require('loglevel')

start().catch(log.error)

async function start () {

  // create platform global
  global.platform = new ExtensionPlatform()

  // setup sentry error reporting
  const release = global.platform.getVersion()
  setupSentry({ release, getState })
  // provide app state to append to error logs
  function getState () {
    // get app state
    const state = window.getCleanAppState()
    // remove unnecessary data
    delete state.localeMessages
    delete state.metamask.recentBlocks
    // return state to be added to request
    return state
  }

  // identify window type (popup, notification)
  const windowType = getEnvironmentType(window.location.href)
  global.METAMASK_UI_TYPE = windowType
  closePopupIfOpen(windowType)

  // setup stream to background
  const extensionPort = extension.runtime.connect({ name: windowType })
  const connectionStream = new PortStream(extensionPort)

  // start ui
  const container = document.getElementById('app-content')
  startPopup({ container, connectionStream, Root }, (err, store) => {
    if (err) return displayCriticalError(err)

    const state = store.getState()
    const { metamask: { completedOnboarding } = {} } = state

    if (!completedOnboarding && windowType !== ENVIRONMENT_TYPE_FULLSCREEN) {
      global.platform.openExtensionInBrowser()
      return
    }
  })


  function closePopupIfOpen (windowType) {
    if (windowType !== ENVIRONMENT_TYPE_NOTIFICATION) {
      // should close only chrome popup
      notificationManager.closePopup()
    }
  }

  function displayCriticalError (err) {
    container.innerHTML = '<div class="critical-error">The MetaMask app failed to load: please open and close MetaMask again to restart.</div>'
    container.style.height = '80px'
    log.error(err.stack)
    throw err
  }

}
