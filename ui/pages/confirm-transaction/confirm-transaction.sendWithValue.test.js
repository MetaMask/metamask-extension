import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { act, fireEvent } from '@testing-library/react';

import { renderWithProvider } from '../../../test/lib/render-helpers';
import { setBackgroundConnection } from '../../../test/jest';
import mockState from '../../../test/data/mock-state.json';
import TRANSACTIONS from '../../../test/mocks/transactions';
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
  it('should render correct information for approve transaction with value', () => {
    const sendWithApproveTransaction = TRANSACTIONS.SEND_WITH_APPROVE;
    const store = configureMockStore(middleware)({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        unapprovedTxs: {
          [`${sendWithApproveTransaction.id}`]: sendWithApproveTransaction,
        },
      },
      confirmTransaction: {
        txData: sendWithApproveTransaction,
      },
    });
    const { getByText, getByTitle, getByRole, getAllByText } =
      renderWithProvider(
        <ConfirmTransaction
          actionKey="confirm"
          tokenAddress={sendWithApproveTransaction.txParams.to}
          isSendWithApproval
        />,
        store,
        `${CONFIRM_TRANSACTION_ROUTE}/${sendWithApproveTransaction.id}${CONFIRM_SEND_ETHER_PATH}`,
      );
    const contractAddressShortened = '0x85c...D65e';
    expect(getAllByText('Approve')).toHaveLength(1);
    expect(getAllByText(contractAddressShortened)).toHaveLength(2);
    expect(getByTitle('0.0001 ETH')).toBeInTheDocument();

    act(() => {
      const dataTabButton = getByRole('button', { name: 'Data' });
      fireEvent.click(dataTabButton);
    });
    expect(getAllByText('Approve')).toHaveLength(2);
    act(() => {
      const hexTabButton = getByRole('button', { name: 'Hex' });
      fireEvent.click(hexTabButton);
    });
    expect(
      getByText(sendWithApproveTransaction.txParams.data),
    ).toBeInTheDocument();
    expect(getAllByText('Approve')).toHaveLength(2);
  });
});
