import React from 'react'
import sinon from 'sinon'
import { mount } from 'enzyme'
import { MemoryRouter } from 'react-router-dom'
import PropTypes from 'prop-types'

export function mountWithStore (component, store) {
  const context = {
    store,
  }
  return mount(component, { context })
}

export function mountWithRouter (component, store = {}, pathname = '/') {

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
      t: str => str,
      tOrKey: str => str,
      metricsEvent: () => {},
      store,
    },
    childContextTypes: {
      router: PropTypes.object,
      t: PropTypes.func,
      tOrKey: PropTypes.func,
      metricsEvent: PropTypes.func,
      store: PropTypes.object,
    },
  })

  const Wrapper = () => (
    <MemoryRouter initialEntries={[{ pathname }]} initialIndex={0}>
      {component}
    </MemoryRouter>
  )

  return mount(<Wrapper />, createContext())
}

export function stubComponent (componentClass) {

  const lifecycleMethods = [
    'render',
    'componentWillMount',
    'componentDidMount',
    'componentWillReceiveProps',
    'shouldComponentUpdate',
    'componentWillUpdate',
    'componentDidUpdate',
    'componentWillUnmount',
  ]

  lifecycleMethods.forEach((method) => {
    if (typeof componentClass.prototype[method] !== 'undefined') {
      sinon.stub(componentClass.prototype, method).returns(null)
    }
  })

}
