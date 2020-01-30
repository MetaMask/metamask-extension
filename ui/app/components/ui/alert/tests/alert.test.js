import React from 'react'
import assert from 'assert'
import sinon from 'sinon'
import { shallow } from 'enzyme'
import Alert from '../index'

describe('Alert', () => {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(
      <Alert />
    )
  })

  it('renders nothing with no visible boolean in state', () => {
    const alert = wrapper.find('.global-alert')
    assert.equal(alert.length, 0)
  })

  it('renders when visible in state is true, and message', () => {
    const errorMessage = 'Error Message'

    wrapper.setState({ visible: true, msg: errorMessage })

    const alert = wrapper.find('.global-alert')
    assert.equal(alert.length, 1)

    const errorText = wrapper.find('.msg')
    assert.equal(errorText.text(), errorMessage)
  })

  it('calls component method when componentWillReceiveProps is called', () => {
    const animateInSpy = sinon.stub(wrapper.instance(), 'animateIn')
    const animateOutSpy = sinon.stub(wrapper.instance(), 'animateOut')

    wrapper.setProps({ visible: true })
    assert(animateInSpy.calledOnce)

    wrapper.setProps({ visible: false })
    assert(animateOutSpy.calledOnce)
  })
})
