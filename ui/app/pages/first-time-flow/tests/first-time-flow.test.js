import React from 'react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'
import sinon from 'sinon'
import assert from 'assert'

import { mountWithRouter } from '../../../../../test/lib/render-helpers'
import FirstTimeFlow from '../index'

describe('First Time Flow', function () {

  const mockStore = {
    metamask: {},
  }

  const store = configureStore()(mockStore)

  const props = {
    history: {
      push: sinon.spy(),
    },
  }

  it('initially renders', function () {

    const wrapper = mountWithRouter(
      <Provider store={store}>
        <FirstTimeFlow.WrappedComponent {...props} />
      </Provider>
    )

    assert.equal(wrapper.find('Welcome').prop('location').pathname, '/initialize/welcome')
  })

  it('clicks Get Started button and routes to new component', function () {

    const wrapper = mountWithRouter(
      <Provider store={store}>
        <FirstTimeFlow.WrappedComponent {...props} />
      </Provider>
    )

    const getStartedButton = wrapper.find('.btn-primary.first-time-flow__button')

    getStartedButton.simulate('click')
    assert.equal(wrapper.find('SelectAction').prop('location').pathname, '/initialize/select-action')
  })

})
