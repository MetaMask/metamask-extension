import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import RejectTransactionsModal from './reject-transactions.container';

describe('Reject Transactions Model', () => {
  let wrapper;

  const props = {
    onSubmit: sinon.spy(),
    hideModal: sinon.spy(),
    unapprovedTxCount: 2,
  };

  beforeEach(() => {
    wrapper = mount(<RejectTransactionsModal.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    });
  });

  afterEach(() => {
    props.hideModal.resetHistory();
  });

  it('hides modal when cancel button is clicked', () => {
    const cancelButton = wrapper.find(
      '.btn-default.modal-container__footer-button',
    );
    cancelButton.simulate('click');

    expect(props.hideModal.calledOnce).toStrictEqual(true);
  });

  it('onSubmit is called and hides modal when reject all clicked', async () => {
    const rejectAllButton = wrapper.find(
      '.btn-secondary.modal-container__footer-button',
    );
    rejectAllButton.simulate('click');

    expect(await props.onSubmit.calledOnce).toStrictEqual(true);
    expect(props.hideModal.calledOnce).toStrictEqual(true);
  });
});
