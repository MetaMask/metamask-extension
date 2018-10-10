/* UI DEV
 *
 * This is a utility module.
 * It initializes a minimalist browserifiable project
 * that contains the Metamask UI, with a mocked state.
 *
 * Includes a state menu for switching between different
 * mocked states, along with query param support,
 * so those states are preserved when live-reloading.
 *
 * This is a convenient way to develop on the UI
 * without having to re-enter your password
 * every time the plugin rebuilds.
 *
 * To use, run `npm run ui`.
 */

const render = require('react-dom').render
const h = require('react-hyperscript')
const Root = require('../ui/app/root')
const configureStore = require('./uiStore')
const states = require('./states')
const Selector = require('./selector')

// logger
const log = require('loglevel')
window.log = log
log.setDefaultLevel(1)

// Query String
const qs = require('qs')
const queryString = qs.parse(window.location.href.split('#')[1])
let selectedView = queryString.view || 'first time'
updateQueryParams(selectedView)

// CSS
const MetaMaskUiCss = require('../ui/css')
const injectCss = require('inject-css')


function updateQueryParams (newView) {
  queryString.view = newView
  const params = qs.stringify(queryString)
  window.location.href = window.location.href.split('#')[0] + `#${params}`
}

const actions = {
  _setBackgroundConnection () {},
  update: function (stateName) {
    selectedView = stateName
    updateQueryParams(stateName)
    const newState = states[selectedView]
    return {
      type: 'GLOBAL_FORCE_UPDATE',
      value: newState,
    }
  },
}

var css = MetaMaskUiCss()
injectCss(css)

// parse opts
var store = configureStore(states[selectedView])

// start app
startApp()

function startApp () {
  const body = document.body
  const container = document.createElement('div')
  container.id = 'test-container'
  body.appendChild(container)

  render(
    h('.super-dev-container', [

      h(Selector, { actions, selectedKey: selectedView, states, store }),

      h('#app-content', {
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
}

