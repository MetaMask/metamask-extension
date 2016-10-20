/* MOCK DEV
 *
 * This is a utility module.
 * It initializes a minimalist browserifiable project
 * that contains the Metamask UI, with a local background process.
 *
 * Includes a state reset button for restoring to initial state.
 *
 * This is a convenient way to develop and test the plugin
 * without having to re-open the plugin or even re-build it.
 *
 * To use, run `npm run mock`.
 */

const extend = require('xtend')
const render = require('react-dom').render
const h = require('react-hyperscript')
const Root = require('./ui/app/root')
const configureStore = require('./ui/app/store')
const actions = require('./ui/app/actions')
const states = require('./development/states')
const Selector = require('./development/selector')
const MetamaskController = require('./app/scripts/metamask-controller')
const extension = require('./development/mockExtension')

// Query String
const qs = require('qs')
let queryString = qs.parse(window.location.href.split('#')[1])
let selectedView = queryString.view || 'terms'
const firstState = states[selectedView]
updateQueryParams(selectedView)

// CSS
const MetaMaskUiCss = require('./ui/css')
const injectCss = require('inject-css')


function updateQueryParams(newView) {
  queryString.view = newView
  const params = qs.stringify(queryString)
  window.location.href = window.location.href.split('#')[0] + `#${params}`
}

const noop = function () {}
const controller = new MetamaskController({
  // User confirmation callbacks:
  showUnconfirmedMessage: noop,
  unlockAccountMessage: noop,
  showUnconfirmedTx: noop,
  // Persistence Methods:
  setData,
  loadData,
})

// Stub out localStorage for non-browser environments
if (!window.localStorage) {
  window.localStorage = {}
}
const STORAGE_KEY = 'metamask-config'
function loadData () {
  var oldData = getOldStyleData()
  var newData
  try {
    newData = JSON.parse(window.localStorage[STORAGE_KEY])
  } catch (e) {}

  var data = extend({
    meta: {
      version: 0,
    },
    data: {
      config: {
        provider: {
          type: 'testnet',
        },
      },
    },
  }, oldData || null, newData || null)
  return data
}

function setData (data) {
  window.localStorage[STORAGE_KEY] = JSON.stringify(data)
}

function getOldStyleData () {
  var config, wallet, seedWords

  var result = {
    meta: { version: 0 },
    data: {},
  }

  try {
    config = JSON.parse(window.localStorage['config'])
    result.data.config = config
  } catch (e) {}
  try {
    wallet = JSON.parse(window.localStorage['lightwallet'])
    result.data.wallet = wallet
  } catch (e) {}
  try {
    seedWords = window.localStorage['seedWords']
    result.data.seedWords = seedWords
  } catch (e) {}

  return result
}

actions._setBackgroundConnection(controller.getApi())
actions.update = function(stateName) {
  selectedView = stateName
  updateQueryParams(stateName)
  const newState = states[selectedView]
  return {
    type: 'GLOBAL_FORCE_UPDATE',
    value: newState,
  }
}

var css = MetaMaskUiCss()
injectCss(css)

const container = document.querySelector('#app-content')

// parse opts
var store = configureStore(firstState)

// start app
render(
  h('.super-dev-container', [

    h('button', {
      onClick: (ev) => {
        ev.preventDefault()
        store.dispatch(actions.update('terms'))
      },
      style: {
        margin: '19px 19px 0px 19px',
      },
    }, 'Reset State'),

    h(Selector, { actions, selectedKey: selectedView, states, store }),

    h('.mock-app-root', {
      style: {
        height: '500px',
        width: '360px',
        boxShadow: 'grey 0px 2px 9px',
        margin: '20px',
      },
    }, [
      h(Root, {
       store: store,
      }),
    ]),

  ]
), container)

