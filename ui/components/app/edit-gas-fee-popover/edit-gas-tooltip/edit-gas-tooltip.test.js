import React from 'react';
import configureStore from '../../../../store/store';
import { renderWithProvider } from '../../../../../test/jest';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';
import EditGasToolTip from './edit-gas-tooltip';

jest.mock('../../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
  getGasFeeTimeEstimate: jest
    .fn()
    .mockImplementation(() => Promise.resolve('unknown')),
}));

const LOW_GAS_OPTION = {
  maxFeePerGas: '2.010203381',
  maxPriorityFeePerGas: '1.20004164',
};

const MEDIUM_GAS_OPTION = {
  maxFeePerGas: '2.383812808',
  maxPriorityFeePerGas: '1.5',
};

const HIGH_GAS_OPTION = {
  maxFeePerGas: '2.920638342',
  maxPriorityFeePerGas: '2',
};

const renderComponent = (props, transactionProps, gasFeeContextProps) => {
  const mockStore = {
    metamask: {
      provider: {},
      cachedBalances: {},
      accounts: {
        '0xAddress': {
          address: '0xAddress',
          balance: '0x176e5b6f173ebe66',
        },
      },
      selectedAddress: '0xAddress',
      featureFlags: { advancedInlineGas: true },
      advancedGasFee: {
        maxBaseFee: '1.5',
        priorityFee: '2',
      },
    },
  };

  const store = configureStore(mockStore);

  return renderWithProvider(
    <GasFeeContextProvider
      transaction={{ txParams: { gas: '0x5208' }, ...transactionProps }}
      {...gasFeeContextProps}
    >
      <EditGasToolTip {...props} t={jest.fn()} />
    </GasFeeContextProvider>,
    store,
  );
};

describe('EditGasToolTip', () => {
  it('should render correct values for priorityLevel low', () => {
    const { queryByText } = renderComponent({
      priorityLevel: 'low',
      ...LOW_GAS_OPTION,
    });

    expect(queryByText('2.010203381')).toBeInTheDocument();
    expect(queryByText('1.20004164')).toBeInTheDocument();
    expect(queryByText('21000')).toBeInTheDocument();
  });

  it('should render correct values for priorityLevel medium', () => {
    const { queryByText } = renderComponent({
      priorityLevel: 'medium',
      ...MEDIUM_GAS_OPTION,
    });
    expect(queryByText('2.383812808')).toBeInTheDocument();
    expect(queryByText('1.5')).toBeInTheDocument();
    expect(queryByText('21000')).toBeInTheDocument();
  });

  it('should render correct values for priorityLevel high', () => {
    const { queryByText } = renderComponent({
      priorityLevel: 'high',
      ...HIGH_GAS_OPTION,
    });
    expect(queryByText('2.920638342')).toBeInTheDocument();
    expect(queryByText('2')).toBeInTheDocument();
    expect(queryByText('21000')).toBeInTheDocument();
  });
});
