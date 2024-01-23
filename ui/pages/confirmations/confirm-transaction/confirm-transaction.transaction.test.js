import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { renderWithProvider } from '../../../test/lib/render-helpers';
import { setBackgroundConnection } from '../../store/background-connection';
import mockState from '../../../test/data/mock-state.json';
import {
  CONFIRM_SEND_ETHER_PATH,
  CONFIRM_TRANSACTION_ROUTE,
} from '../../helpers/constants/routes';

import ConfirmTransaction from './confirm-transaction.component';

const middleware = [thunk];

setBackgroundConnection({
  getGasFeeTimeEstimate: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest.fn(),
  promisifiedBackground: jest.fn(),
  tryReverseResolveAddress: jest.fn(),
  getNextNonce: jest.fn(),
  addKnownMethodData: jest.fn(),
});

describe('Confirm Transaction', () => {
  const unapprovedTransactionId = Object.keys(
    mockState.metamask.transactions,
  )[0];
  it('should render correct information for approve transaction with value', () => {
    const store = configureMockStore(middleware)({
      ...mockState,
      confirmTransaction: {
        txData: mockState.metamask.transactions[0],
      },
    });
    const { getByText, getByRole } = renderWithProvider(
      <ConfirmTransaction actionKey="confirm" />,
      store,
      `${CONFIRM_TRANSACTION_ROUTE}/${unapprovedTransactionId}${CONFIRM_SEND_ETHER_PATH}`,
    );
    expect(getByText('0xb19Ac...f0c5e')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Details' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Hex' })).toBeInTheDocument();
  });
});
