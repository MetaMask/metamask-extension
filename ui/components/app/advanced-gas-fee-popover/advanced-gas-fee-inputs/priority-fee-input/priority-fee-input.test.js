import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import { GAS_ESTIMATE_TYPES } from '../../../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import mockEstimates from '../../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../../test/data/mock-state.json';
import { GasFeeContextProvider } from '../../../../../contexts/gasFee';
import configureStore from '../../../../../store/store';

import { AdvanceGasFeePopoverContextProvider } from '../../context';
import PriorityfeeInput from './priority-fee-input';

jest.mock('../../../../../store/actions', () => ({
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
        ...txProps,
      }}
    >
      <AdvanceGasFeePopoverContextProvider>
        <PriorityfeeInput />
      </AdvanceGasFeePopoverContextProvider>
    </GasFeeContextProvider>,
    store,
  );
};

describe('PriorityfeeInput', () => {
  it('should renders advancedGasFee.priorityfee value if current estimate used is not custom', () => {
    render({
      userFeeLevel: 'high',
    });
    expect(document.getElementsByTagName('input')[0]).toHaveValue(100);
  });

  it('should renders priorityfee value from transaction if current estimate used is custom', () => {
    render({
      txParams: {
        maxPriorityFeePerGas: '0x12A05F200',
      },
    });
    expect(document.getElementsByTagName('input')[0]).toHaveValue(5);
  });

  it('should show error if value is 0', () => {
    render({
      txParams: {
        maxPriorityFeePerGas: '0x12A05F200',
      },
    });
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 0 },
    });
    expect(
      screen.queryByText('Priority fee must be at least 1 GWEI'),
    ).toBeInTheDocument();
  });

  it('should show error if value is less than suggested low fee estimate', () => {
    render({
      txParams: {
        maxPriorityFeePerGas: '0x12A05F200',
      },
    });
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 2 },
    });
    expect(
      screen.queryByText('Priority fee is low for current network conditions'),
    ).toBeInTheDocument();
  });

  it('should show error if value is greater than suggested high fee estimate', () => {
    render({
      txParams: {
        maxPriorityFeePerGas: '0x12A05F200',
      },
    });
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 20 },
    });
    expect(
      screen.queryByText(
        'Priority fee is higher than necessary. You may pay more than needed',
      ),
    ).toBeInTheDocument();
  });
});
