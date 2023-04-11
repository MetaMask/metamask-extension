import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import {
  EditGasModes,
  GasEstimateTypes,
} from '../../../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import mockEstimates from '../../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../../test/data/mock-state.json';
import { GasFeeContextProvider } from '../../../../../contexts/gasFee';
import configureStore from '../../../../../store/store';

import { AdvancedGasFeePopoverContextProvider } from '../../context';
import AdvancedGasFeeGasLimit from '../../advanced-gas-fee-gas-limit';
import BaseFeeInput from './base-fee-input';

jest.mock('../../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
}));

const render = (txProps, contextProps) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      accounts: {
        [mockState.metamask.selectedAddress]: {
          address: mockState.metamask.selectedAddress,
          balance: '0x1F4',
        },
      },
      advancedGasFee: { maxBaseFee: 100 },
      featureFlags: { advancedInlineGas: true },
      gasFeeEstimates:
        mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates,
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider
      transaction={{
        userFeeLevel: 'custom',
        ...txProps,
      }}
      {...contextProps}
    >
      <AdvancedGasFeePopoverContextProvider>
        <BaseFeeInput />
        <AdvancedGasFeeGasLimit />
      </AdvancedGasFeePopoverContextProvider>
    </GasFeeContextProvider>,
    store,
  );
};

describe('BaseFeeInput', () => {
  it('should renders advancedGasFee.baseFee value if current estimate used is not custom', () => {
    render({
      userFeeLevel: 'high',
    });
    expect(document.getElementsByTagName('input')[0]).toHaveValue(100);
  });

  it('should not use advancedGasFee.baseFee value for swaps', () => {
    render(
      {
        userFeeLevel: 'high',
      },
      { editGasMode: EditGasModes.swaps },
    );
    expect(document.getElementsByTagName('input')[0]).toHaveValue(
      parseInt(
        mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates.high
          .suggestedMaxFeePerGas,
        10,
      ),
    );
  });

  it('should renders baseFee values from transaction if current estimate used is custom', () => {
    render({
      txParams: {
        maxFeePerGas: '0x2E90EDD000',
      },
    });
    expect(document.getElementsByTagName('input')[0]).toHaveValue(200);
  });

  it('should show current value of estimatedBaseFee in users primary currency in right side of input box', () => {
    render({
      txParams: {
        gas: '0x5208',
        maxFeePerGas: '0x2E90EDD000',
      },
    });
    expect(screen.queryByText('≈ 0.0042 ETH')).toBeInTheDocument();
  });

  it('should show current value of estimatedBaseFee in subtext', () => {
    render();
    expect(screen.queryByText('50 GWEI')).toBeInTheDocument();
  });

  it('should show 12hr range value in subtext', () => {
    render();
    expect(screen.queryByText('50 - 100 GWEI')).toBeInTheDocument();
  });

  it('should show error if base fee is less than suggested low value', () => {
    render({
      txParams: {
        maxFeePerGas: '0x174876E800',
      },
    });
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 55 },
    });
    expect(
      screen.queryByText('Max base fee is low for current network conditions'),
    ).not.toBeInTheDocument();
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 50 },
    });
  });

  it('should show error if base if is more than suggested high value', () => {
    render({
      txParams: {
        maxFeePerGas: '0x174876E800',
      },
    });
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 75 },
    });
    expect(
      screen.queryByText('Max base fee is higher than necessary'),
    ).not.toBeInTheDocument();
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 500 },
    });
    expect(
      screen.queryByText('Max base fee is higher than necessary'),
    ).toBeInTheDocument();
  });
});
