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

const createMockStateWithAccount = (account) => ({
  metamask: {
    internalAccounts: {
      accounts: {
        [TEST_ACCOUNT_ID]: account,
      },
      selectedAccount: TEST_ACCOUNT_ID,
    },
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
});
