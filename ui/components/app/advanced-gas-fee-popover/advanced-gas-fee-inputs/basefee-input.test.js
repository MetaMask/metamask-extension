import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import { GAS_ESTIMATE_TYPES } from '../../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockEstimates from '../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../test/data/mock-state.json';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';
import configureStore from '../../../../store/store';

import { AdvanceGasFeePopoverContextProvider } from '../context';
import BasefeeInput from './basefee-input';

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
      advancedGasFee: { maxBaseFee: 2 },
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
        <BasefeeInput />
      </AdvanceGasFeePopoverContextProvider>
    </GasFeeContextProvider>,
    store,
  );
};

describe('BasefeeInput', () => {
  it('should renders advancedGasFee.baseFee value if current estimate used is not custom', () => {
    render({
      userFeeLevel: 'high',
    });
    expect(document.getElementsByTagName('input')[0]).toHaveValue(2);
  });

  it('should renders baseFee values from transaction if current estimate used is custom', () => {
    render({
      txParams: {
        maxFeePerGas: '0x174876E800',
      },
    });
    expect(document.getElementsByTagName('input')[0]).toHaveValue(2);
  });

  it('should show GWEI value in input when Edit in GWEI link is clicked', () => {
    render({
      txParams: {
        maxFeePerGas: '0x174876E800',
      },
    });
    fireEvent.click(screen.queryByText('Edit in GWEI'));
    expect(document.getElementsByTagName('input')[0]).toHaveValue(100);
  });

  it('should correctly update GWEI value if multiplier is changed', () => {
    render({
      txParams: {
        maxFeePerGas: '0x174876E800',
      },
    });
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 4 },
    });
    fireEvent.click(screen.queryByText('Edit in GWEI'));
    expect(document.getElementsByTagName('input')[0]).toHaveValue(200);
  });

  it('should correctly update multiplier value if GWEI is changed', () => {
    render({
      txParams: {
        maxFeePerGas: '0x174876E800',
      },
    });
    expect(document.getElementsByTagName('input')[0]).toHaveValue(2);
    fireEvent.click(screen.queryByText('Edit in GWEI'));
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 200 },
    });
    fireEvent.click(screen.queryByText('Edit in multiplier'));
    expect(document.getElementsByTagName('input')[0]).toHaveValue(4);
  });

  it('should show current value of estimatedBaseFee in subtext', () => {
    render({
      txParams: {
        maxFeePerGas: '0x174876E800',
      },
    });
    expect(screen.queryByText('50')).toBeInTheDocument();
  });
});
