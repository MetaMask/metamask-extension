import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes'
import EndOfFlowScreen from '../index'

describe('End of Flow Screen', () => {
  let wrapper

  const props = {
    history: {
      push: sinon.spy(),
    },
    completeOnboarding: sinon.spy(),
  }

  beforeEach(() => {
    wrapper = mountWithRouter(
      <EndOfFlowScreen.WrappedComponent {...props} />
    )
  })

  it('renders', () => {
    assert.equal(wrapper.length, 1)
  })

  it('', (done) => {
    const endOfFlowButton = wrapper.find('.btn-primary.first-time-flow__button')
    endOfFlowButton.simulate('click')

    setImmediate(() => {
      assert(props.completeOnboarding.calledOnce)
      assert(props.history.push.calledOnce)
      assert.equal(props.history.push.getCall(0).args[0], DEFAULT_ROUTE)
    })
    done()
  })
})
