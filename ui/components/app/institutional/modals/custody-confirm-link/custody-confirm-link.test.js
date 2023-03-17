import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import sinon from 'sinon';
import configureStore from 'redux-mock-store';
import { mount } from 'enzyme';
import CustodyConfirmLink from '../custody-confirm-link.container';

describe('Custody Confirm Link', function () {
  let wrapper;

  const state = {
    metamask: {},
  };

  const props = {
    hideModal: sinon.spy(),
    showAccountDetail: sinon.spy(),
    mmiAccounts: {
      '0xd0459ae488244425d662aa90e666adb8e6f94d11': {
        address: '0xd0459ae488244425d662aa90e666adb8e6f94d11',
        balance: '0x470de4df820000',
      },
      '0xa1671553e08564a4d83a70b8312319c26b1593ff': {
        address: '0xa1671553e08564a4d83a70b8312319c26b1593ff',
        balance: '0x968f441011aa3ef',
      },
    },
    link: {
      text: 'Approve your transaction in the Saturn Custody web application',
      url: 'https://saturn-custody.codefi.network/',
      action: 'Approve',
      ethereum: {
        accounts: ['0xa1671553E08564A4D83A70b8312319C26B1593ff'],
        chainId: ['0x4'],
      },
    },
    closeNotification: false,
    custodianName: 'Jupiter',
    custodians: [
      {
        production: true,
        name: 'Jupiter',
        type: 'Jupiter',
        iconUrl: 'iconUrl',
        displayName: 'displayName',
      },
    ],
    setWaitForConfirmDeepLinkDialog: sinon.spy(),
  };

  const mockStore = configureStore();
  const store = mockStore(state);

  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <CustodyConfirmLink.WrappedComponent {...props} />
      </Provider>,
      {
        context: {
          t: (str) => str,
          store,
          trackEvent: () => undefined,
        },
        childContextTypes: {
          t: PropTypes.func,
          store: PropTypes.object,
          trackEvent: () => undefined,
        },
      },
    );
  });

  afterEach(() => {
    props.hideModal.resetHistory();
  });

  it('tries to open new tab with deeplink URL', () => {
    global.platform = { openTab: sinon.spy() };
    const showReportButton = wrapper.find(
      '.btn-primary.custody-confirm-link__btn',
    );
    showReportButton.simulate('click');
    expect(global.platform.openTab.calledOnce).toBe(true);
  });
});
