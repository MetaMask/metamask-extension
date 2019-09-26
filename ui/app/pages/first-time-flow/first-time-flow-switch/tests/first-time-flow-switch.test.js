import React from 'react'
import assert from 'assert'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import {
  DEFAULT_ROUTE,
  LOCK_ROUTE,
  INITIALIZE_WELCOME_ROUTE,
  INITIALIZE_UNLOCK_ROUTE,
} from '../../../../helpers/constants/routes'
import FirstTimeFlowSwitch from '../index'

describe('FirstTimeFlowSwitch', () => {

  it('redirects to /welcome route with no props', () => {
    const wrapper = mountWithRouter(
      <FirstTimeFlowSwitch.WrappedComponent />
    )

    assert.equal(wrapper.find({ to: { pathname: INITIALIZE_WELCOME_ROUTE } }).length, 1)
  })

  it('redirects to / route when completedOnboarding is true', () => {
    const props = {
      completedOnboarding: true,
    }
    const wrapper = mountWithRouter(
      <FirstTimeFlowSwitch.WrappedComponent {...props} />
    )

    assert.equal(wrapper.find({ to: { pathname: DEFAULT_ROUTE } }).length, 1)
  })

  it('redirects to /lock route when isUnlocked is true ', () => {
    const props = {
      completedOnboarding: false,
      isUnlocked: true,
    }

    const wrapper = mountWithRouter(
      <FirstTimeFlowSwitch.WrappedComponent {...props} />
    )

    assert.equal(wrapper.find({ to: { pathname: LOCK_ROUTE } }).length, 1)
  })

  it('redirects to /welcome route when isInitialized is false', () => {
    const props = {
      completedOnboarding: false,
      isUnlocked: false,
      isInitialized: false,
    }

    const wrapper = mountWithRouter(
      <FirstTimeFlowSwitch.WrappedComponent {...props} />
    )

    assert.equal(wrapper.find({ to: { pathname: INITIALIZE_WELCOME_ROUTE }}).length, 1)
  })

  it('redirects to /unlock route when isInitialized is true', () => {
    const props = {
      completedOnboarding: false,
      isUnlocked: false,
      isInitialized: true,
    }

    const wrapper = mountWithRouter(
      <FirstTimeFlowSwitch.WrappedComponent {...props} />
    )

    assert.equal(wrapper.find({ to: { pathname: INITIALIZE_UNLOCK_ROUTE } }).length, 1)
  })

})
