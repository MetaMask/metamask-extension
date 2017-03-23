const render = require('react-dom').render
const h = require('react-hyperscript')
const Root = require('./app/root')
const actions = require('./app/actions')
const configureStore = require('./app/store')
const txHelper = require('./lib/tx-helper')
module.exports = launchApp

let debugMode = window.METAMASK_DEBUG
const log = require('loglevel')
window.log = log
log.setLevel(debugMode ? 'debug' : 'warn')

function launchApp (opts) {
  var accountManager = opts.accountManager
  actions._setBackgroundConnection(accountManager)
  // check if we are unlocked first
  accountManager.getState(function (err, metamaskState) {
    if (err) throw err
    startApp(metamaskState, accountManager, opts)
  })
}

function startApp (metamaskState, accountManager, opts) {
  // parse opts
  var store = configureStore({

    // metamaskState represents the cross-tab state
    metamask: metamaskState,

    // appState represents the current tab's popup state
    appState: {},

    // Which blockchain we are using:
    networkVersion: opts.networkVersion,
  })

  // if unconfirmed txs, start on txConf page
  var unapprovedTxsAll = txHelper(metamaskState.unapprovedTxs, metamaskState.unapprovedMsgs, metamaskState.unapprovedPersonalMsgs, metamaskState.network)
  if (unapprovedTxsAll.length > 0) {
    store.dispatch(actions.showConfTxPage())
  }

  accountManager.on('update', function (metamaskState) {
    store.dispatch(actions.updateMetamaskState(metamaskState))
  })

  // start app
  render(
    h(Root, {
      // inject initial state
      store: store,
    }
  ), opts.container)
}
