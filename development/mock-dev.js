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

<<<<<<< HEAD
const render = require('react-dom').render
const h = require('react-hyperscript')
const Root = require('../ui/app/pages')
const configureStore = require('../ui/app/store/store')
const actions = require('../ui/app/store/actions')
const backGroundConnectionModifiers = require('./backGroundConnectionModifiers')
const Selector = require('./selector')
const MetamaskController = require('../app/scripts/metamask-controller')
const firstTimeState = require('../app/scripts/first-time-state')
const ExtensionPlatform = require('../app/scripts/platforms/extension')
=======
import log from 'loglevel'
import React from 'react'
import { render } from 'react-dom'
import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import * as qs from 'qs'
import Selector from './selector'
import * as actions from '../ui/app/store/actions'
import Root from '../ui/app/pages'
import rootReducer from '../ui/app/ducks'
import MetamaskController from '../app/scripts/metamask-controller'
import firstTimeState from '../app/scripts/first-time-state'
import ExtensionPlatform from '../app/scripts/platforms/extension'

const backGroundConnectionModifiers = require('./backGroundConnectionModifiers')

>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
const noop = function () {}

// the states file is generated before this file is run, but after `lint` is run
const states = require('./states') /* eslint-disable-line import/no-unresolved */

window.log = log
log.setLevel('debug')

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
function updateState (stateName) {
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
<<<<<<< HEAD
var store = configureStore(firstState)
=======
const store = createStore(
  (state, action) =>
    (action.type === 'GLOBAL_FORCE_UPDATE'
      ? action.value
      : rootReducer(state, action)),
  firstState,
  applyMiddleware(thunkMiddleware),
)
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

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
<<<<<<< HEAD
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
=======
          store.dispatch(updateState('terms'))
        }}
        style={{
          margin: '19px 19px 0px 19px',
        }}
      >
        Reset State
      </button>
      <Selector
        states={states}
        selectedKey={selectedView}
        updateState={updateState}
        store={store}
        modifyBackgroundConnection={modifyBackgroundConnection}
        backGroundConnectionModifiers={backGroundConnectionModifiers}
      />
      <div
        id="app-content"
        style={{
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
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
