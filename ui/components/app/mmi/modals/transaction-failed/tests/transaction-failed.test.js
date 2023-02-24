import assert from 'assert';
import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import TransactionFailed from '..';

describe('Transaction Failed', function () {
  it('clicks ok to hide modal', function () {
    const props = {
      hideModal: sinon.spy(),
    };
    const wrapper = mount(<TransactionFailed.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    });
    const submit = wrapper.find('.btn-primary.modal-container__footer-button');
    submit.simulate('click');

    assert(props.hideModal.calledOnce);
  });
});
