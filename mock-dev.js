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
const pipe = require('mississippi').pipe
const Root = require('./ui/app/root')
const configureStore = require('./ui/app/store')
const actions = require('./ui/app/actions')
const states = require('./development/states')
const Selector = require('./development/selector')
const MetamaskController = require('./app/scripts/metamask-controller')
const firstTimeState = require('./app/scripts/first-time-state')
const extension = require('./development/mockExtension')
const noop = function () {}

const log = require('loglevel')
window.log = log
log.setLevel('debug')

//
// Query String
//

const qs = require('qs')
let queryString = qs.parse(window.location.href.split('#')[1])
let selectedView = queryString.view || 'first time'
const firstState = states[selectedView]
updateQueryParams(selectedView)

function updateQueryParams(newView) {
  queryString.view = newView
  const params = qs.stringify(queryString)
  window.location.href = window.location.href.split('#')[0] + `#${params}`
}

//
// CSS
//

const MetaMaskUiCss = require('./ui/css')
const injectCss = require('inject-css')

//
// MetaMask Controller
//

const controller = new MetamaskController({
  // User confirmation callbacks:
  showUnconfirmedMessage: noop,
  unlockAccountMessage: noop,
  showUnapprovedTx: noop,
  // initial state
  initState: firstTimeState,
})
global.metamaskController = controller

//
// User Interface
//

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

