import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { act } from '@testing-library/react';
import * as Actions from '../../../store/actions';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { setBackgroundConnection } from '../../../store/background-connection';
import mockState from '../../../../test/data/mock-state.json';
import {
  CONFIRM_SEND_ETHER_PATH,
  CONFIRM_TRANSACTION_ROUTE,
} from '../../../helpers/constants/routes';

import ConfirmTransaction from './confirm-transaction.component';

jest.mock('../components/simulation-details/useSimulationMetrics');

const middleware = [thunk];

setBackgroundConnection({
  getGasFeeTimeEstimate: jest.fn(),
  gasFeeStartPollingByNetworkClientId: jest.fn(),
  gasFeeStopPollingByPollingToken: jest.fn(),
  promisifiedBackground: jest.fn(),
  tryReverseResolveAddress: jest.fn(),
  getNextNonce: jest.fn(),
  addKnownMethodData: jest.fn(),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
  getLastInteractedConfirmationInfo: jest.fn(),
});

describe('Confirm Transaction', () => {
  const unapprovedTransactionId = Object.keys(
    mockState.metamask.transactions,
  )[0];
  it('should render correct information for approve transaction with value', async () => {
    jest
      .spyOn(Actions, 'gasFeeStartPollingByNetworkClientId')
      .mockResolvedValue(null);
    const store = configureMockStore(middleware)({
      ...mockState,
      confirmTransaction: {
        txData: mockState.metamask.transactions[0],
      },
    });
    let result;

    await act(
      async () =>
        (result = renderWithProvider(
          <ConfirmTransaction actionKey="confirm" />,
          store,
          `${CONFIRM_TRANSACTION_ROUTE}/${unapprovedTransactionId}${CONFIRM_SEND_ETHER_PATH}`,
        )),
    );

    expect(result.getByText('Ledger Hardware 2')).toBeInTheDocument();
    expect(result.getByRole('button', { name: 'Details' })).toBeInTheDocument();
    expect(result.getByRole('button', { name: 'Hex' })).toBeInTheDocument();
  });
});
