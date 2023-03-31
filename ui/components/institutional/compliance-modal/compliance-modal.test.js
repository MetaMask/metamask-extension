import assert from 'assert';
import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import sinon from 'sinon';
import configureStore from 'redux-mock-store';
import { mount } from 'enzyme';
import ComplianceModal from '..';

describe('Compliance Modal', function () {
  let wrapper;

  const state = {
    metamask: {},
  };

  const props = {
    hideModal: sinon.spy(),
  };

  const mockStore = configureStore();
  const store = mockStore(state);

  // for some reason unit tests for opening new tab are not working when there is more than one test in the one run
  // and since there is one in account-details-modal.test.js testing here was not working
  // TODO: Add tests after moving to jest unit tests

  it('closes the modal', function () {
    wrapper = mount(
      <Provider store={store}>
        <ComplianceModal.WrappedComponent {...props} />
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
    const close = wrapper.find('[data-testid="compliance-modal-close"]');
    close.simulate('click');

    assert(props.hideModal.calledOnce);
    props.hideModal.resetHistory();
  });

  it('opens new tab on "Open Coddefi Compliance" click', function () {
    global.platform = { openTab: sinon.spy() };
    wrapper = mount(
      <Provider store={store}>
        <ComplianceModal.WrappedComponent {...props} />
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
    const signupButton = wrapper.find('.modal-container__footer .btn-primary');
    signupButton.simulate('click');

    expect(global.platform.openTab.called).toBeTruthy();
  });
});
