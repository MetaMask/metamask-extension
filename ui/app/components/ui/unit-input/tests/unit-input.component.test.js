import assert from 'assert'
import React from 'react'
import { shallow, mount } from 'enzyme'
import sinon from 'sinon'
import UnitInput from '../unit-input.component'

describe('UnitInput Component', function () {
  describe('rendering', function () {
    it('should render properly without a suffix', function () {
      const wrapper = shallow(<UnitInput />)

      assert.ok(wrapper)
      assert.equal(wrapper.find('.unit-input__suffix').length, 0)
    })

    it('should render properly with a suffix', function () {
      const wrapper = shallow(<UnitInput suffix="ETH" />)

      assert.ok(wrapper)
      assert.equal(wrapper.find('.unit-input__suffix').length, 1)
      assert.equal(wrapper.find('.unit-input__suffix').text(), 'ETH')
    })

    it('should render properly with a child component', function () {
      const wrapper = shallow(
        <UnitInput>
          <div className="testing">TESTCOMPONENT</div>
        </UnitInput>,
      )

      assert.ok(wrapper)
      assert.equal(wrapper.find('.testing').length, 1)
      assert.equal(wrapper.find('.testing').text(), 'TESTCOMPONENT')
    })

    it('should render with an error class when props.error === true', function () {
      const wrapper = shallow(<UnitInput error />)

      assert.ok(wrapper)
      assert.equal(wrapper.find('.unit-input--error').length, 1)
    })
  })

  describe('handling actions', function () {
    const handleChangeSpy = sinon.spy()
    const handleBlurSpy = sinon.spy()

    afterEach(function () {
      handleChangeSpy.resetHistory()
      handleBlurSpy.resetHistory()
    })

    it('should focus the input on component click', function () {
      const wrapper = mount(<UnitInput />)

      assert.ok(wrapper)
      const handleFocusSpy = sinon.spy(wrapper.instance(), 'handleFocus')
      wrapper.instance().forceUpdate()
      wrapper.update()
      assert.equal(handleFocusSpy.callCount, 0)
      wrapper.find('.unit-input').simulate('click')
      assert.equal(handleFocusSpy.callCount, 1)
    })

    it('should call onChange on input changes with the value', function () {
      const wrapper = mount(<UnitInput onChange={handleChangeSpy} />)

      assert.ok(wrapper)
      assert.equal(handleChangeSpy.callCount, 0)
      const input = wrapper.find('input')
      input.simulate('change', { target: { value: 123 } })
      assert.equal(handleChangeSpy.callCount, 1)
      assert.ok(handleChangeSpy.calledWith(123))
      assert.equal(wrapper.state('value'), 123)
    })

    it('should set the component state value with props.value', function () {
      const wrapper = mount(<UnitInput value={123} />)

      assert.ok(wrapper)
      assert.equal(wrapper.state('value'), 123)
    })

    it('should update the component state value with props.value', function () {
      const wrapper = mount(<UnitInput onChange={handleChangeSpy} />)

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
