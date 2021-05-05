import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import TransactionConfirmed from './transaction-confirmed.container';

describe('Transaction Confirmed', () => {
  it('clicks ok to submit and hide modal', () => {
    const props = {
      onSubmit: sinon.spy(),
      hideModal: sinon.spy(),
    };
    const wrapper = mount(
      <TransactionConfirmed.WrappedComponent {...props} />,
      {
        context: {
          t: (str) => str,
        },
      },
    );
    const submit = wrapper.find(
      '.btn-secondary.modal-container__footer-button',
    );
    submit.simulate('click');

    expect(props.onSubmit.calledOnce).toStrictEqual(true);
    expect(props.hideModal.calledOnce).toStrictEqual(true);
  });
});
