<<<<<<< HEAD
const render = require('react-dom').render
const h = require('react-hyperscript')
const Root = require('./app/pages')
const actions = require('./app/store/actions')
const configureStore = require('./app/store/store')
const txHelper = require('./lib/tx-helper')
const { fetchLocale } = require('./app/helpers/utils/i18n-helper')
=======
import copyToClipboard from 'copy-to-clipboard'
import log from 'loglevel'
import { clone } from 'lodash'
import React from 'react'
import { render } from 'react-dom'
import Root from './app/pages'
import * as actions from './app/store/actions'
import configureStore from './app/store/store'
import txHelper from './lib/tx-helper'
import { fetchLocale } from './app/helpers/utils/i18n-helper'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
import switchDirection from './app/helpers/utils/switch-direction'

log.setLevel(global.METAMASK_DEBUG ? 'debug' : 'warn')

<<<<<<< HEAD
function launchMetamaskUi (opts, cb) {
  var {backgroundConnection} = opts
=======
export default function launchMetamaskUi (opts, cb) {
  const { backgroundConnection } = opts
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
  actions._setBackgroundConnection(backgroundConnection)
  // check if we are unlocked first
  backgroundConnection.getState(function (err, metamaskState) {
    if (err) return cb(err)
    startApp(metamaskState, backgroundConnection, opts)
      .then((store) => {
        setupDebuggingHelpers(store)
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
  })

  // if unconfirmed txs, start on txConf page
  const unapprovedTxsAll = txHelper(metamaskState.unapprovedTxs, metamaskState.unapprovedMsgs, metamaskState.unapprovedPersonalMsgs, metamaskState.unapprovedDecryptMsgs, metamaskState.unapprovedEncryptionPublicKeyMsgs, metamaskState.unapprovedTypedMessages, metamaskState.network)
  const numberOfUnapprivedTx = unapprovedTxsAll.length
  if (numberOfUnapprivedTx > 0) {
    store.dispatch(actions.showConfTxPage({
      id: unapprovedTxsAll[0].id,
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

function setupDebuggingHelpers (store) {
  window.getCleanAppState = function () {
    const state = clone(store.getState())
    state.version = global.platform.getVersion()
    state.browser = window.navigator.userAgent
    return state
  }
}

window.logStateString = function (cb) {
  const state = window.getCleanAppState()
  global.platform.getPlatformInfo((err, platform) => {
    if (err) {
      return cb(err)
    }
    state.platform = platform
    const stateString = JSON.stringify(state, null, 2)
    cb(null, stateString)
  })
}

window.logState = function (toClipboard) {
  return window.logStateString((err, result) => {
    if (err) {
      console.error(err.message)
    } else if (toClipboard) {
      copyToClipboard(result)
      console.log('State log copied')
    } else {
      console.log(result)
    }
  })
}
