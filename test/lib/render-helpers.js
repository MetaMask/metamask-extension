import React from 'react'
import { mount } from 'enzyme'
import { MemoryRouter } from 'react-router-dom'
import PropTypes from 'prop-types'

export function mountWithStore (component, store) {
  const context = {
    store,
  }
  return mount(component, { context })
}

export function mountWithRouter (component, pathname = '/') {

  // Instantiate router context
  const router = {
    history: new MemoryRouter().history,
    route: {
      location: {
        pathname: pathname,
      },
      match: {},
    },
  }

  const createContext = () => ({
    context: {
      router,
      t: (str) => str,
      metricsEvent: () => {},
    },
    childContextTypes: {
      router: PropTypes.object,
      t: PropTypes.func,
      metricsEvent: PropTypes.func,
    },
  })

  const Wrapper = () => (
    <MemoryRouter initialEntries={[{ pathname }]} initialIndex={0}>
      {component}
    </MemoryRouter>
  )

  return mount(<Wrapper />, createContext())
}
