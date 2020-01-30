const { shallow, mount } = require('enzyme')
import { BrowserRouter } from 'react-router-dom'
import { shape } from 'prop-types'

module.exports = {
  shallowWithStore,
  mountWithStore,
  mountWithRouter,
}

function shallowWithStore (component, store) {
  const context = {
    store,
  }
  return shallow(component, {context})
}

function mountWithStore (component, store) {
  const context = {
    store,
  }
  return mount(component, {context})
}

function mountWithRouter (node) {

  // Instantiate router context
  const router = {
    history: new BrowserRouter().history,
    route: {
      location: {},
      match: {},
    },
  }

  const createContext = () => ({
    context: { router, t: () => {} },
    childContextTypes: { router: shape({}), t: () => {} },
  })

  return mount(node, createContext())
}
