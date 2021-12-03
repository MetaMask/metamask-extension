import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import { GAS_ESTIMATE_TYPES } from '../../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockEstimates from '../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../test/data/mock-state.json';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';
import configureStore from '../../../../store/store';

import { AdvanceGasFeePopoverContextProvider } from '../context';
import AdvancedGasFeeGasLimit from './advanced-gas-fee-gas-limit';

jest.mock('../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
}));

const render = (txProps) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      accounts: {
        [mockState.metamask.selectedAddress]: {
          address: mockState.metamask.selectedAddress,
          balance: '0x1F4',
        },
      },
      advancedGasFee: { priorityFee: 100 },
      featureFlags: { advancedInlineGas: true },
      gasFeeEstimates:
        mockEstimates[GAS_ESTIMATE_TYPES.FEE_MARKET].gasFeeEstimates,
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider
      transaction={{
        userFeeLevel: 'custom',
        txParams: { gas: '0x5208' },
        ...txProps,
      }}
    >
      <AdvanceGasFeePopoverContextProvider>
        <AdvancedGasFeeGasLimit />
      </AdvanceGasFeePopoverContextProvider>
    </GasFeeContextProvider>,
    store,
  );
};

describe('AdvancedGasFeeGasLimit', () => {
  it('should show GasLimit from transaction', () => {
    render();
    expect(screen.getByText('21000')).toBeInTheDocument();
  });

  it('should show input when edit link is clicked', () => {
    render();
    expect(document.getElementsByTagName('input')).toHaveLength(0);
    fireEvent.click(screen.queryByText('Edit'));
    expect(document.getElementsByTagName('input')[0]).toHaveValue(21000);
  });
});
