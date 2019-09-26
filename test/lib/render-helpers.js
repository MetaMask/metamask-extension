import React from 'react'
import sinon from 'sinon'
import { shallow, mount } from 'enzyme'
import { MemoryRouter } from 'react-router-dom'

module.exports = {
  shallowWithStore,
  mountWithStore,
  mountWithRouter,
  stubComponent,
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

function mountWithRouter (component, store, pathname) {

  // Instantiate router context
  const router = {
    history: new MemoryRouter().history,
    route: {
      location: {
        pathname: pathname || '/',
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
      router: React.PropTypes.object,
      t: React.PropTypes.func,
      tOrKey: React.PropTypes.func,
      metricsEvent: React.PropTypes.func,
      store: React.PropTypes.object,
    },
  })

  return mount(component, createContext())
}

function stubComponent (componentClass) {

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
