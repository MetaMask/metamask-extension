import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import { GAS_ESTIMATE_TYPES } from '../../../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import mockEstimates from '../../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../../test/data/mock-state.json';
import { GasFeeContextProvider } from '../../../../../contexts/gasFee';
import configureStore from '../../../../../store/store';

import { AdvancedGasFeePopoverContextProvider } from '../../context';
import PriorityfeeInput from './priority-fee-input';

jest.mock('../../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
}));

const render = (storeProps) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      ...storeProps,
      accounts: {
        [mockState.metamask.selectedAddress]: {
          address: mockState.metamask.selectedAddress,
          balance: '0x1F4',
        },
      },
      featureFlags: { advancedInlineGas: true },
      gasFeeEstimates:
        mockEstimates[GAS_ESTIMATE_TYPES.FEE_MARKET].gasFeeEstimates,
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider
      transaction={{
        userFeeLevel: 'custom',
        txParams: {
          maxPriorityFeePerGas: '0x77359400',
        },
      }}
    >
      <AdvancedGasFeePopoverContextProvider>
        <PriorityfeeInput />
      </AdvancedGasFeePopoverContextProvider>
    </GasFeeContextProvider>,
    store,
  );
};

describe('PriorityfeeInput', () => {
  it('should renders advancedGasFee.priorityfee value if advancedGasFee is available', () => {
    render({ advancedGasFee: { priorityFee: 100 } });
    expect(document.getElementsByTagName('input')[0]).toHaveValue(100);
  });

  it('should renders priorityfee value from transaction if advancedGasFee is not available', () => {
    render();
    expect(document.getElementsByTagName('input')[0]).toHaveValue(2);
  });
  it('should show current priority fee range in subtext', () => {
    render({
      txParams: {
        maxFeePerGas: '0x174876E800',
      },
    });
    expect(screen.queryByText('1 - 20 GWEI')).toBeInTheDocument();
  });
  it('should show 12hr range value in subtext', () => {
    render({
      txParams: {
        maxFeePerGas: '0x174876E800',
      },
    });
    expect(screen.queryByText('2 - 125 GWEI')).toBeInTheDocument();
  });
  it('should show error if value entered is 0', () => {
    render();
    expect(
      screen.queryByText('Priority fee must be greater than 0.'),
    ).not.toBeInTheDocument();
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 0 },
    });
    expect(
      screen.queryByText('Priority fee must be greater than 0.'),
    ).toBeInTheDocument();
  });
});
