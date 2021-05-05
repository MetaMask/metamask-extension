import React from 'react';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import UnitInput from './unit-input.component';

describe('UnitInput Component', () => {
  describe('rendering', () => {
    it('should render properly without a suffix', () => {
      const wrapper = shallow(<UnitInput />);

      expect(wrapper).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix')).toHaveLength(0);
    });

    it('should render properly with a suffix', () => {
      const wrapper = shallow(<UnitInput suffix="ETH" />);

      expect(wrapper).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix')).toHaveLength(1);
      expect(wrapper.find('.unit-input__suffix').text()).toStrictEqual('ETH');
    });

    it('should render properly with a child component', () => {
      const wrapper = shallow(
        <UnitInput>
          <div className="testing">TESTCOMPONENT</div>
        </UnitInput>,
      );

      expect(wrapper).toHaveLength(1);
      expect(wrapper.find('.testing')).toHaveLength(1);
      expect(wrapper.find('.testing').text()).toStrictEqual('TESTCOMPONENT');
    });

    it('should render with an error class when props.error === true', () => {
      const wrapper = shallow(<UnitInput error />);

      expect(wrapper).toHaveLength(1);
      expect(wrapper.find('.unit-input--error')).toHaveLength(1);
    });
  });

  describe('handling actions', () => {
    const handleChangeSpy = sinon.spy();
    const handleBlurSpy = sinon.spy();

    afterEach(() => {
      handleChangeSpy.resetHistory();
      handleBlurSpy.resetHistory();
    });

    it('should focus the input on component click', () => {
      const wrapper = mount(<UnitInput />);

      expect(wrapper).toHaveLength(1);
      const handleFocusSpy = sinon.spy(wrapper.instance(), 'handleFocus');
      wrapper.instance().forceUpdate();
      wrapper.update();
      expect(handleFocusSpy.callCount).toStrictEqual(0);
      wrapper.find('.unit-input').simulate('click');
      expect(handleFocusSpy.callCount).toStrictEqual(1);
    });

    it('should call onChange on input changes with the value', () => {
      const wrapper = mount(<UnitInput onChange={handleChangeSpy} />);

      expect(wrapper).toHaveLength(1);
      expect(handleChangeSpy.callCount).toStrictEqual(0);
      const input = wrapper.find('input');
      input.simulate('change', { target: { value: 123 } });
      expect(handleChangeSpy.callCount).toStrictEqual(1);
      expect(handleChangeSpy.calledWith(123)).toStrictEqual(true);
      expect(wrapper.state('value')).toStrictEqual(123);
    });

    it('should set the component state value with props.value', () => {
      const wrapper = mount(<UnitInput value={123} />);

      expect(wrapper).toHaveLength(1);
      expect(wrapper.state('value')).toStrictEqual(123);
    });

    it('should update the component state value with props.value', () => {
      const wrapper = mount(<UnitInput onChange={handleChangeSpy} />);

      expect(wrapper).toHaveLength(1);
      expect(handleChangeSpy.callCount).toStrictEqual(0);
      const input = wrapper.find('input');
      input.simulate('change', { target: { value: 123 } });
      expect(wrapper.state('value')).toStrictEqual(123);
      expect(handleChangeSpy.callCount).toStrictEqual(1);
      expect(handleChangeSpy.calledWith(123)).toStrictEqual(true);
      wrapper.setProps({ value: 456 });
      expect(wrapper.state('value')).toStrictEqual(456);
      expect(handleChangeSpy.callCount).toStrictEqual(1);
    });
  });
});
