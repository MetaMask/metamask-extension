import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import {
  TransactionStatus as EvmTransactionStatus,
  TransactionType as EvmTransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import configureStore from '../../store/store';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createMockUIMessenger } from '../../../test/lib/mock-ui-messenger';
import mockState from '../../../test/data/mock-state.json';
import { TransactionDetails } from './transaction-details';

jest.mock('../../hooks/activity/useApiTransaction', () => ({
  useApiTransaction: () => undefined,
}));

const MONEY_ACCOUNT_ADDRESS = '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2';
const PRIMARY_HD_KEYRING_ID = '01JKAF3DSGM3AB87EM9N0K41AJ';
const TX_HASH =
  '0x8586e162e456a23c1969573a4b79e77912705b474bc5aa0c2a63d56556623ab2';

function buildMoneyAccountTransaction(
  nestedType: EvmTransactionType,
): TransactionMeta {
  return {
    id: 'money-account-tx',
    chainId: '0x1',
    hash: TX_HASH,
    networkClientId: 'mainnet',
    status: EvmTransactionStatus.confirmed,
    time: 1,
    type: EvmTransactionType.batch,
    txParams: {
      from: MONEY_ACCOUNT_ADDRESS,
      to: MONEY_ACCOUNT_ADDRESS,
      nonce: '0x77',
      value: '0x0',
    },
    nestedTransactions: [
      { type: EvmTransactionType.tokenMethodApprove },
      { type: nestedType },
    ],
  } as TransactionMeta;
}

function buildStore(transaction: TransactionMeta) {
  const state = structuredClone(mockState) as unknown as {
    metamask: Record<string, unknown>;
  };
  state.metamask.transactions = [transaction];
  state.metamask.moneyAccounts = {
    'money-account-1': {
      address: MONEY_ACCOUNT_ADDRESS,
      options: { entropy: { id: PRIMARY_HD_KEYRING_ID } },
    },
  };
  return configureStore(state as never);
}

function renderDetails(transaction: TransactionMeta) {
  const getAvailability = jest
    .fn()
    .mockResolvedValue({ isAvailable: true, account: undefined });
  const uiMessenger = createMockUIMessenger({
    'MoneyAccountAvailabilityService:getAvailability': getAvailability,
  } as never);

  renderWithProvider(
    <TransactionDetails
      chainId="eip155:1"
      txIdentifier={TX_HASH}
      onBack={jest.fn()}
    />,
    buildStore(transaction),
    '/',
    undefined,
    undefined,
    uiMessenger,
  );
}

describe('TransactionDetails for money account transactions', () => {
  it.each([
    ['deposit', EvmTransactionType.moneyAccountDeposit, 'Deposited'],
    ['withdraw', EvmTransactionType.moneyAccountWithdraw, 'Sent'],
  ])(
    'renders a money account %s outside a route messenger context',
    async (_label, nestedType, title) => {
      renderDetails(buildMoneyAccountTransaction(nestedType));

      expect(screen.getByText(title)).toBeInTheDocument();
      await waitFor(() =>
        expect(
          screen.getByTestId('transaction-details-block-explorer'),
        ).toBeInTheDocument(),
      );
      expect(
        screen.queryByText("We couldn't load this page."),
      ).not.toBeInTheDocument();
    },
  );
});
