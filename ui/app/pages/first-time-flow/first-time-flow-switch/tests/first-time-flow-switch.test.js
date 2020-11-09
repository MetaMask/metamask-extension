import assert from 'assert'
import React from 'react'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import {
  DEFAULT_ROUTE,
  LOCK_ROUTE,
  INITIALIZE_WELCOME_ROUTE,
  INITIALIZE_UNLOCK_ROUTE,
} from '../../../../helpers/constants/routes'
import FirstTimeFlowSwitch from '..'

describe('FirstTimeFlowSwitch', function () {
  it('redirects to /welcome route with no props', function () {
    const wrapper = mountWithRouter(<FirstTimeFlowSwitch.WrappedComponent />)
    assert.equal(
      wrapper
        .find('Lifecycle')
        .find({ to: { pathname: INITIALIZE_WELCOME_ROUTE } }).length,
      1,
    )
  })

  it('redirects to / route when completedOnboarding is true', function () {
    const props = {
      completedOnboarding: true,
    }
    const wrapper = mountWithRouter(
      <FirstTimeFlowSwitch.WrappedComponent {...props} />,
    )

    assert.equal(
      wrapper.find('Lifecycle').find({ to: { pathname: DEFAULT_ROUTE } })
        .length,
      1,
    )
  })

  it('redirects to /lock route when isUnlocked is true ', function () {
    const props = {
      completedOnboarding: false,
      isUnlocked: true,
    }

    const wrapper = mountWithRouter(
      <FirstTimeFlowSwitch.WrappedComponent {...props} />,
    )

    assert.equal(
      wrapper.find('Lifecycle').find({ to: { pathname: LOCK_ROUTE } }).length,
      1,
    )
  })

  it('redirects to /welcome route when isInitialized is false', function () {
    const props = {
      completedOnboarding: false,
      isUnlocked: false,
      isInitialized: false,
    }

    const wrapper = mountWithRouter(
      <FirstTimeFlowSwitch.WrappedComponent {...props} />,
    )

    assert.equal(
      wrapper
        .find('Lifecycle')
        .find({ to: { pathname: INITIALIZE_WELCOME_ROUTE } }).length,
      1,
    )
  })

  it('redirects to /unlock route when isInitialized is true', function () {
    const props = {
      completedOnboarding: false,
      isUnlocked: false,
      isInitialized: true,
    }

    const wrapper = mountWithRouter(
      <FirstTimeFlowSwitch.WrappedComponent {...props} />,
    )

    assert.equal(
      wrapper
        .find('Lifecycle')
        .find({ to: { pathname: INITIALIZE_UNLOCK_ROUTE } }).length,
      1,
    )
  })
})
