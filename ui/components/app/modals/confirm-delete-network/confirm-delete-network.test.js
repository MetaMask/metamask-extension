import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import ConfirmDeleteNetwork from './confirm-delete-network.container';

describe('Confirm Delete Network', () => {
  let wrapper;

  const props = {
    hideModal: sinon.spy(),
    delRpcTarget: sinon.stub().resolves(),
    onConfirm: sinon.spy(),
    target: '',
  };

  beforeEach(() => {
    wrapper = mount(<ConfirmDeleteNetwork.WrappedComponent {...props} />, {
      context: {
        t: (str) => str,
      },
    });
  });

  afterEach(() => {
    props.hideModal.resetHistory();
    props.delRpcTarget.resetHistory();
    props.onConfirm.resetHistory();
  });

  it('renders delete network modal title', () => {
    const modalTitle = wrapper.find('.modal-content__title');
    expect(modalTitle.text()).toStrictEqual('deleteNetwork');
  });

  it('clicks cancel to hide modal', () => {
    const cancelButton = wrapper.find(
      '.button.btn-default.modal-container__footer-button',
    );
    cancelButton.simulate('click');

    expect(props.hideModal.calledOnce).toStrictEqual(true);
  });

  it('clicks delete to delete the target and hides modal', async () => {
    const deleteButton = wrapper.find(
      '.button.btn-danger.modal-container__footer-button',
    );

    deleteButton.simulate('click');

    expect(await props.delRpcTarget.calledOnce).toStrictEqual(true);
    expect(props.hideModal.calledOnce).toStrictEqual(true);
    expect(props.onConfirm.calledOnce).toStrictEqual(true);
  });
});
