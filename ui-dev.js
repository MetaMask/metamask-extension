const render = require('react-dom').render
const h = require('react-hyperscript')
const Root = require('./ui/app/root')
const configureStore = require('./development/mockStore')
const states = require('./development/states')
const Selector = require('./development/selector')

// Query String
const qs = require('qs')
let queryString = qs.parse(window.location.href.split('#')[1])
let selectedView = queryString.view || 'account detail'
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

const actions = {
  _setAccountManager(){},
  update: function(stateName) {
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

const container = document.querySelector('#app-content')

// parse opts
var store = configureStore(states[selectedView])

// start app
render(
  h('.super-dev-container', [

    h(Selector, { actions, selectedKey: selectedView, states, store }),

    h('.mock-app-root', {
      style: {
        height: '500px',
        width: '360px',
        boxShadow: '2px 2px 5px grey',
        margin: '20px',
      },
    }, [
      h(Root, {
       store: store,
      }),
    ]),

  ]
), container)

