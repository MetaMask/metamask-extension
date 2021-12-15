import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import { GAS_ESTIMATE_TYPES } from '../../../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import mockEstimates from '../../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../../test/data/mock-state.json';
import { GasFeeContextProvider } from '../../../../../contexts/gasFee';
import configureStore from '../../../../../store/store';

import { AdvancedGasFeePopoverContextProvider } from '../../context';
import BaseFeeInput from './base-fee-input';

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
          maxFeePerGas: '0x174876E800',
        },
      }}
    >
      <AdvancedGasFeePopoverContextProvider>
        <BaseFeeInput />
      </AdvancedGasFeePopoverContextProvider>
    </GasFeeContextProvider>,
    store,
  );
};

describe('BaseFeeInput', () => {
  it('should renders advancedGasFee.baseFee value if advancedGasFee is available', () => {
    render({
      advancedGasFee: { maxBaseFee: 4 },
    });
    expect(document.getElementsByTagName('input')[0]).toHaveValue(4);
  });

  it('should renders baseFee values from transaction if advancedGasFee is not available', () => {
    render();
    expect(document.getElementsByTagName('input')[0]).toHaveValue(1.5);
  });

  it('should show GWEI value in input when Edit in GWEI link is clicked', () => {
    render();
    fireEvent.click(screen.queryByText('Edit in GWEI'));
    expect(document.getElementsByTagName('input')[0]).toHaveValue(75);
  });

  it('should correctly update GWEI value if multiplier is changed', () => {
    render();
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 4 },
    });
    fireEvent.click(screen.queryByText('Edit in GWEI'));
    expect(document.getElementsByTagName('input')[0]).toHaveValue(200);
  });

  it('should correctly update multiplier value if GWEI is changed', () => {
    render();
    expect(document.getElementsByTagName('input')[0]).toHaveValue(1.5);
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
    expect(screen.queryByText('50 GWEI')).toBeInTheDocument();
  });
  it('should show 12hr range value in subtext', () => {
    render({
      txParams: {
        maxFeePerGas: '0x174876E800',
      },
    });
    expect(screen.queryByText('50 - 100 GWEI')).toBeInTheDocument();
  });
  it('should show error if base fee is less than suggested low value', () => {
    render();
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 3 },
    });
    expect(
      screen.queryByText('Max base fee is low for current network conditions'),
    ).not.toBeInTheDocument();
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 0.01 },
    });
    expect(
      screen.queryByText('Max base fee is low for current network conditions'),
    ).toBeInTheDocument();
    fireEvent.click(screen.queryByText('Edit in GWEI'));
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 10 },
    });
    expect(
      screen.queryByText('Max base fee is low for current network conditions'),
    ).toBeInTheDocument();
  });

  it('should show error if base if is more than suggested high value', () => {
    render();
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 3 },
    });
    expect(
      screen.queryByText('Max base fee is higher than necessary'),
    ).not.toBeInTheDocument();
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 10 },
    });
    fireEvent.click(screen.queryByText('Edit in GWEI'));
    expect(
      screen.queryByText('Max base fee is higher than necessary'),
    ).toBeInTheDocument();
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 500 },
    });
    expect(
      screen.queryByText('Max base fee is higher than necessary'),
    ).toBeInTheDocument();
  });
});
