import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { mountWithRouter } from '../../../../../../test/lib/render-helpers'
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes'
import EndOfFlowScreen from '../index'

describe('End of Flow Screen', function () {
  let wrapper

  const props = {
    history: {
      push: sinon.spy(),
    },
    completeOnboarding: sinon.spy(),
  }

  beforeEach(function () {
    wrapper = mountWithRouter(
      <EndOfFlowScreen.WrappedComponent {...props} />,
    )
  })

  it('renders', function () {
    assert.equal(wrapper.length, 1)
  })

  it('should navigate to the default route on click', function (done) {
    const endOfFlowButton = wrapper.find('.btn-primary.first-time-flow__button')
    endOfFlowButton.simulate('click')

    setImmediate(() => {
      assert(props.completeOnboarding.calledOnce)
      assert(props.history.push.calledOnceWithExactly(DEFAULT_ROUTE))
      done()
    })
  })
})
