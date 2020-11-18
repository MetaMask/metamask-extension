import assert from 'assert'
import React from 'react'
import sinon from 'sinon'
import configureMockStore from 'redux-mock-store'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import Welcome from '..'

describe('Welcome', function () {
  const mockStore = {
    metamask: {},
  }

  const store = configureMockStore()(mockStore)

  after(function () {
    sinon.restore()
  })

  it('routes to select action when participateInMetaMetrics is not initialized', function () {
    const props = {
      history: {
        push: sinon.spy(),
      },
    }

    const wrapper = mountWithRouter(
      <Welcome.WrappedComponent {...props} />,
      store,
    )

    const getStartedButton = wrapper.find(
      '.btn-primary.first-time-flow__button',
    )
    getStartedButton.simulate('click')
    assert.equal(
      props.history.push.getCall(0).args[0],
      '/initialize/select-action',
    )
  })

  it('routes to correct password when participateInMetaMetrics is initialized', function () {
    const props = {
      welcomeScreenSeen: true,
      participateInMetaMetrics: false,
      history: {
        push: sinon.spy(),
      },
    }

    const wrapper = mountWithRouter(
      <Welcome.WrappedComponent {...props} />,
      store,
    )

    const getStartedButton = wrapper.find(
      '.btn-primary.first-time-flow__button',
    )
    getStartedButton.simulate('click')
    assert.equal(
      props.history.push.getCall(0).args[0],
      '/initialize/create-password',
    )
  })
})
