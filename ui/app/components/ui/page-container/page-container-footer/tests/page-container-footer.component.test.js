import assert from 'assert'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import Button from '../../../button'
import PageFooter from '../page-container-footer.component'

describe('Page Footer', function () {
  let wrapper
  const onCancel = sinon.spy()
  const onSubmit = sinon.spy()

  beforeEach(function () {
    wrapper = shallow(
      <PageFooter
        onCancel={onCancel}
        onSubmit={onSubmit}
        cancelText="Cancel"
        submitText="Submit"
        disabled={false}
        submitButtonType="Test Type"
      />,
    )
  })

  it('renders page container footer', function () {
    assert.equal(wrapper.find('.page-container__footer').length, 1)
  })

  it('should render a secondary footer inside page-container__footer when given children', function () {
    wrapper = shallow(
      <PageFooter>
        <div>Works</div>
      </PageFooter>,
      { context: { t: sinon.spy((k) => `[${k}]`) } },
    )

    assert.equal(wrapper.find('.page-container__footer-secondary').length, 1)
  })

  it('renders two button components', function () {
    assert.equal(wrapper.find(Button).length, 2)
  })

  describe('Cancel Button', function () {
    it('has button type of default', function () {
      assert.equal(
        wrapper.find('.page-container__footer-button').first().prop('type'),
        'default',
      )
    })

    it('has children text of Cancel', function () {
      assert.equal(
        wrapper.find('.page-container__footer-button').first().prop('children'),
        'Cancel',
      )
    })

    it('should call cancel when click is simulated', function () {
      wrapper.find('.page-container__footer-button').first().prop('onClick')()
      assert.equal(onCancel.callCount, 1)
    })
  })

  describe('Submit Button', function () {
    it('assigns button type based on props', function () {
      assert.equal(
        wrapper.find('.page-container__footer-button').last().prop('type'),
        'Test Type',
      )
    })

    it('has disabled prop', function () {
      assert.equal(
        wrapper.find('.page-container__footer-button').last().prop('disabled'),
        false,
      )
    })

    it('has children text when submitText prop exists', function () {
      assert.equal(
        wrapper.find('.page-container__footer-button').last().prop('children'),
        'Submit',
      )
    })

    it('should call submit when click is simulated', function () {
      wrapper.find('.page-container__footer-button').last().prop('onClick')()
      assert.equal(onSubmit.callCount, 1)
    })
  })
})
