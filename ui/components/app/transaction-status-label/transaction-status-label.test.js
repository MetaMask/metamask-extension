import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { EthAccountType } from '@metamask/keyring-api';
import { TransactionStatus } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import TransactionStatusLabel from '.';

const TEST_ACCOUNT_ID = 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3';
const TEST_ACCOUNT_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

const createBasicAccount = (type = 'HD Key Tree') => ({
  address: TEST_ACCOUNT_ADDRESS,
  id: TEST_ACCOUNT_ID,
  metadata: {
    name: 'Test Account',
    keyring: {
      type,
    },
  },
  options: {},
  methods: ETH_EOA_METHODS,
  type: EthAccountType.Eoa,
});

const createCustodyAccount = () => ({
  ...createBasicAccount('Custody - JSONRPC'),
  metadata: {
    name: 'Account 1',
    keyring: {
      type: 'Custody - JSONRPC',
    },
  },
});

const createMockStateWithAccount = (account) => ({
  metamask: {
    custodyStatusMaps: {},
    internalAccounts: {
      accounts: {
        [TEST_ACCOUNT_ID]: account,
      },
      selectedAccount: TEST_ACCOUNT_ID,
    },
  },
});

const createCustodyMockState = (account) => ({
  metamask: {
    custodyStatusMaps: {
      saturn: {
        approved: {
          shortText: 'Short Text Test',
          longText: 'Long Text Test',
        },
      },
    },
    internalAccounts: {
      accounts: {
        [TEST_ACCOUNT_ID]: account,
      },
      selectedAccount: TEST_ACCOUNT_ID,
    },
    keyrings: [
      {
        type: 'Custody - JSONRPC',
        accounts: [TEST_ACCOUNT_ADDRESS],
      },
    ],
  },
});

const statusTestCases = [
  {
    name: 'CONFIRMED',
    props: { status: 'confirmed', date: 'June 1' },
  },
  {
    name: 'PENDING',
    props: {
      date: 'June 1',
      status: TransactionStatus.submitted,
      isEarliestNonce: true,
    },
  },
  {
    name: 'QUEUED',
    props: {
      status: TransactionStatus.submitted,
      isEarliestNonce: false,
    },
  },
  {
    name: 'UNAPPROVED',
    props: {
      status: TransactionStatus.unapproved,
    },
  },
  {
    name: 'SIGNING',
    props: {
      status: TransactionStatus.approved,
    },
  },
];

const errorTestCases = [
  {
    name: 'error message',
    props: {
      status: 'approved',
      custodyStatus: 'approved',
      error: { message: 'An error occurred' },
    },
    expectedText: 'Error',
  },
  {
    name: 'error with aborted custody status',
    props: {
      status: 'approved',
      custodyStatus: 'aborted',
      error: { message: 'An error occurred' },
      custodyStatusDisplayText: 'Test',
      shouldShowTooltip: true,
    },
    expectedText: 'Test',
  },
];

describe('TransactionStatusLabel Component', () => {
  const createMockStore = configureMockStore([thunk]);
  let store;

  beforeEach(() => {
    const basicAccount = createBasicAccount();
    const mockState = createMockStateWithAccount(basicAccount);
    store = createMockStore(mockState);
  });

  statusTestCases.forEach(({ name, props }) => {
    it(`renders ${name} properly and tooltip`, () => {
      const { container, queryByTestId } = renderWithProvider(
        <TransactionStatusLabel {...props} />,
        store,
      );
      expect(container).toMatchSnapshot();
      expect(queryByTestId('transaction-status-label')).not.toBeInTheDocument();
    });
  });

  it('renders pure text for status when shouldShowTooltip is specified as false', () => {
    const { queryByTestId } = renderWithProvider(
      <TransactionStatusLabel
        {...statusTestCases[0].props}
        shouldShowTooltip={false}
      />,
      store,
    );
    expect(queryByTestId('transaction-status-label')).toBeInTheDocument();
  });

  it('renders statusText properly when is custodyStatusDisplayText is defined', () => {
    const props = {
      custodyStatusDisplayText: 'test',
    };

    const { getByText } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(getByText(props.custodyStatusDisplayText)).toBeVisible();
  });

  it('displays correct text and tooltip', () => {
    const props = {
      status: 'approved',
      custodyStatus: 'approved',
      custodyStatusDisplayText: 'Test',
    };

    const custodyAccount = createCustodyAccount();
    const customMockStore = createCustodyMockState(custodyAccount);
    store = createMockStore(customMockStore);

    const { getByText } = renderWithProvider(
      <TransactionStatusLabel {...props} />,
      store,
    );

    expect(getByText(props.custodyStatusDisplayText)).toBeVisible();
  });

  errorTestCases.forEach(({ name, props, expectedText }) => {
    it(`displays correctly the ${name}`, () => {
      const custodyAccount = createCustodyAccount();
      const customMockStore = createCustodyMockState(custodyAccount);
      store = createMockStore(customMockStore);

      const { getByText } = renderWithProvider(
        <TransactionStatusLabel {...props} />,
        store,
      );

      expect(getByText(expectedText)).toBeVisible();
    });
  });
});
