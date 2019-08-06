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
 */

const render = require('react-dom').render
const h = require('react-hyperscript')
const Root = require('../ui/app/pages')
const configureStore = require('../ui/app/store/store')
const actions = require('../ui/app/store/actions')
const states = require('./states')
const backGroundConnectionModifiers = require('./backGroundConnectionModifiers')
const Selector = require('./selector')
const MetamaskController = require('../app/scripts/metamask-controller')
const firstTimeState = require('../app/scripts/first-time-state')
const ExtensionPlatform = require('../app/scripts/platforms/extension')
const noop = function () {}

const log = require('loglevel')
window.log = log
log.setLevel('debug')

//
// Query String
//

const qs = require('qs')
const routerPath = window.location.href.split('#')[1]
let queryString = {}
let selectedView

if (routerPath) {
  queryString = qs.parse(routerPath.split('?')[1])
}

selectedView = queryString.view || 'send new ui'
const firstState = states[selectedView]
updateQueryParams(selectedView)

function updateQueryParams (newView) {
  queryString.view = newView
  const params = qs.stringify(queryString)
  const locationPaths = window.location.href.split('#')
  const routerPath = locationPaths[1] || ''
  const newPath = locationPaths[0] + '#' + routerPath.split('?')[0] + `?${params}`

  if (window.location.href !== newPath) {
    window.location.href = newPath
  }
}

//
// MetaMask Controller
//

const controller = new MetamaskController({
  // User confirmation callbacks:
  showUnconfirmedMessage: noop,
  showUnapprovedTx: noop,
  platform: {},
  // initial state
  initState: firstTimeState,
})
global.metamaskController = controller
global.platform = new ExtensionPlatform()

//
// User Interface
//

actions._setBackgroundConnection(controller.getApi())
actions.update = function (stateName) {
  selectedView = stateName
  updateQueryParams(stateName)
  const newState = states[selectedView]
  return {
    type: 'GLOBAL_FORCE_UPDATE',
    value: newState,
  }
}

function modifyBackgroundConnection (backgroundConnectionModifier) {
  const modifiedBackgroundConnection = Object.assign({}, controller.getApi(), backgroundConnectionModifier)
  actions._setBackgroundConnection(modifiedBackgroundConnection)
}

// parse opts
var store = configureStore(firstState)

// start app
startApp()

function startApp () {
  const body = document.body
  const container = document.createElement('div')
  container.id = 'test-container'
  body.appendChild(container)

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

      h(Selector, {
        actions,
        selectedKey: selectedView,
        states,
        store,
        modifyBackgroundConnection,
        backGroundConnectionModifiers,
      }),

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
