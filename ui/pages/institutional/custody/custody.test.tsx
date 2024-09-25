import React from 'react';
import { Dispatch } from 'redux';
import configureMockStore from 'redux-mock-store';
import { fireEvent, waitFor, screen, act } from '@testing-library/react';
import thunk from 'redux-thunk';
import Fuse from 'fuse.js';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { mockNetworkState } from '../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { Account } from './custody';
import CustodyPage from '.';

const mockedConnectCustodyAddresses = jest
  .fn()
  .mockReturnValue({ type: 'TYPE' });
const mockedGetCustodianJWTList = jest
  .fn()
  .mockImplementation(() => async (dispatch: Dispatch) => {
    const jwtList = ['jwt1', 'jwt2', 'jwt3'];
    dispatch({ type: 'TYPE', payload: jwtList });
    return jwtList;
  });

const mockedGetCustodianAccounts = jest.fn().mockReturnValue({ type: 'TYPE' });
const mockedGetCustodianToken = jest.fn().mockReturnValue('testJWT');

jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    getCustodianToken: mockedGetCustodianToken,
    getCustodianAccounts: mockedGetCustodianAccounts,
    getCustodianJWTList: mockedGetCustodianJWTList,
    connectCustodyAddresses: mockedConnectCustodyAddresses,
  }),
}));

jest.mock('fuse.js', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        search: jest.fn().mockReturnValue([
          {
            name: 'Saturn Test A',
            address: '0x123',
          },
        ]),
        setCollection: jest.fn(),
        list: [],
      };
    }),
  };
});

type MockedFuseType = jest.MockedClass<typeof Fuse>;
const MockedFuse = Fuse as unknown as MockedFuseType;

