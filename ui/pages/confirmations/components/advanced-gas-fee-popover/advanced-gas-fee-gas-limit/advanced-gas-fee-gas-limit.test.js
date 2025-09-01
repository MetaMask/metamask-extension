import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';

import { GasEstimateTypes } from '../../../../../../shared/constants/gas';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import mockEstimates from '../../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../../test/data/mock-state.json';
import { MAX_GAS_LIMIT_DEC } from '../../../send-legacy/send.constants';
import { GasFeeContextProvider } from '../../../../../contexts/gasFee';
import configureStore from '../../../../../store/store';

import { AdvancedGasFeePopoverContextProvider } from '../context';
import { getSelectedInternalAccountFromMockState } from '../../../../../../test/jest/mocks';
import AdvancedGasFeeGasLimit from './advanced-gas-fee-gas-limit';

jest.mock('../../../../../store/actions', () => ({
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest
    .fn()
    .mockResolvedValue({ chainId: '0x5' }),
}));

const mockSelectedInternalAccount =
  getSelectedInternalAccountFromMockState(mockState);

const render = async (contextProps, transaction) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      accounts: {
        [mockSelectedInternalAccount.address]: {
          address: mockSelectedInternalAccount.address,
          balance: '0x1F4',
        },
      },
      advancedGasFee: { '0x5': { priorityFee: 100 } },
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
          transaction={
            transaction ?? {
              userFeeLevel: 'custom',
              txParams: { gas: '0x5208' },
            }
          }
          {...contextProps}
        >
          <AdvancedGasFeePopoverContextProvider>
            <AdvancedGasFeeGasLimit />
          </AdvancedGasFeePopoverContextProvider>
        </GasFeeContextProvider>,
        store,
      )),
  );

  return result;
};

describe('AdvancedGasFeeGasLimit', () => {
  it('should show GasLimit from transaction', async () => {
    await render();
    expect(screen.getByText('21000')).toBeInTheDocument();
  });

  it('should show input when edit link is clicked', async () => {
    await render();
    expect(document.getElementsByTagName('input')).toHaveLength(0);
    fireEvent.click(screen.queryByText('Edit'));
    expect(document.getElementsByTagName('input')[0]).toHaveValue(21000);
  });

  it('should show error if gas limit is not in range', async () => {
    await render();
    fireEvent.click(screen.queryByText('Edit'));
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 20000 },
    });
    expect(
      screen.queryByText(
        `Gas limit must be greater than 20999 and less than ${MAX_GAS_LIMIT_DEC}`,
      ),
    ).toBeInTheDocument();
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 80000000 },
    });
    expect(
      screen.queryByText(
        `Gas limit must be greater than 20999 and less than ${MAX_GAS_LIMIT_DEC}`,
      ),
    ).toBeInTheDocument();
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 7000000 },
    });
    expect(
      screen.queryByText(
        `Gas limit must be greater than 20999 and less than ${MAX_GAS_LIMIT_DEC}`,
      ),
    ).not.toBeInTheDocument();
  });

  it('should validate gas limit against minimumGasLimit it is passed to context', async () => {
    await render({ minimumGasLimit: '0x5208' });
    fireEvent.click(screen.queryByText('Edit'));
    fireEvent.change(document.getElementsByTagName('input')[0], {
      target: { value: 2500 },
    });
    expect(
      screen.queryByText(
        `Gas limit must be greater than 20999 and less than ${MAX_GAS_LIMIT_DEC}`,
      ),
    ).toBeInTheDocument();
  });

  it('should replace maximum gas limit with originalGasEstimate if it is greater than maximum gas limit', async () => {
    await render(
      { minimumGasLimit: '0x7530' },
      {
        chainId: '0x5',
        id: 8393540981007587,
        time: 1536268017676,
        status: 'unapproved',
        loadingDefaults: false,
        originalGasEstimate: '0x78D9B2',
        txParams: {
          data: '0xa9059cbb000000000000000000000000b19ac54efa18cc3a14a5b821bfec73d284bf0c5e0000000000000000000000000000000000000000000000003782dace9d900000',
          from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          to: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          value: '0x0',
          gas: '0x3b9aca00',
          gasPrice: '0x3b9aca00',
        },
        origin: 'metamask',
      },
    );
    expect(
      screen.queryByText(
        `Gas limit must be greater than 29999 and less than 30000000`,
      ),
    ).toBeInTheDocument();
  });
});
