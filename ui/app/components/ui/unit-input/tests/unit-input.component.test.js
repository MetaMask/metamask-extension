import React from 'react'
import assert from 'assert'
import { shallow, mount } from 'enzyme'
import sinon from 'sinon'
import UnitInput from '../unit-input.component'

describe('UnitInput Component', () => {
  describe('rendering', () => {
    it('should render properly without a suffix', () => {
      const wrapper = shallow(
        <UnitInput />
      )

      assert.ok(wrapper)
      assert.equal(wrapper.find('.unit-input__suffix').length, 0)
    })

    it('should render properly with a suffix', () => {
      const wrapper = shallow(
        <UnitInput
          suffix="ETH"
        />
      )

      assert.ok(wrapper)
      assert.equal(wrapper.find('.unit-input__suffix').length, 1)
      assert.equal(wrapper.find('.unit-input__suffix').text(), 'ETH')
    })

    it('should render properly with a child omponent', () => {
      const wrapper = shallow(
        <UnitInput>
          <div className="testing">
            TESTCOMPONENT
          </div>
        </UnitInput>
      )

      assert.ok(wrapper)
      assert.equal(wrapper.find('.testing').length, 1)
      assert.equal(wrapper.find('.testing').text(), 'TESTCOMPONENT')
    })

    it('should render with an error class when props.error === true', () => {
      const wrapper = shallow(
        <UnitInput
          error
        />
      )

      assert.ok(wrapper)
      assert.equal(wrapper.find('.unit-input--error').length, 1)
    })
  })

  describe('handling actions', () => {
    const handleChangeSpy = sinon.spy()
    const handleBlurSpy = sinon.spy()

    afterEach(() => {
      handleChangeSpy.resetHistory()
      handleBlurSpy.resetHistory()
    })

    it('should focus the input on component click', () => {
      const wrapper = mount(
        <UnitInput />
      )

      assert.ok(wrapper)
      const handleFocusSpy = sinon.spy(wrapper.instance(), 'handleFocus')
      wrapper.instance().forceUpdate()
      wrapper.update()
      assert.equal(handleFocusSpy.callCount, 0)
      wrapper.find('.unit-input').simulate('click')
      assert.equal(handleFocusSpy.callCount, 1)
    })

    it('should call onChange on input changes with the value', () => {
      const wrapper = mount(
        <UnitInput
          onChange={handleChangeSpy}
        />
      )

      assert.ok(wrapper)
      assert.equal(handleChangeSpy.callCount, 0)
      const input = wrapper.find('input')
      input.simulate('change', { target: { value: 123 } })
      assert.equal(handleChangeSpy.callCount, 1)
      assert.ok(handleChangeSpy.calledWith(123))
      assert.equal(wrapper.state('value'), 123)
    })

    it('should call onBlur on blur with the value', () => {
      const wrapper = mount(
        <UnitInput
          onChange={handleChangeSpy}
          onBlur={handleBlurSpy}
        />
      )

      assert.ok(wrapper)
      assert.equal(handleChangeSpy.callCount, 0)
      assert.equal(handleBlurSpy.callCount, 0)
      const input = wrapper.find('input')
      input.simulate('change', { target: { value: 123 } })
      assert.equal(handleChangeSpy.callCount, 1)
      assert.ok(handleChangeSpy.calledWith(123))
      assert.equal(wrapper.state('value'), 123)
      input.simulate('blur')
      assert.equal(handleBlurSpy.callCount, 1)
      assert.ok(handleBlurSpy.calledWith(123))
    })

    it('should set the component state value with props.value', () => {
      const wrapper = mount(
        <UnitInput
          value={123}
        />
      )

      assert.ok(wrapper)
      assert.equal(wrapper.state('value'), 123)
    })

    it('should update the component state value with props.value', () => {
      const wrapper = mount(
        <UnitInput
          onChange={handleChangeSpy}
        />
      )

      assert.ok(wrapper)
      assert.equal(handleChangeSpy.callCount, 0)
      const input = wrapper.find('input')
      input.simulate('change', { target: { value: 123 } })
      assert.equal(wrapper.state('value'), 123)
      assert.equal(handleChangeSpy.callCount, 1)
      assert.ok(handleChangeSpy.calledWith(123))
      wrapper.setProps({ value: 456 })
      assert.equal(wrapper.state('value'), 456)
      assert.equal(handleChangeSpy.callCount, 1)
    })
  })
})
