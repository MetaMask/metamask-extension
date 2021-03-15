import assert from 'assert';
import React from 'react';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';
import Button from '../../ui/button';
import Modal from './modal.component';

describe('Modal Component', function () {
  it('should render a modal with a submit button', function () {
    const wrapper = shallow(<Modal />);

    assert.strictEqual(wrapper.find('.modal-container').length, 1);
    const buttons = wrapper.find(Button);
    assert.strictEqual(buttons.length, 1);
    assert.strictEqual(buttons.at(0).props().type, 'secondary');
  });

  it('should render a modal with a cancel and a submit button', function () {
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
    assert.strictEqual(buttons.length, 2);
    const cancelButton = buttons.at(0);
    const submitButton = buttons.at(1);

    assert.strictEqual(cancelButton.props().type, 'default');
    assert.strictEqual(cancelButton.props().children, 'Cancel');
    assert.strictEqual(handleCancel.callCount, 0);
    cancelButton.simulate('click');
    assert.strictEqual(handleCancel.callCount, 1);

    assert.strictEqual(submitButton.props().type, 'secondary');
    assert.strictEqual(submitButton.props().children, 'Submit');
    assert.strictEqual(handleSubmit.callCount, 0);
    submitButton.simulate('click');
    assert.strictEqual(handleSubmit.callCount, 1);
  });

  it('should render a modal with different button types', function () {
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
    assert.strictEqual(buttons.length, 2);
    assert.strictEqual(buttons.at(0).props().type, 'secondary');
    assert.strictEqual(buttons.at(1).props().type, 'confirm');
  });

  it('should render a modal with children', function () {
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

    assert.ok(wrapper.find('.test-class'));
  });

  it('should render a modal with a header', function () {
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

    assert.ok(wrapper.find('.modal-container__header'));
    assert.strictEqual(
      wrapper.find('.modal-container__header-text').text(),
      'My Header',
    );
    assert.strictEqual(handleCancel.callCount, 0);
    assert.strictEqual(handleSubmit.callCount, 0);
    wrapper.find('.modal-container__header-close').simulate('click');
    assert.strictEqual(handleCancel.callCount, 1);
    assert.strictEqual(handleSubmit.callCount, 0);
  });

  it('should disable the submit button if submitDisabled is true', function () {
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
    assert.strictEqual(buttons.length, 2);
    const cancelButton = buttons.at(0);
    const submitButton = buttons.at(1);

    assert.strictEqual(handleCancel.callCount, 0);
    cancelButton.simulate('click');
    assert.strictEqual(handleCancel.callCount, 1);

    assert.strictEqual(submitButton.props().disabled, true);
    assert.strictEqual(handleSubmit.callCount, 0);
    submitButton.simulate('click');
    assert.strictEqual(handleSubmit.callCount, 0);
  });
});
