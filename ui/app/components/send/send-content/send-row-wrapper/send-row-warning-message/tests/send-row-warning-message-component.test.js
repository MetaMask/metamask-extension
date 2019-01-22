import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import SendRowWarningMessage from '../send-row-warning-message.component.js'

describe('SendRowWarningMessage Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<SendRowWarningMessage
      warnings={{ warning1: 'abc', warning2: 'def' }}
      warningType={'warning3'}
    />, { context: { t: str => str + '_t' } })
  })

  describe('render', () => {
    it('should render null if the passed warnings do not contain a warning of warningType', () => {
      assert.equal(wrapper.find('.send-v2__error').length, 0)
      assert.equal(wrapper.html(), null)
    })

    it('should render a warning message if the passed warnings contain a warning of warningType', () => {
      wrapper.setProps({ warnings: { warning1: 'abc', warning2: 'def', warning3: 'xyz' } })
      assert.equal(wrapper.find('.send-v2__error').length, 1)
      assert.equal(wrapper.find('.send-v2__error').text(), 'xyz_t')
    })
  })
})
