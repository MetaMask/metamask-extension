import { shallow, mount } from 'enzyme'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { shape } from 'prop-types'

export function shallowWithStore (component, store) {
  const context = {
    store,
  }
  return shallow(component, { context })
}

export function mountWithStore (component, store) {
  const context = {
    store,
  }
  return mount(component, { context })
}

export function mountWithRouter (node) {

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

  const Wrapper = () => (
    <BrowserRouter>
      {node}
    </BrowserRouter>
  )

  return mount(<Wrapper />, createContext())
}
