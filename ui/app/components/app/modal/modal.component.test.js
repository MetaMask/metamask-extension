import React from 'react';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';
import Button from '../../ui/button';
import Modal from './modal.component';

describe('Modal Component', () => {
  it('should render a modal with a submit button', () => {
    const wrapper = shallow(<Modal />);

    expect(wrapper.find('.modal-container')).toHaveLength(1);
    const buttons = wrapper.find(Button);
    expect(buttons).toHaveLength(1);
    expect(buttons.at(0).props().type).toStrictEqual('secondary');
  });

  it('should render a modal with a cancel and a submit button', () => {
    const handleCancel = sinon.spy();
    const handleSubmit = sinon.spy();
    const wrapper = shallow(
      <Modal
        onCancel={handleCancel}
        cancelText="Cancel"
        onSubmit={handleSubmit}
        submitText="Submit"
      />,
    );

    const buttons = wrapper.find(Button);
    expect(buttons).toHaveLength(2);
    const cancelButton = buttons.at(0);
    const submitButton = buttons.at(1);

    expect(cancelButton.props().type).toStrictEqual('default');
    expect(cancelButton.props().children).toStrictEqual('Cancel');
    expect(handleCancel.callCount).toStrictEqual(0);
    cancelButton.simulate('click');
    expect(handleCancel.callCount).toStrictEqual(1);

    expect(submitButton.props().type).toStrictEqual('secondary');
    expect(submitButton.props().children).toStrictEqual('Submit');
    expect(handleSubmit.callCount).toStrictEqual(0);
    submitButton.simulate('click');
    expect(handleSubmit.callCount).toStrictEqual(1);
  });

  it('should render a modal with different button types', () => {
    const wrapper = shallow(
      <Modal
        onCancel={() => undefined}
        cancelText="Cancel"
        cancelType="secondary"
        onSubmit={() => undefined}
        submitText="Submit"
        submitType="confirm"
      />,
    );

    const buttons = wrapper.find(Button);
    expect(buttons).toHaveLength(2);
    expect(buttons.at(0).props().type).toStrictEqual('secondary');
    expect(buttons.at(1).props().type).toStrictEqual('confirm');
  });

  it('should render a modal with children', () => {
    const wrapper = shallow(
      <Modal
        onCancel={() => undefined}
        cancelText="Cancel"
        onSubmit={() => undefined}
        submitText="Submit"
      >
        <div className="test-child" />
      </Modal>,
    );
    expect(wrapper.find('.test-child')).toHaveLength(1);
  });

  it('should render a modal with a header', () => {
    const handleCancel = sinon.spy();
    const handleSubmit = sinon.spy();
    const wrapper = shallow(
      <Modal
        onCancel={handleCancel}
        cancelText="Cancel"
        onSubmit={handleSubmit}
        submitText="Submit"
        headerText="My Header"
        onClose={handleCancel}
      />,
    );

    expect(wrapper.find('.modal-container__header')).toHaveLength(1);
    expect(wrapper.find('.modal-container__header-text').text()).toStrictEqual(
      'My Header',
    );
    expect(handleCancel.callCount).toStrictEqual(0);
    expect(handleSubmit.callCount).toStrictEqual(0);
    wrapper.find('.modal-container__header-close').simulate('click');
    expect(handleCancel.callCount).toStrictEqual(1);
    expect(handleSubmit.callCount).toStrictEqual(0);
  });

  it('should disable the submit button if submitDisabled is true', () => {
    const handleCancel = sinon.spy();
    const handleSubmit = sinon.spy();
    const wrapper = mount(
      <Modal
        onCancel={handleCancel}
        cancelText="Cancel"
        onSubmit={handleSubmit}
        submitText="Submit"
        submitDisabled
        headerText="My Header"
        onClose={handleCancel}
      />,
    );

    const buttons = wrapper.find(Button);
    expect(buttons).toHaveLength(2);
    const cancelButton = buttons.at(0);
    const submitButton = buttons.at(1);

    expect(handleCancel.callCount).toStrictEqual(0);
    cancelButton.simulate('click');
    expect(handleCancel.callCount).toStrictEqual(1);

    expect(submitButton.props().disabled).toStrictEqual(true);
    expect(handleSubmit.callCount).toStrictEqual(0);
    submitButton.simulate('click');
    expect(handleSubmit.callCount).toStrictEqual(0);
  });
});
