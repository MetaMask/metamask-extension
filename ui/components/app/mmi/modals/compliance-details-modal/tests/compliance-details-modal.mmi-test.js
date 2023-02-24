import assert from 'assert';
import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import sinon from 'sinon';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import { mount } from 'enzyme';
import ComplianceDetailsModal from '..';

describe('Compliance Modal', function () {
  let wrapper;

  const state = {
    metamask: {},
  };

  const props = {
    hideModal: sinon.spy(),
    onGenerateComplianceReport: sinon.spy(),
    reportAddress: '0xAddress',
  };

  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  const store = mockStore(state);

  // for some reason unit tests for opening new tab are not working when there is more than one test in the one run
  // and since there is one in account-details-modal.test.js testing here was not working
  // TODO: Add tests after moving to jest unit tests

  it('closes', function () {
    wrapper = mount(
      <Provider store={store}>
        <ComplianceDetailsModal.WrappedComponent {...props} />
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
    const close = wrapper.find('.modal-container__header-close');
    close.simulate('click');

    assert(props.hideModal.calledOnce);
    props.hideModal.resetHistory();
  });
});
