import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import SendRowErrorMessage from '../send-row-error-message.component'

describe('SendRowErrorMessage Component', function () {
  let wrapper

  describe('render', function () {
    beforeEach(function () {
      wrapper = shallow(
        <SendRowErrorMessage
          errors={{ error1: 'abc', error2: 'def' }}
          errorType="error3"
        />,
        { context: { t: (str) => `${str}_t` } },
      )
    })

    it('should render null if the passed errors do not contain an error of errorType', function () {
      assert.equal(wrapper.find('.send-v2__error').length, 0)
      assert.equal(wrapper.html(), null)
    })

    it('should render an error message if the passed errors contain an error of errorType', function () {
      wrapper.setProps({
        errors: { error1: 'abc', error2: 'def', error3: 'xyz' },
      })
      assert.equal(wrapper.find('.send-v2__error').length, 1)
      assert.equal(wrapper.find('.send-v2__error').text(), 'xyz_t')
    })
  })
})