describe('CustodyPage', function () {
  const mockStore = {
    metamask: {
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      institutionalFeatures: {
        connectRequests: [],
      },
      mmiConfiguration: {
        portfolio: {
          enabled: true,
          url: 'https://portfolio.io',
        },
        custodians: [
          {
            type: 'GK8',
            envName: 'gk8-prod',
            name: 'GK8',
            iconUrl:
              'https://saturn-custody-ui.dev.metamask-institutional.io/saturn.svg',
            displayName: 'gk8',
            production: true,
            refreshTokenUrl: null,
            isNoteToTraderSupported: false,
            isManualTokenInputSupported: true,
            isQRCodeSupported: false,
            version: 1,
            website: 'test website',
          },
          {
            type: 'Saturn B',
            envName: 'saturn-prod',
            name: 'Saturn Custody B',
            iconUrl:
              'https://saturn-custody-ui.dev.metamask-institutional.io/saturn.svg',
            displayName: 'Saturn Custody B',
            production: true,
            refreshTokenUrl: null,
            isNoteToTraderSupported: false,
            isManualTokenInputSupported: false,
            isQRCodeSupported: false,
            version: 1,
            website: 'test website',
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
      internalAccounts: {
        accounts: {
          '694225f4-d30b-4e77-a900-c8bbce735b42': {
            address: '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
            id: '694225f4-d30b-4e77-a900-c8bbce735b42',
            metadata: {
              name: 'Custody 1',
              keyring: {
                type: 'Custody test',
              },
            },
            options: {},
            methods: [
              'personal_sign',
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
          },
          '2d4193b2-e10d-412c-ae33-c0b689e6ddd8': {
            address: '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
            id: '2d4193b2-e10d-412c-ae33-c0b689e6ddd8',
            metadata: {
              name: 'Custody 2',
              keyring: {
                type: 'Custody test',
              },
            },
            options: {},
            methods: [
              'personal_sign',
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
          },
          '434621b7-23e6-4568-962d-b576a5e2ec43': {
            address: '0xca8f1F0245530118D0cf14a06b01Daf8f76Cf281',
            id: '434621b7-23e6-4568-962d-b576a5e2ec43',
            metadata: {
              name: 'Custody 3',
              keyring: {
                type: 'Custody test',
              },
            },
            options: {},
            methods: [
              'personal_sign',
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
          },
        },
        selectedAccount: '694225f4-d30b-4e77-a900-c8bbce735b42',
      },
    },
  };

  const store = configureMockStore([thunk])(mockStore);

  it('renders the list of custodians in mmiController when there is no accounts from connectRequest', async () => {
    act(() => {
      renderWithProvider(<CustodyPage />, store);
    });

    await waitFor(() => {
      const connectCustodyBtn = screen.getAllByTestId('custody-connect-button');
      expect(connectCustodyBtn[0]).toBeDefined();
    });
  });

  it('renders jwt token list when there is no accounts and custodian is selected from the list of custodians in mmiController', async () => {
    act(() => {
      renderWithProvider(<CustodyPage />, store);
    });

    await waitFor(() => {
      const custodyBtns = screen.getAllByTestId('custody-connect-button');
      fireEvent.click(custodyBtns[0]);
    });

    expect(screen.getByTestId('jwt-form-connect-button')).toBeInTheDocument();
    expect(mockedGetCustodianJWTList).toHaveBeenCalled();
  });

  it('renders jwt token list when first custodian is selected, showing the jwt form and testing the sorting function', async () => {
    const newMockStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        mmiConfiguration: {
          ...mockStore.metamask.mmiConfiguration,
          custodians: [
            {
              ...mockStore.metamask.mmiConfiguration.custodians[0],
              envName: 'Saturn Custody B',
              displayName: 'Saturn Custody B',
              website: 'test website',
            },
            {
              ...mockStore.metamask.mmiConfiguration.custodians[1],
              envName: 'Saturn Custody A',
              displayName: 'Saturn Custody A',
              website: 'test website',
            },
            {
              ...mockStore.metamask.mmiConfiguration.custodians[2],
              envName: 'Saturn Custody C',
              displayName: 'Saturn Custody C',
              website: 'test website',
            },
          ],
        },
      },
    };

    const newStore = configureMockStore([thunk])(newMockStore);

    await act(async () => {
      renderWithProvider(<CustodyPage />, newStore);
    });

    await waitFor(() => {
      // Saturn Custody A will be the first one to appear
      const saturnCustodyA = screen.getByText('Saturn Custody A');
      const parentContainer = saturnCustodyA.closest('ul');
      expect(parentContainer).toMatchSnapshot();
    });
  });

  it('renders PulseLoader when loading state is true', async () => {
    mockedGetCustodianToken.mockImplementation(
      () => new Promise((resolve) => resolve(null)),
    );
    mockedGetCustodianAccounts.mockImplementation(
      () => new Promise((resolve) => resolve(null)),
    );

    await act(async () => {
      renderWithProvider(<CustodyPage />, store);
      expect(screen.getByTestId('pulse-loader')).toBeDefined();
    });
  });

  it('renders custody accounts list when I have accounts from connectRequest', async () => {
    mockedGetCustodianAccounts.mockImplementation(
      () => async (dispatch: Dispatch) => {
        const accounts = [
          {
            name: 'Saturn Test Name',
            address: '0x123',
            balance: '0x1',
            custodianDetails: 'custodianDetails',
            labels: [{ key: 'key', value: 'testLabels' }],
            chanId: 'chanId',
          },
        ];
        dispatch({ type: 'TYPE', payload: accounts });
        return accounts;
      },
    );

    const newMockStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        institutionalFeatures: {
          connectRequests: [
            {
              token: 'token',
              environment: 'Saturn A',
              service: 'Saturn A',
            },
          ],
        },
      },
    };

    const newStore = configureMockStore([thunk])(newMockStore);

    await act(async () => {
      renderWithProvider(<CustodyPage />, newStore);
    });

    await waitFor(() => {
      expect(
        screen.getByTestId('select-all-accounts-selected-false'),
      ).toBeDefined();
      expect(screen.getByText('0x123')).toBeDefined();
      expect(screen.getByText('testLabels')).toBeDefined();
      expect(screen.getByText('Saturn Test Name')).toBeDefined();
    });
  });

  it('renders custodian list, initiates connect custodian, displays jwt token list, clicks connect button, and finally shows "no accounts available" message', async () => {
    mockedGetCustodianAccounts.mockImplementation(
      () => async (dispatch: Dispatch) => {
        const accounts: Account[] = [];
        dispatch({ type: 'TYPE', payload: accounts });
        return accounts;
      },
    );

    act(() => {
      renderWithProvider(<CustodyPage />, store);
    });

    await waitFor(() => {
      const custodyBtns = screen.getAllByTestId('custody-connect-button');
      fireEvent.click(custodyBtns[0]);
    });

    await waitFor(() => {
      const connectBtn = screen.getByTestId('jwt-form-connect-button');
      fireEvent.click(connectBtn);
    });

    expect(screen.getByTestId('custody-accounts-empty')).toBeDefined();
  });

  it('renders the list of custodians when the user clicks on cancel button', async () => {
    const newMockStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        institutionalFeatures: {
          connectRequests: [],
        },
      },
    };

    const newStore = configureMockStore([thunk])(newMockStore);

    await act(async () => {
      renderWithProvider(<CustodyPage />, newStore);
    });

    await waitFor(() => {
      const custodyBtns = screen.getAllByTestId('custody-connect-button');
      fireEvent.click(custodyBtns[0]);
    });

    await act(async () => {
      const custodyCancelBtn = screen.getAllByTestId('custody-cancel-button');
      fireEvent.click(custodyCancelBtn[0]);
    });

    expect(screen.getByTestId('connect-custodial-account')).toBeDefined();
  });

  it('should select all accounts when "Select All Accounts" checkbox is clicked', async () => {
    // Mock the accounts
    const accounts = [
      {
        name: 'Saturn Test Name',
        address: '0x123',
        balance: '0x1',
        custodianDetails: 'custodianDetails',
        labels: [{ key: 'key', value: 'testLabels' }],
        chanId: 'chanId',
      },
    ];

    mockedGetCustodianAccounts.mockImplementation(
      () => async (dispatch: Dispatch) => {
        dispatch({ type: 'TYPE', payload: accounts });
        return accounts;
      },
    );

    const newMockStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        institutionalFeatures: {
          connectRequests: [
            {
              token: 'token',
              environment: 'Saturn A',
              service: 'Saturn A',
            },
          ],
        },
      },
    };

    const newStore = configureMockStore([thunk])(newMockStore);

    await act(async () => {
      renderWithProvider(<CustodyPage />, newStore);
    });

    act(() => {
      const checkbox = screen.getByTestId('select-all-accounts-selected-false');
      fireEvent.click(checkbox);
    });

    expect(
      screen.getByTestId('select-all-accounts-selected-true'),
    ).toBeChecked();
  });

  it('handles connection errors correctly', async () => {
    mockedGetCustodianAccounts.mockImplementation(
      () => async (dispatch: Dispatch) => {
        dispatch({ type: 'TYPE', payload: [] });
        throw new Error('Test Error');
      },
    );

    const newMockStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        institutionalFeatures: {
          connectRequests: [
            {
              token: 'token',
              environment: 'Saturn A',
              service: 'Saturn A',
            },
          ],
        },
      },
    };

    const newStore = configureMockStore([thunk])(newMockStore);

    await act(async () => {
      renderWithProvider(<CustodyPage />, newStore);
    });

    await waitFor(() => {
      expect(screen.getByTestId('connect-error')).toBeDefined();
      expect(screen.getByTestId('connect-error')).toHaveTextContent(
        'Test Error',
      );
    });
  });

  it('handles authentication errors correctly', async () => {
    mockedGetCustodianAccounts.mockImplementation(
      () => async (dispatch: Dispatch) => {
        dispatch({ type: 'TYPE', payload: [] });
        throw new Error('401: Unauthorized');
      },
    );

    const newMockStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        institutionalFeatures: {
          connectRequests: [
            {
              token: 'token',
              environment: 'Saturn A',
              service: 'Saturn A',
            },
          ],
        },
      },
    };

    const newStore = configureMockStore([thunk])(newMockStore);

    await act(async () => {
      renderWithProvider(<CustodyPage />, newStore);
    });

    await waitFor(() => {
      expect(screen.getByTestId('connect-error')).toBeDefined();
      expect(screen.getByTestId('connect-error')).toHaveTextContent(
        'Authentication error. Please ensure you have entered the correct token',
      );
    });
  });

  it('does open confirm Connect Custodian modal when custodian display name is not gk8', async () => {
    const newMockStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        mmiConfiguration: {
          ...mockStore.metamask.mmiConfiguration,
          custodians: [
            {
              ...mockStore.metamask.mmiConfiguration.custodians[0],
              displayName: 'Saturn Custody B',
              isManualTokenInputSupported: false,
              isQRCodeSupported: false,
            },
          ],
        },
      },
    };

    const newStore = configureMockStore([thunk])(newMockStore);

    act(() => {
      renderWithProvider(<CustodyPage />, newStore);
    });

    await waitFor(() => {
      const custodyBtns = screen.getAllByTestId('custody-connect-button');
      fireEvent.click(custodyBtns[0]);
    });

    expect(
      screen.queryByTestId('confirm-connect-custodian-modal'),
    ).toBeInTheDocument();
  });

  it('filters accounts based on search query', async () => {
    const accounts = [
      {
        name: 'Saturn Test A',
        address: '0x123',
        balance: '0x1',
        custodianDetails: 'custodianDetails',
        labels: [{ key: 'key', value: 'testLabels' }],
        chanId: 'chanId',
      },
      {
        name: 'Saturn Test B',
        address: '0x1234',
        balance: '0x1',
        custodianDetails: 'custodianDetails',
        labels: [{ key: 'key', value: 'testLabels' }],
        chanId: 'chanId',
      },
    ];

    mockedGetCustodianAccounts.mockImplementation(
      () => async (dispatch: Dispatch) => {
        dispatch({ type: 'TYPE', payload: accounts });
        return accounts;
      },
    );

    MockedFuse.mockImplementation(() => ({
      search: jest.fn().mockReturnValue([
        {
          name: 'Saturn Test A',
          address: '0x123',
        },
      ]),
      setCollection: jest.fn(),
      list: [],
    }));

    const newMockStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        institutionalFeatures: {
          connectRequests: [
            {
              token: 'token',
              environment: 'Saturn A',
              service: 'Saturn A',
            },
          ],
        },
      },
    };

    const newStore = configureMockStore([thunk])(newMockStore);

    await act(async () => {
      renderWithProvider(<CustodyPage />, newStore);
    });

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Search accounts'),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Search accounts'), {
      target: { value: 'Saturn Test A' },
    });

    expect(Fuse).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        keys: ['name', 'address'],
        tokenize: true,
        matchAllTokens: true,
        threshold: 0.0,
      }),
    );

    expect(screen.getByText('Saturn Test A')).toBeDefined();
  });
});
