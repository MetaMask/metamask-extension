import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import { TransactionStatus } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import TransactionStatusLabel from '.';

describe('TransactionStatusLabel Component', () => {
  const createMockStore = configureMockStore([thunk]);
  const mockState = {
    metamask: {
      custodyStatusMaps: {},
      internalAccounts: {
        accounts: {
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            metadata: {
              name: 'Test Account',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: [...Object.values(EthMethod)],
            type: EthAccountType.Eoa,
          },
        },
        selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      },
    },
  };

  let store = createMockStore(mockState);
  it('should render CONFIRMED properly', () => {
    const confirmedProps = {
      status: 'confirmed',
      date: 'June 1',
    };

    const { container } = renderWithProvider(
      <TransactionStatusLabel {...confirmedProps} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render PENDING properly', () => {
    const props = {
      date: 'June 1',
      status: TransactionStatus.submitted,
      isEarliestNonce: true,
    };

    const { container } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render QUEUED properly', () => {
    const props = {
      status: TransactionStatus.submitted,
      isEarliestNonce: false,
    };

    const { container } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render UNAPPROVED properly', () => {
    const props = {
      status: TransactionStatus.unapproved,
    };

    const { container } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render SIGNING if status is approved', () => {
    const props = {
      status: TransactionStatus.approved,
    };

    const { container } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render statusText properly when is custodyStatusDisplayText is defined', () => {
    const props = {
      custodyStatusDisplayText: 'test',
    };

    const { getByText } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(getByText(props.custodyStatusDisplayText)).toBeVisible();
  });

  it('should display the correct status text and tooltip', () => {
    const mockShortText = 'Short Text Test';
    const mockLongText = 'Long Text Test';
    const props = {
      status: 'approved',
      custodyStatus: 'approved',
      custodyStatusDisplayText: 'Test',
    };
    const customMockStore = {
      metamask: {
        custodyStatusMaps: {
          jupiter: {
            approved: {
              shortText: mockShortText,
              longText: mockLongText,
            },
          },
        },
        internalAccounts: {
          accounts: {
            'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
              address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
              id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
              metadata: {
                name: 'Account 1',
                keyring: {
                  type: 'Custody - Jupiter',
                },
              },
              options: {},
              methods: [...Object.values(EthMethod)],
              type: EthAccountType.Eoa,
            },
          },
          selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        },
        keyrings: [
          {
            type: 'Custody - Jupiter',
            accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
          },
        ],
      },
    };

    store = createMockStore(customMockStore);

    const { getByText } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(getByText(props.custodyStatusDisplayText)).toBeVisible();
  });
  it('should display the error message when there is an error', () => {
    const mockShortText = 'Short Text Test';
    const mockLongText = 'Long Text Test';
    const props = {
      status: 'approved',
      custodyStatus: 'approved',
      error: { message: 'An error occurred' },
    };
    const customMockStore = {
      metamask: {
        custodyStatusMaps: {
          jupiter: {
            approved: {
              shortText: mockShortText,
              longText: mockLongText,
            },
          },
        },
        internalAccounts: {
          accounts: {
            'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
              address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
              id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
              metadata: {
                name: 'Account 1',
                keyring: {
                  type: 'Custody - Jupiter',
                },
              },
              options: {},
              methods: [...Object.values(EthMethod)],
              type: EthAccountType.Eoa,
            },
          },
          selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        },
        keyrings: [
          {
            type: 'Custody - Jupiter',
            accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
          },
        ],
      },
    };

    store = createMockStore(customMockStore);

    const { getByText } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(getByText('Error')).toBeVisible();
  });

  it('should display correctly the error message when there is an error and custodyStatus is aborted', () => {
    const mockShortText = 'Short Text Test';
    const mockLongText = 'Long Text Test';
    const props = {
      status: 'approved',
      custodyStatus: 'aborted',
      error: { message: 'An error occurred' },
      custodyStatusDisplayText: 'Test',
    };
    const customMockStore = {
      metamask: {
        custodyStatusMaps: {
          jupiter: {
            approved: {
              shortText: mockShortText,
              longText: mockLongText,
            },
          },
        },
        internalAccounts: {
          accounts: {
            'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
              address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
              id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
              metadata: {
                name: 'Account 1',
                keyring: {
                  type: 'Custody - Jupiter',
                },
              },
              options: {},
              methods: [...Object.values(EthMethod)],
              type: EthAccountType.Eoa,
            },
          },
          selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        },
        keyrings: [
          {
            type: 'Custody - Jupiter',
            accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
          },
        ],
      },
    };

    store = createMockStore(customMockStore);

    const { getByText } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(getByText(props.custodyStatusDisplayText)).toBeVisible();
  });
});
