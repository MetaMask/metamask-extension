import React from 'react'
import assert from 'assert'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import Button from '../../../button'
import PageFooter from '../page-container-footer.component'

describe('Page Footer', () => {
  let wrapper
  const onCancel = sinon.spy()
  const onSubmit = sinon.spy()

  beforeEach(() => {
    wrapper = shallow((
      <PageFooter
        onCancel={onCancel}
        onSubmit={onSubmit}
        cancelText="Cancel"
        submitText="Submit"
        disabled={false}
        submitButtonType="Test Type"
      />
    ))
  })

  it('renders page container footer', () => {
    assert.equal(wrapper.find('.page-container__footer').length, 1)
  })

  it('should render a footer inside page-container__footer when given children', () => {
    const wrapper = shallow(
      <PageFooter>
        <div>Works</div>
      </PageFooter>,
      { context: { t: sinon.spy((k) => `[${k}]`) } }
    )

    assert.equal(wrapper.find('.page-container__footer footer').length, 1)
  })

  it('renders two button components', () => {
    assert.equal(wrapper.find(Button).length, 2)
  })

  describe('Cancel Button', () => {

    it('has button type of default', () => {
      assert.equal(wrapper.find('.page-container__footer-button').first().prop('type'), 'default')
    })

    it('has children text of Cancel', () => {
      assert.equal(wrapper.find('.page-container__footer-button').first().prop('children'), 'Cancel')
    })

    it('should call cancel when click is simulated', () => {
      wrapper.find('.page-container__footer-button').first().prop('onClick')()
      assert.equal(onCancel.callCount, 1)
    })

  })

  describe('Submit Button', () => {

    it('assigns button type based on props', () => {
      assert.equal(wrapper.find('.page-container__footer-button').last().prop('type'), 'Test Type')
    })

    it('has disabled prop', () => {
      assert.equal(wrapper.find('.page-container__footer-button').last().prop('disabled'), false)
    })

    it('has children text when submitText prop exists', () => {
      assert.equal(wrapper.find('.page-container__footer-button').last().prop('children'), 'Submit')
    })

    it('should call submit when click is simulated', () => {
      wrapper.find('.page-container__footer-button').last().prop('onClick')()
      assert.equal(onSubmit.callCount, 1)
    })
  })
})
