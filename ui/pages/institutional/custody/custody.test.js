import React from 'react';
import sinon from 'sinon';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor, act, screen } from '@testing-library/react';
import thunk from 'redux-thunk'
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import CustodyPage from '.';

const mockedReturnedValue = jest.fn().mockReturnValue({ type: 'TYPE' });

const mockedGetCustodianAccounts = jest.fn().mockReturnValue([
  {
    address: '0xAddress',
    name: 'name',
    custodianDetails: {},
    labels: [],
    chainId: 1,
    accountBalance: 1,
  },
]);

const mockedGetCustodianToken = jest.fn().mockReturnValue('testJWT');

const mockedGetCustodianJWTList = jest.fn().mockReturnValue({ type: 'TYPE', result: ['jwt1'] });

const mockedGetCustodianConnectRequest = jest.fn().mockReturnValue({
  type: 'TYPE',
  custodian: 'saturn',
  token: 'token',
  apiUrl: 'url',
  custodianType: 'JSON-RPC',
  custodianName: 'Saturn',
});

jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    getCustodianConnectRequest: mockedGetCustodianConnectRequest,
    getCustodianToken: mockedGetCustodianToken,
    getCustodianAccounts: mockedGetCustodianAccounts,
    getCustodianAccountsByAddress: mockedReturnedValue,
    getCustodianJWTList: mockedGetCustodianJWTList,
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
          url: 'https://portfolio.io',
        },
        custodians: [
          {
            type: 'Saturn',
            name: 'saturn',
            apiUrl: 'https://saturn-custody.dev.metamask-institutional.io',
            iconUrl:
              'https://saturn-custody-ui.dev.metamask-institutional.io/saturn.svg',
            displayName: 'Saturn Custody',
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

  const store = configureMockStore([thunk])(mockStore);

  let clock;
  const subscribeSpy = sinon.spy();

  beforeEach(() => {
    clock = sinon.useFakeTimers(1);
  });

  afterEach(() => {
    subscribeSpy.resetHistory();
    clock.restore();
  });

  it('renders CustodyPage', async () => {
    const { container } = renderWithProvider(<CustodyPage />, store);

    await waitFor(() => {
      expect(container).toMatchSnapshot();
    });
  });

  it('opens connect custody without any custody selected', async () => {
    const { getByTestId } = renderWithProvider(<CustodyPage />, store);

    await waitFor(() => {
      expect(getByTestId('custody-connect-button')).toBeDefined();
    });
  });

  it('calls getCustodianJwtList on custody select when connect btn is click', async () => {
    const { getByTestId } = renderWithProvider(<CustodyPage />, store);

    const custodyBtn = getByTestId('custody-connect-button');
    await waitFor(() => {
      fireEvent.click(custodyBtn);
    });

    await waitFor(() => {
      expect(mockedGetCustodianJWTList).toHaveBeenCalled();
    });
  });

  it('clicks connect button and shows the jwt form', async () => {
    const { getByTestId } = renderWithProvider(<CustodyPage />, store);
    const custodyBtn = getByTestId('custody-connect-button');

    await waitFor(() => {
      fireEvent.click(custodyBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('jwt-form-connect-button')).toBeInTheDocument();
    });
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
});
