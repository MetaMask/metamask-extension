import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import ConfirmResetAccount from './confirm-reset-account.container';

describe('Confirm Reset Account', () => {
  let wrapper;

  const props = {
    hideModal: sinon.spy(),
    resetAccount: sinon.stub().resolves(),
  };

  beforeEach(() => {
    wrapper = mount(<ConfirmResetAccount.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    });
  });

  afterEach(() => {
    props.hideModal.resetHistory();
  });

  it('hides modal when nevermind button is clicked', () => {
    const nevermind = wrapper.find(
      '.btn-default.modal-container__footer-button',
    );
    nevermind.simulate('click');

    expect(props.hideModal.calledOnce).toStrictEqual(true);
  });

  it('resets account and hides modal when reset button is clicked', async () => {
    const reset = wrapper.find('.btn-danger.modal-container__footer-button');
    reset.simulate('click');

    expect(await props.resetAccount.calledOnce).toStrictEqual(true);
    expect(props.hideModal.calledOnce).toStrictEqual(true);
  });
});
