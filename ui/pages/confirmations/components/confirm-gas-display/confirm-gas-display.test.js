import React from 'react';
import { act, screen } from '@testing-library/react';

import { NetworkType } from '@metamask/controller-utils';
import { NetworkStatus } from '@metamask/network-controller';
import { GasEstimateTypes } from '../../../../../shared/constants/gas';
import mockEstimates from '../../../../../test/data/mock-estimates.json';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/jest';
import configureStore from '../../../../store/store';

import { GasFeeContextProvider } from '../../../../contexts/gasFee';
import ConfirmGasDisplay from './confirm-gas-display';

jest.mock('../../../../store/actions', () => ({
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest
    .fn()
    .mockResolvedValue({ chainId: '0x5' }),
  getGasFeeTimeEstimate: jest.fn().mockImplementation(() => Promise.resolve()),
}));

const render = async ({ transactionProp = {}, contextProps = {} } = {}) => {
  const store = configureStore({
    ...mockState,
    ...contextProps,
    metamask: {
      ...mockState.metamask,
      accounts: {
        [mockState.metamask.selectedAddress]: {
          address: mockState.metamask.selectedAddress,
          balance: '0x1F4',
        },
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
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
        <GasFeeContextProvider transaction={transactionProp}>
          <ConfirmGasDisplay />
        </GasFeeContextProvider>,
        store,
      )),
  );

  return result;
};

describe('ConfirmGasDisplay', () => {
  it('should match snapshot', async () => {
    const { container } = await render({
      transactionProp: {
        txParams: {
          gas: '0x5208',
        },
        userFeeLevel: 'medium',
      },
    });
    expect(container).toMatchSnapshot();
  });
  it('should render gas display labels for EIP1559 transcations', async () => {
    await render({
      transactionProp: {
        txParams: {
          gas: '0x5208',
          maxFeePerGas: '0x59682f10',
          maxPriorityFeePerGas: '0x59682f00',
        },
        userFeeLevel: 'medium',
      },
    });
    expect(screen.queryByText('Estimated fee')).toBeInTheDocument();
    expect(screen.queryByText('Max fee:')).toBeInTheDocument();
    expect(screen.queryAllByText('ETH').length).toBeGreaterThan(0);
  });
  it('should render gas display labels for legacy transcations', async () => {
    await render({
      contextProps: {
        metamask: {
          selectedNetworkClientId: NetworkType.goerli,
          networksMetadata: {
            [NetworkType.goerli]: {
              EIPS: {
                1559: false,
              },
              status: NetworkStatus.Available,
            },
          },
        },
        confirmTransaction: {
          txData: {
            id: 8393540981007587,
            status: 'unapproved',
            chainId: '0x5',
            txParams: {
              from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
              to: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
              value: '0x0',
              gas: '0x5208',
              gasPrice: '0x3b9aca00',
              type: '0x0',
            },
          },
        },
      },
    });
    expect(screen.queryByText('Estimated gas fee')).toBeInTheDocument();
    expect(screen.queryByText('Max fee:')).toBeInTheDocument();
    expect(screen.queryAllByText('ETH').length).toBeGreaterThan(0);
  });
});
