import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import SendRowWrapper from '../send-row-wrapper.component.js'

import SendRowErrorMessage from '../send-row-error-message/send-row-error-message.container'

describe('SendContent Component', function () {
  let wrapper

  beforeEach(() => {
    wrapper = shallow(<SendRowWrapper
      errorType={'mockErrorType'}
      label={'mockLabel'}
      showError={false}
    >
      <span>Mock Form Field</span>
    </SendRowWrapper>)
  })

  describe('render', () => {
    it('should render a div with a send-v2__form-row class', () => {
      assert.equal(wrapper.find('div.send-v2__form-row').length, 1)
    })

    it('should render two children of the root div, with send-v2_form label and field classes', () => {
      assert.equal(wrapper.find('.send-v2__form-row > .send-v2__form-label').length, 1)
      assert.equal(wrapper.find('.send-v2__form-row > .send-v2__form-field').length, 1)
    })

    it('should render the label as a child of the send-v2__form-label', () => {
      assert.equal(wrapper.find('.send-v2__form-row > .send-v2__form-label').childAt(0).text(), 'mockLabel')
    })

    it('should render its first child as a child of the send-v2__form-field', () => {
      assert.equal(wrapper.find('.send-v2__form-row > .send-v2__form-field').childAt(0).text(), 'Mock Form Field')
    })

    it('should not render a SendRowErrorMessage if showError is false', () => {
      assert.equal(wrapper.find(SendRowErrorMessage).length, 0)
    })

    it('should render a SendRowErrorMessage with and errorType props if showError is true', () => {
      wrapper.setProps({showError: true})
      assert.equal(wrapper.find(SendRowErrorMessage).length, 1)

      const expectedSendRowErrorMessage = wrapper.find('.send-v2__form-row > .send-v2__form-label').childAt(1)
      assert(expectedSendRowErrorMessage.is(SendRowErrorMessage))
      assert.deepEqual(
        expectedSendRowErrorMessage.props(),
        { errorType: 'mockErrorType' }
      )
    })

    it('should render its second child as a child of the send-v2__form-field, if it has two children', () => {
      wrapper = shallow(<SendRowWrapper
      errorType={'mockErrorType'}
      label={'mockLabel'}
      showError={false}
    >
      <span>Mock Custom Label Content</span>
      <span>Mock Form Field</span>
    </SendRowWrapper>)
      assert.equal(wrapper.find('.send-v2__form-row > .send-v2__form-field').childAt(0).text(), 'Mock Form Field')
    })

    it('should render its first child as the last child of the send-v2__form-label, if it has two children', () => {
      wrapper = shallow(<SendRowWrapper
      errorType={'mockErrorType'}
      label={'mockLabel'}
      showError={false}
    >
      <span>Mock Custom Label Content</span>
      <span>Mock Form Field</span>
    </SendRowWrapper>)
      assert.equal(wrapper.find('.send-v2__form-row > .send-v2__form-label').childAt(1).text(), 'Mock Custom Label Content')
    })
  })
})
