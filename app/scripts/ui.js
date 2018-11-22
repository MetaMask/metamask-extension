const injectCss = require('inject-css')
const OldMetaMaskUiCss = require('../../old-ui/css')
const NewMetaMaskUiCss = require('../../ui/css')
const {getShouldUseNewUi} = require('../../ui/app/selectors')
const startPopup = require('./popup-core')
const PortStream = require('extension-port-stream')
const { getEnvironmentType } = require('./lib/util')
const { ENVIRONMENT_TYPE_NOTIFICATION } = require('./lib/enums')
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
  startPopup({ container, connectionStream }, (err, store) => {
    if (err) return displayCriticalError(err)

    const state = store.getState()
    let betaUIState = Boolean(state.featureFlags && state.featureFlags.betaUI)
    const useBetaCss = getShouldUseNewUi(state)

    let css = useBetaCss ? NewMetaMaskUiCss() : OldMetaMaskUiCss()
    let deleteInjectedCss = injectCss(css)
    let newBetaUIState

    store.subscribe(() => {
      const state = store.getState()
      newBetaUIState = state.metamask.featureFlags.betaUI
      if (newBetaUIState !== betaUIState) {
        deleteInjectedCss()
        betaUIState = newBetaUIState
        css = betaUIState ? NewMetaMaskUiCss() : OldMetaMaskUiCss()
        deleteInjectedCss = injectCss(css)
      }
    })
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
