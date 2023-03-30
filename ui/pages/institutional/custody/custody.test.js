import React from 'react';
import sinon from 'sinon';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import CustodyPage from '.';

const mockedReturnedValue = jest
  .fn()
  .mockReturnValue({ type: 'TYPE' });

const mockedGetCustodianAccounts = jest
  .fn()
  .mockReturnValue(
    [
      {
        address: '0xAddress',
        name: 'name',
        custodianDetails: {},
        labels: [],
        chainId: 1,
        accountBalance: 1,
      },
    ]
  );

const mockedGetCustodianToken = jest
  .fn()
  .mockReturnValue('testJWT');

jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    getCustodianConnectRequest: mockedReturnedValue,
    getCustodianToken: mockedGetCustodianToken,
    getCustodianAccounts: mockedGetCustodianAccounts,
    getCustodianAccountsByAddress: mockedReturnedValue,
    getCustodianJWTList: async () => ['jwt1'],
    connectCustodyAddresses: mockedReturnedValue,
  }),
}));

describe('CustodyPage', function () {
  const mockStore = {
    metamask: {
      provider: { chainId: 0x1, type: 'test' },
      mmiConfiguration: {
        portfolio: {
          enabled: true,
          url: "https://portfolio.io",
        },
        custodians: [
          {
            type: "Saturn",
            name: "saturn",
            apiUrl: "https://saturn-custody.dev.metamask-institutional.io",
            iconUrl: "https://saturn-custody-ui.dev.metamask-institutional.io/saturn.svg",
            displayName: "Saturn Custody",
            production: true,
            refreshTokenUrl: null,
            isNoteToTraderSupported: false,
            version: 1,
          },
        ],
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      appState: {
        isLoading: false,
      },
      history: {
        mostRecentOverviewPage: '/',
      },
    },
  };

  const store = configureMockStore()(mockStore);

  // const props = {
  //   connectCustodyAddresses: sinon.spy(),
  //   getCustodianAccounts: sinon.stub().callsFake(() => [
  //     {
  //       address: '0xAddress',
  //       name: 'name',
  //       custodianDetails: {},
  //       labels: [],
  //       chainId: 1,
  //       accountBalance: 1,
  //     },
  //   ]),
  //   getCustodianAccountsByAddress: sinon.spy(),
  //   getCustodianToken: sinon.stub().callsFake(() => 'testJWT'),
  //   getCustodianJWTList: async () => ['jwt1'],
  //   provider: { chainId: 0x1 },
  //   history: {
  //     push: sinon.spy(),
  //   },
  //   mostRecentOverviewPage: 'test',
  //   custodians: [
  //     {
  //       production: true,
  //       name: 'name',
  //       type: 'type',
  //       iconUrl: 'iconUrl',
  //       displayName: 'displayName',
  //     },
  //   ],
  // };

  let clock;
  const subscribeSpy = sinon.spy();

  beforeEach(() => {
    clock = sinon.useFakeTimers(1);
  });

  afterEach(() => {
    subscribeSpy.resetHistory();
    clock.restore();
  });

  it('opens connect custody without any custody selected', async () => {
    const { getByTestId } = renderWithProvider(
      <CustodyPage />,
      store,
    );

    await waitFor(() => {
      expect(getByTestId('custody-connect-button')).toBeDefined();
    });
  });

  it.skip('call getCustodianJwtList on custody select and shows account list on connect click', async () => {
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

  it.skip('shows the empty accounts list when all custodian accounts are already added', async () => {
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

  it.skip('shows the accounts list after the jwt token form', async () => {
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

  it.skip('calls getCustodianAccounts on network change', async () => {
    wrapper.find('CustodySubview').props().provider = { chainId: 2 };
    wrapper.update();
    wrapper.find('CustodySubview').instance().handleNetworkChange();
    expect(props.getCustodianAccounts.called).toBeTruthy();
  });

  it.skip('calls getCustodianAccounts while trying to connect when connectRequest is provided', () => {
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
