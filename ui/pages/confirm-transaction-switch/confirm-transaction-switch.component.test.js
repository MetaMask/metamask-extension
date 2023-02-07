import { render } from '@testing-library/react';
import React from 'react';
import {
  CONFIRM_APPROVE_PATH,
  CONFIRM_SEND_ETHER_PATH,
  CONFIRM_TRANSACTION_ROUTE,
} from '../../helpers/constants/routes';
import TRANSACTIONS from '../../../test/mocks/transactions';
import ConfirmTransactionSwitch from './confirm-transaction-switch.component';

jest.mock('react-router-dom', () => {
  return {
    Redirect: jest.fn(({ to }) => `Redirected to ${to.pathname}`),
  };
});

describe('Confirm Transaction Switch', () => {
  it('should redirect to /confirm-approve for approve', () => {
    const { getByText } = render(
      <ConfirmTransactionSwitch txData={TRANSACTIONS.APPROVE} />,
    );
    expect(
      getByText(
        `Redirected to ${CONFIRM_TRANSACTION_ROUTE}/${TRANSACTIONS.APPROVE.id}${CONFIRM_APPROVE_PATH}`,
      ),
    ).toBeInTheDocument();
  });

  it('should redirect to /send-ether for approve with value', () => {
    const { getByText } = render(
      <ConfirmTransactionSwitch txData={TRANSACTIONS.SEND_WITH_APPROVE} />,
    );
    expect(
      getByText(
        `Redirected to ${CONFIRM_TRANSACTION_ROUTE}/${TRANSACTIONS.SEND_WITH_APPROVE.id}${CONFIRM_SEND_ETHER_PATH}`,
      ),
    ).toBeInTheDocument();
  });
});
