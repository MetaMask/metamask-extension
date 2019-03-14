import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import SendRowErrorMessage from '../send-row-error-message.component.js'

describe('SendRowErrorMessage Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<SendRowErrorMessage
      errors={{ error1: 'abc', error2: 'def' }}
      errorType={'error3'}
    />, { context: { t: str => str + '_t' } })
  })

  describe('render', () => {
    it('should render null if the passed errors do not contain an error of errorType', () => {
      assert.equal(wrapper.find('.send-v2__error').length, 0)
      assert.equal(wrapper.html(), null)
    })

    it('should render an error message if the passed errors contain an error of errorType', () => {
      wrapper.setProps({ errors: { error1: 'abc', error2: 'def', error3: 'xyz' } })
      assert.equal(wrapper.find('.send-v2__error').length, 1)
      assert.equal(wrapper.find('.send-v2__error').text(), 'xyz_t')
    })
  })
})
