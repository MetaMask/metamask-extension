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
import { CHAIN_IDS } from '../../../../../../../shared/constants/network';
import PriorityfeeInput from './priority-fee-input';

const LOW_PRIORITY_FEE = 0.000000001;

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
      advancedGasFee: { [CHAIN_IDS.GOERLI]: { priorityFee: 100 } },
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
            <PriorityfeeInput />
            <AdvancedGasFeeGasLimit />
          </AdvancedGasFeePopoverContextProvider>
        </GasFeeContextProvider>,
        store,
      )),
  );

  return result;
};

describe('PriorityfeeInput', () => {
  it('should renders advancedGasFee.priorityfee value if current estimate used is not custom', async () => {
    await render({
      userFeeLevel: 'high',
    });
    expect(document.getElementsByTagName('input')[0]).toHaveValue(100);
  });

  it('should not use advancedGasFee.priorityfee value for swaps', async () => {
    await render(
      {
        userFeeLevel: 'high',
      },
      { editGasMode: EditGasModes.swaps },
    );
    expect(document.getElementsByTagName('input')[0]).toHaveValue(
      parseInt(
        mockEstimates[GasEstimateTypes.feeMarket].gasFeeEstimates.high
          .suggestedMaxPriorityFeePerGas,
        10,
      ),
    );
  });

  describe('renders priorityFee if current estimate used is custom', () => {
    const testCases = [
      {
        description: 'with a high value',
        maxPriorityFeePerGas: '0x77359400',
        expectedValue: 2,
      },
      {
        description: 'with a low value',
        maxPriorityFeePerGas: '0x1',
        expectedValue: LOW_PRIORITY_FEE,
      },
    ];

    it.each(testCases)(
      '$description',
      async ({ maxPriorityFeePerGas, expectedValue }) => {
        await render({
          txParams: {
            maxPriorityFeePerGas,
          },
        });
        expect(document.getElementsByTagName('input')[0]).toHaveValue(
          expectedValue,
        );
      },
    );
  });

  it('should show current priority fee range in subtext', async () => {
    await render();
    expect(screen.queryByText('1 - 20 GWEI')).toBeInTheDocument();
  });

  it('should show current value of priority fee in users primary currency in right side of input box', async () => {
    await render({
      txParams: {
        gas: '0x5208',
        maxPriorityFeePerGas: '0x77359400',
      },
    });
    expect(screen.queryByText('≈ 0.000042 ETH')).toBeInTheDocument();
  });

  it('should show 12hr range value in subtext', async () => {
    await render();
    expect(screen.queryByText('2 - 125 GWEI')).toBeInTheDocument();
  });

  it('should not show error if value entered is 0', async () => {
    await render({
      txParams: {
        maxPriorityFeePerGas: '0x174876E800',
      },
    });
    expect(
      screen.queryByText('Priority fee must be greater than 0.'),
    ).not.toBeInTheDocument();
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 0 },
    });
    expect(
      screen.queryByText('Priority fee must be greater than 0.'),
    ).not.toBeInTheDocument();
  });

  it('should not show the error if priority fee is 0', async () => {
    await render({
      txParams: {
        maxPriorityFeePerGas: '0x0',
      },
    });
    expect(
      screen.queryByText('Priority fee must be greater than 0.'),
    ).not.toBeInTheDocument();
  });

  describe('updatePriorityFee', () => {
    it('updates base fee correctly', async () => {
      const { getByTestId } = await render(<PriorityfeeInput />);
      const input = getByTestId('priority-fee-input');

      fireEvent.change(input, { target: { value: '1' } });

      expect(input.value).toBe('1');
    });

    it('handles low numbers', async () => {
      const { getByTestId } = await render(<PriorityfeeInput />);
      const input = getByTestId('priority-fee-input');

      fireEvent.change(input, { target: { value: LOW_PRIORITY_FEE } });

      expect(input.value).toBe('1e-9');
    });
  });
});
