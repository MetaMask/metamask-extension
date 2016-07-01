const render = require('react-dom').render
const h = require('react-hyperscript')
const Root = require('../ui/app/root')
const configureStore = require('./mockStore')
const qs = require('qs')
const queryString = qs.parse(window.location.href)
let selectedView = queryString.view || 'account detail'

const MetaMaskUiCss = require('../ui/css')
const injectCss = require('inject-css')

const states = require('./states')

const firstState = states[selectedView]
updateQueryParams()

function updateQueryParams() {
  const newParamsObj = {
    view: selectedView,
  }
  const newQs = qs.stringify(newParamsObj)
  //window.location.href = window.location.href.split('?')[0] + `?${newQs}`

}

const actions = {
  _setAccountManager(){},
  update: function(stateName) {
    selectedView = stateName
    updateQueryParams()
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

    h('select', {
      value: 'account-detail',
      onChange:(event) => {
        const selectedKey = event.target.value
        store.dispatch(actions.update(selectedKey))
      },
    }, Object.keys(states).map((stateName) => {
      return h('option', { value: stateName }, stateName)
    })),

    h(Root, {
      store: store,
    }),

  ]
), container)

