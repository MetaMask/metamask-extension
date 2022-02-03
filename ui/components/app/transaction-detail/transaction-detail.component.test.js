import React from 'react';
import { screen } from '@testing-library/react';

import { GAS_ESTIMATE_TYPES } from '../../../../shared/constants/gas';
import { TRANSACTION_ENVELOPE_TYPES } from '../../../../shared/constants/transaction';

import { GasFeeContextProvider } from '../../../contexts/gasFee';
import { renderWithProvider } from '../../../../test/jest';
import mockEstimates from '../../../../test/data/mock-estimates.json';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';

import TransactionDetail from './transaction-detail.component';

jest.mock('../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  createTransactionEventFragment: jest.fn(),
}));

const render = ({ componentProps, contextProps } = {}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      accounts: {
        [mockState.metamask.selectedAddress]: {
          address: mockState.metamask.selectedAddress,
          balance: '0x1F4',
        },
      },
      gasFeeEstimates: mockEstimates[GAS_ESTIMATE_TYPES.FEE_MARKET],
      eip1559V2Enabled: true,
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider {...contextProps}>
      <TransactionDetail
        onEdit={() => {
          console.log('on edit');
        }}
        rows={[]}
        userAcknowledgedGasMissing
        {...componentProps}
      />
    </GasFeeContextProvider>,
    store,
  );
};

describe('TransactionDetail', () => {
  it('should render edit link with text low if low gas estimates are selected', () => {
    render({ contextProps: { transaction: { userFeeLevel: 'low' } } });
    expect(screen.queryByText('🐢')).toBeInTheDocument();
    expect(screen.queryByText('Low')).toBeInTheDocument();
  });

  it('should render edit link with text edit for legacy transactions', () => {
    render({
      contextProps: {
        transaction: {
          userFeeLevel: 'low',
          txParams: { type: TRANSACTION_ENVELOPE_TYPES.LEGACY },
        },
      },
    });
    expect(screen.queryByText('🐢')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit')).toBeInTheDocument();
  });
});
