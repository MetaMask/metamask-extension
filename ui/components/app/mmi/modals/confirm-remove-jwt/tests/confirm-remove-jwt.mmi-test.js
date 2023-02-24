import assert from 'assert';
import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import sinon from 'sinon';
import configureStore from 'redux-mock-store';
import { mount } from 'enzyme';
import ConfirmRemoveJwt from '../confirm-remove-jwt.container';

describe('Confirm Remove JWT', function () {
  let wrapper;

  const state = {
    metamask: {},
  };

  const props = {
    hideModal: sinon.spy(),
    removeAccount: sinon.stub().resolves(),
    token: 'jwt',
    custodyAccountDetails: [
      {
        address: '0xAddrEss',
        name: 'name',
        labels: [],
        authDetails: { token: 'jwt' },
      },
    ],
    accounts: [{ address: '0xaddress', balance: '0x0' }],
  };

  const mockStore = configureStore();
  const store = mockStore(state);

  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <ConfirmRemoveJwt.WrappedComponent {...props} />
      </Provider>,
      {
        context: {
          t: (str) => str,
          store,
        },
        childContextTypes: {
          t: PropTypes.func,
          store: PropTypes.object,
        },
      },
    );
  });

  afterEach(() => {
    props.hideModal.resetHistory();
  });

  it('nevermind', () => {
    const nevermind = wrapper.find(
      '.btn-secondary.modal-container__footer-button',
    );
    nevermind.simulate('click');

    expect(props.hideModal.calledOnce).toBe(true);
  });

  it('remove', async () => {
    const remove = wrapper.find('.btn-primary.modal-container__footer-button');
    remove.simulate('click');

    assert(props.removeAccount.calledOnce);
    assert.strictEqual(props.removeAccount.getCall(0).args[0], '0xaddress');

    expect(props.hideModal.calledOnce).toBe(true);
  });

  it('closes', () => {
    const close = wrapper.find('.modal-container__header-close');
    close.simulate('click');

    expect(props.hideModal.calledOnce).toBe(true);
  });
});
