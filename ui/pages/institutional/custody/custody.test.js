import React from 'react';
import PropTypes from 'prop-types';
import sinon from 'sinon';
import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import CustodySubview from './custody.component';

// TODO - check why they fail running together
/* eslint-disable mocha/no-skipped-tests */
describe.skip('CustodySubview', function () {
  let wrapper, clock;

  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
      },
    },
    appState: {
      isLoading: false,
    },
  };

  const store = configureMockStore()(mockStore);

  const props = {
    connectCustodyAddresses: sinon.spy(),
    getCustodianAccounts: sinon.stub().callsFake(() => [
      {
        address: '0xAddress',
        name: 'name',
        custodianDetails: {},
        labels: [],
        chainId: 1,
        accountBalance: 1,
      },
    ]),
    getCustodianAccountsByAddress: sinon.spy(),
    getCustodianToken: sinon.stub().callsFake(() => 'testJWT'),
    getCustodianJWTList: async () => ['jwt1'],
    provider: { chainId: 0x1 },
    history: {
      push: sinon.spy(),
    },
    mostRecentOverviewPage: 'test',
    custodians: [
      {
        production: true,
        name: 'name',
        type: 'type',
        iconUrl: 'iconUrl',
        displayName: 'displayName',
      },
    ],
  };

  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <CustodySubview.WrappedComponent {...props} />
      </Provider>,
      {
        context: {
          t: (str) => str,
          store,
          metricsEvent: () => undefined,
        },
        childContextTypes: {
          t: PropTypes.func,
          store: PropTypes.object,
          metricsEvent: () => undefined,
        },
      },
    );
    clock = sinon.useFakeTimers(1);
  });

  afterEach(() => {
    props.history.push.resetHistory();
    clock.restore();
  });

  it('opens connect custody without any custody selected', () => {
    const selectedCustodyBtn = wrapper.find(
      '[data-testid="custody-connect-button"]',
    );
    expect(Object.keys(selectedCustodyBtn)).toHaveLength(0);
  });

  it('call getCustodianJwtList on custody select and shows account list on connect click', async () => {
    const custodyBtn = wrapper.find('[data-testid="custody-connect-button"]');
    const listPromise = Promise.resolve(['jwt2']);
    const accountsPromise = Promise.resolve([
      {
        address: 'address',
        name: 'name',
        custodianDetails: { walletId: 'walletId' },
        labels: [],
      },
    ]);
    jest
      .spyOn(props, 'getCustodianAccounts')
      .mockImplementation(() => accountsPromise);
    jest
      .spyOn(props, 'getCustodianJWTList')
      .mockImplementation(() => listPromise);

    custodyBtn.first().simulate('click');

    await listPromise;
    wrapper.update();
    await wrapper
      .find('[data-testid="jwt-form-connect-button"]')
      .first()
      .simulate('click');
    await accountsPromise;
    wrapper.update();
    expect(wrapper.find('.custody-account-list')).toBeTruthy();
    wrapper
      .find('[data-testid="custody-account-list-item-radio-button"] input')
      .first()
      .simulate('change', { target: { checked: true } });
    expect(
      wrapper.find(
        '[data-testid="custody-account-list-item-radio-button"] input[checked="true"]',
      ),
    ).toBeTruthy();
    wrapper
      .find('[data-testid="custody-account-connect-button"]')
      .first()
      .simulate('click');
    expect(props.connectCustodyAddresses.called).toBeTruthy();
  });

  it('shows the empty accounts list when all custodian accounts are already added', async () => {
    const newProps = {
      ...props,
      getCustodianAccounts: sinon.stub().callsFake(() => []),
    };
    wrapper = mount(
      <Provider store={store}>
        <CustodySubview.WrappedComponent {...newProps} />
      </Provider>,
      {
        context: {
          t: (str) => str,
          store,
          metricsEvent: () => undefined,
        },
        childContextTypes: {
          t: PropTypes.func,
          store: PropTypes.object,
          metricsEvent: () => undefined,
        },
      },
    );
    const custodyBtn = wrapper.find('[data-testid="custody-connect-button"]');
    const listPromise = Promise.resolve(['jwt2']);
    const accountsPromise = Promise.resolve([]);
    jest
      .spyOn(props, 'getCustodianAccounts')
      .mockImplementation(() => accountsPromise);
    jest
      .spyOn(props, 'getCustodianJWTList')
      .mockImplementation(() => listPromise);
    custodyBtn.first().simulate('click');

    await listPromise;
    wrapper.update();
    await wrapper
      .find('[data-testid="jwt-form-connect-button"]')
      .first()
      .simulate('click');
    await accountsPromise;
    wrapper.update();

    expect(
      wrapper.find('[data-testid="custody-account-list"]').exists(),
    ).toBeFalsy();
    expect(wrapper.find('[data-testid="custody-accounts-empty"]')).toBeTruthy();
  });

  it('shows the accounts list after the jwt token form', async () => {
    const newProps = {
      ...props,
      getCustodianAccountsByAddress: sinon.stub().throwsException('Error 500'),
    };
    wrapper = mount(
      <Provider store={store}>
        <CustodySubview.WrappedComponent {...newProps} />
      </Provider>,
      {
        context: {
          t: (str) => str,
          store,
          metricsEvent: () => undefined,
        },
        childContextTypes: {
          t: PropTypes.func,
          store: PropTypes.object,
          metricsEvent: () => undefined,
        },
      },
    );
    const custodyBtn = wrapper.find('[data-testid="custody-connect-button"]');
    const listPromise = Promise.resolve(['jwt2']);
    const accountsPromise = Promise.resolve([
      {
        address: 'address',
        name: 'name',
        walletId: 'walletId',
        labels: [],
      },
      {
        address: 'address2',
        name: 'name2',
        walletId: 'walletId',
        labels: [],
      },
    ]);
    jest
      .spyOn(props, 'getCustodianAccounts')
      .mockImplementation(() => accountsPromise);
    jest
      .spyOn(props, 'getCustodianJWTList')
      .mockImplementation(() => listPromise);
    custodyBtn.first().simulate('click');

    await listPromise;
    wrapper.update();
    await wrapper
      .find('[data-testid="jwt-form-connect-button"]')
      .first()
      .simulate('click');
    await accountsPromise;
    wrapper.update();
    expect(wrapper.find('[data-testid="custody-account-list"]')).toBeTruthy();
  });

  it('calls getCustodianAccounts on network change', async () => {
    wrapper.find('CustodySubview').props().provider = { chainId: 2 };
    wrapper.update();
    wrapper.find('CustodySubview').instance().handleNetworkChange();
    expect(props.getCustodianAccounts.called).toBeTruthy();
  });

  it('calls getCustodianAccounts while trying to connect when connectRequest is provided', () => {
    const newProps = {
      ...props,
      getCustodianConnectRequest: () => ({
        custodian: 'jupiter',
        token: 'token',
        apiUrl: 'url',
      }),
    };
    wrapper = mount(
      <Provider store={store}>
        <CustodySubview.WrappedComponent {...newProps} />
      </Provider>,
      {
        context: {
          t: (str) => str,
          store,
          metricsEvent: () => undefined,
        },
        childContextTypes: {
          t: PropTypes.func,
          store: PropTypes.object,
          metricsEvent: () => undefined,
        },
      },
    );
    expect(props.getCustodianAccounts.called).toBeTruthy();
  });
});
