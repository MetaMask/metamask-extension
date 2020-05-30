import copyToClipboard from 'copy-to-clipboard'
import log from 'loglevel'
import { clone } from 'lodash'
import React from 'react'
import { render } from 'react-dom'
import Root from './app/pages'
import * as actions from './app/store/actions'
import configureStore from './app/store/store'
import txHelper from './lib/tx-helper'
import { getEnvironmentType } from '../app/scripts/lib/util'
import { ALERT_TYPES } from '../app/scripts/controllers/alert'
import { ENVIRONMENT_TYPE_POPUP } from '../app/scripts/lib/enums'
import { fetchLocale } from './app/helpers/utils/i18n-helper'
import switchDirection from './app/helpers/utils/switch-direction'
import { getPermittedAccountsForCurrentTab, getSelectedAddress } from './app/selectors'
import { ALERT_STATE } from './app/ducks/alerts/switch-to-connected'
import {
  getSwitchToConnectedAlertEnabledness,
  getSwitchToConnectedAlertShown,
} from './app/ducks/metamask/metamask'
import { ApolloLink } from 'apollo-link'
import ApolloClient from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import $$observable from 'symbol-observable'

let apolloClient

class DnodeApolloLink extends ApolloLink {
  constructor (background) {
    super()
    this.background = background
    this.operations = {}
    this.nextOperationId = 0
    this.background.on('graphql:message', this.handleMessage.bind(this))
  }

  unsubscribe (opId) {
    if (this.operations[opId]) {
      delete this.operations[opId]
    }
  }

  // Handles making sure we are dealing with an observer
  getObserver (
    observerOrNext,
    error,
    complete,
  ) {
    if (typeof observerOrNext === 'function') {
      return {
        next: (v) => observerOrNext(v),
        error: (e) => error && error(e),
        complete: () => complete && complete(),
      }
    }

    return observerOrNext
  }

  // Called by Apollo when a query is issued
  request (request) {
    // const getObserver = this.getObserver.bind(this)
    // const executeOperation = this.executeOperation.bind(this)
    const unsubscribe = this.unsubscribe.bind(this)
    const getObserver = this.getObserver.bind(this)
    const executeOperation = this.executeOperation.bind(this)

    let opId

    return {
      [$$observable] () {
        return this
      },
      subscribe (
        observerOrNext,
        onError,
        onComplete,
      ) {
        const observer = getObserver(observerOrNext, onError, onComplete)

        opId = executeOperation(request, (error, result) => {
          if (error === null && result === null) {
            if (observer.complete) {
              observer.complete()
            }
          } else if (error) {
            if (observer.error) {
              observer.error(error[0])
            }
          } else {
            if (observer.next) {
              observer.next(result)
            }
          }
        })

        return {
          unsubscribe: () => {
            if (opId) {
              unsubscribe(opId)
              opId = null
            }
          },
        }
      },
    }
  }

  generateOperationId () {
    return String(++this.nextOperationId)
  }

  executeOperation (request, handler) {

    const opId = this.generateOperationId()
    this.operations[opId] = { request, handler }

    this.background.sendGraphQLMsg({ opId, request })
  }

  handleMessage ({ opId, type, result }) {
    this.operations[opId].handler(null, result)
  }
}

log.setLevel(global.METAMASK_DEBUG ? 'debug' : 'warn')

export default function launchMetamaskUi (opts, cb) {
  apolloClient = new ApolloClient({
    link: new DnodeApolloLink(opts.backgroundConnection),
    cache: new InMemoryCache(),
  })
  const { backgroundConnection } = opts
  actions._setBackgroundConnection(backgroundConnection)
  // check if we are unlocked first
  backgroundConnection.getState(function (err, metamaskState) {
    if (err) {
      return cb(err)
    }
    startApp(metamaskState, backgroundConnection, opts)
      .then((store) => {
        setupDebuggingHelpers(store)
        cb(null, store)
      })
  })
}

async function startApp (metamaskState, backgroundConnection, opts) {
  // parse opts
  if (!metamaskState.featureFlags) {
    metamaskState.featureFlags = {}
  }

  const currentLocaleMessages = metamaskState.currentLocale
    ? await fetchLocale(metamaskState.currentLocale)
    : {}
  const enLocaleMessages = await fetchLocale('en')

  if (metamaskState.textDirection === 'rtl') {
    await switchDirection('rtl')
  }

  const draftInitialState = {
    activeTab: opts.activeTab,

    // metamaskState represents the cross-tab state
    metamask: metamaskState,

    // appState represents the current tab's popup state
    appState: {},

    localeMessages: {
      current: currentLocaleMessages,
      en: enLocaleMessages,
    },
  }

  if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
    const origin = draftInitialState.activeTab.origin
    const permittedAccountsForCurrentTab = getPermittedAccountsForCurrentTab(draftInitialState)
    const selectedAddress = getSelectedAddress(draftInitialState)
    const switchToConnectedAlertShown = getSwitchToConnectedAlertShown(draftInitialState)
    const switchToConnectedAlertIsEnabled = getSwitchToConnectedAlertEnabledness(draftInitialState)

    if (
      origin &&
      switchToConnectedAlertIsEnabled &&
      !switchToConnectedAlertShown[origin] &&
      permittedAccountsForCurrentTab.length > 0 &&
      !permittedAccountsForCurrentTab.includes(selectedAddress)
    ) {
      draftInitialState[ALERT_TYPES.switchToConnected] = { state: ALERT_STATE.OPEN }
      actions.setSwitchToConnectedAlertShown(origin)
    }
  }

  const store = configureStore(draftInitialState)

  // if unconfirmed txs, start on txConf page
  const unapprovedTxsAll = txHelper(
    metamaskState.unapprovedTxs,
    metamaskState.unapprovedMsgs,
    metamaskState.unapprovedPersonalMsgs,
    metamaskState.unapprovedDecryptMsgs,
    metamaskState.unapprovedEncryptionPublicKeyMsgs,
    metamaskState.unapprovedTypedMessages,
    metamaskState.network
  )
  const numberOfUnapprivedTx = unapprovedTxsAll.length
  if (numberOfUnapprivedTx > 0) {
    store.dispatch(actions.showConfTxPage({
      id: unapprovedTxsAll[0].id,
    }))
  }

  backgroundConnection.on('update', function (metamaskState) {
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
    <Root
      store={store}
      apolloClient={apolloClient}
    />,
    opts.container,
  )

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
