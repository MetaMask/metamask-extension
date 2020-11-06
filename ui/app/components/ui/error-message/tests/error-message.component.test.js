import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import ErrorMessage from '../error-message.component'

describe('ErrorMessage Component', function () {
  const t = (key) => `translate ${key}`

  it('should render a message from props.errorMessage', function () {
    const wrapper = shallow(<ErrorMessage errorMessage="This is an error." />, {
      context: { t },
    })

    assert.ok(wrapper)
    assert.equal(wrapper.find('.error-message').length, 1)
    assert.equal(wrapper.find('.error-message__icon').length, 1)
    assert.equal(
      wrapper.find('.error-message__text').text(),
      'ALERT: This is an error.',
    )
  })

  it('should render a message translated from props.errorKey', function () {
    const wrapper = shallow(<ErrorMessage errorKey="testKey" />, {
      context: { t },
    })

    assert.ok(wrapper)
    assert.equal(wrapper.find('.error-message').length, 1)
    assert.equal(wrapper.find('.error-message__icon').length, 1)
    assert.equal(
      wrapper.find('.error-message__text').text(),
      'ALERT: translate testKey',
    )
  })
})
