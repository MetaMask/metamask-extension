import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';

import {
  EditGasModes,
  GasEstimateTypes,
} from '../../../../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import mockEstimates from '../../../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../../../test/data/mock-state.json';
import { GasFeeContextProvider } from '../../../../../../contexts/gasFee';
import configureStore from '../../../../../../store/store';

import { AdvancedGasFeePopoverContextProvider } from '../../context';
import AdvancedGasFeeGasLimit from '../../advanced-gas-fee-gas-limit';
import BaseFeeInput from './base-fee-input';

const LOW_BASE_FEE = 0.000000001;

jest.mock('../../../../../../store/actions', () => ({
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest
    .fn()
    .mockResolvedValue({ chainId: '0x5' }),
}));

const render = async (txProps, contextProps) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      accounts: {
        [mockState.metamask.selectedAddress]: {
          address: mockState.metamask.selectedAddress,
          balance: '0x1F4',
        },
      },
      advancedGasFee: { '0x5': { maxBaseFee: 100 } },
      featureFlags: { advancedInlineGas: true },
      gasFeeEstimates:
        mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates,
      gasFeeEstimatesByChainId: {
        ...mockState.metamask.gasFeeEstimatesByChainId,
        '0x5': {
          ...mockState.metamask.gasFeeEstimatesByChainId['0x5'],
          gasFeeEstimates:
            mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates,
        },
      },
    },
  });

  let result;

  await act(
    async () =>
      (result = renderWithProvider(
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
      )),
  );

  return result;
};

describe('BaseFeeInput', () => {
  it('should renders advancedGasFee.baseFee value if current estimate used is not custom', async () => {
    await render({
      userFeeLevel: 'high',
    });
    expect(document.getElementsByTagName('input')[0]).toHaveValue(100);
  });

  it('should not use advancedGasFee.baseFee value for swaps', async () => {
    await render(
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

  it('should renders baseFee values from transaction if current estimate used is custom', async () => {
    await render({
      txParams: {
        maxFeePerGas: '0x2E90EDD000',
      },
    });
    expect(document.getElementsByTagName('input')[0]).toHaveValue(200);
  });

  describe('renders baseFee if current estimate used is custom', () => {
    const testCases = [
      {
        description: 'with a high value',
        maxFeePerGas: '0x2E90EDD000',
        expectedValue: 200,
      },
      {
        description: 'with a low value',
        maxFeePerGas: '0x1',
        expectedValue: LOW_BASE_FEE,
      },
    ];

    it.each(testCases)(
      '$description',
      async ({ maxFeePerGas, expectedValue }) => {
        await render({
          txParams: {
            maxFeePerGas,
          },
        });
        expect(document.getElementsByTagName('input')[0]).toHaveValue(
          expectedValue,
        );
      },
    );
  });

  it('should show current value of estimatedBaseFee in users primary currency in right side of input box', async () => {
    await render({
      txParams: {
        gas: '0x5208',
        maxFeePerGas: '0x2E90EDD000',
      },
    });
    expect(screen.queryByText('≈ 0.0042 ETH')).toBeInTheDocument();
  });

  it('should show current value of estimatedBaseFee in subtext', async () => {
    await render();
    expect(screen.queryByText('50 GWEI')).toBeInTheDocument();
  });

  it('should show 12hr range value in subtext', async () => {
    await render();
    expect(screen.queryByText('50 - 100 GWEI')).toBeInTheDocument();
  });

  it('should show error if base fee is less than suggested low value', async () => {
    await render({
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

  it('should show error if base if is more than suggested high value', async () => {
    await render({
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

  describe('updateBaseFee', () => {
    it('updates base fee correctly', async () => {
      const { getByTestId } = await render(<BaseFeeInput />);
      const input = getByTestId('base-fee-input');

      fireEvent.change(input, { target: { value: '1' } });

      expect(input.value).toBe('1');
    });

    it('handles low numbers', async () => {
      const { getByTestId } = await render(<BaseFeeInput />);
      const input = getByTestId('base-fee-input');

      fireEvent.change(input, { target: { value: LOW_BASE_FEE } });

      expect(input.value).toBe('1e-9');
    });
  });
});
