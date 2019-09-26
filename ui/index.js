const render = require('react-dom').render
const h = require('react-hyperscript')
const Root = require('./app/pages')
const actions = require('./app/store/actions')
const configureStore = require('./app/store/store')
const txHelper = require('./lib/tx-helper')
const { fetchLocale } = require('./app/helpers/utils/i18n-helper')
import switchDirection from './app/helpers/utils/switch-direction'
const log = require('loglevel')

module.exports = launchMetamaskUi

log.setLevel(global.METAMASK_DEBUG ? 'debug' : 'warn')

function launchMetamaskUi (opts, cb) {
  var {backgroundConnection} = opts
  actions._setBackgroundConnection(backgroundConnection)
  // check if we are unlocked first
  backgroundConnection.getState(function (err, metamaskState) {
    if (err) return cb(err)
    startApp(metamaskState, backgroundConnection, opts)
      .then((store) => {
        cb(null, store)
      })
  })
}

async function startApp (metamaskState, backgroundConnection, opts) {
  // parse opts
  if (!metamaskState.featureFlags) metamaskState.featureFlags = {}

  const currentLocaleMessages = metamaskState.currentLocale
    ? await fetchLocale(metamaskState.currentLocale)
    : {}
  const enLocaleMessages = await fetchLocale('en')

  if (metamaskState.textDirection === 'rtl') {
    await switchDirection('rtl')
  }

  const store = configureStore({
    activeTab: opts.activeTab,

    // metamaskState represents the cross-tab state
    metamask: metamaskState,

    // appState represents the current tab's popup state
    appState: {},

    localeMessages: {
      current: currentLocaleMessages,
      en: enLocaleMessages,
    },

    // Which blockchain we are using:
    networkVersion: opts.networkVersion,
  })

  // if unconfirmed txs, start on txConf page
  const unapprovedTxsAll = txHelper(metamaskState.unapprovedTxs, metamaskState.unapprovedMsgs, metamaskState.unapprovedPersonalMsgs, metamaskState.unapprovedTypedMessages, metamaskState.network)
  const numberOfUnapprivedTx = unapprovedTxsAll.length
  if (numberOfUnapprivedTx > 0) {
    store.dispatch(actions.showConfTxPage({
      id: unapprovedTxsAll[numberOfUnapprivedTx - 1].id,
    }))
  }

  backgroundConnection.on('update', function (metamaskState) {
    const currentState = store.getState()
    const { currentLocale } = currentState.metamask
    const { currentLocale: newLocale } = metamaskState

    if (currentLocale && newLocale && currentLocale !== newLocale) {
      store.dispatch(actions.updateCurrentLocale(newLocale))
    }

    store.dispatch(actions.updateMetamaskState(metamaskState))
  })

  // global metamask api - used by tooling
  global.metamask = {
    updateCurrentLocale: (code) => {
      store.dispatch(actions.updateCurrentLocale(code))
    },
    setProviderType: (type) => {
      store.dispatch(actions.setProviderType(type))
    },
    setFeatureFlag: (key, value) => {
      store.dispatch(actions.setFeatureFlag(key, value))
    },
  }

  // start app
  render(
    h(Root, {
      // inject initial state
      store: store,
    }
    ), opts.container)

  return store
}
