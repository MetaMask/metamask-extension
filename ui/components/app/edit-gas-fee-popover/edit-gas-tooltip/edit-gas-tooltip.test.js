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

const renderComponent = (componentProps) => {
  const mockStore = {
    metamask: {
      providerConfig: {},
      cachedBalances: {},
      accounts: {
        '0xAddress': {
          address: '0xAddress',
          balance: '0x176e5b6f173ebe66',
        },
      },
      identities: {
        '0xAddress': {},
      },
      selectedAddress: '0xAddress',
      featureFlags: { advancedInlineGas: true },
    },
  };

  const store = configureStore(mockStore);

  return renderWithProvider(
    <GasFeeContextProvider transaction={{ txParams: { gas: '0x5208' } }}>
      <EditGasToolTip {...componentProps} t={jest.fn()} gasLimit={21000} />
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

    expect(queryByText('2.0102')).toBeInTheDocument();
    expect(queryByText('1.2')).toBeInTheDocument();
    expect(queryByText('21000')).toBeInTheDocument();
  });

  it('should render correct values for priorityLevel medium', () => {
    const { queryByText } = renderComponent({
      priorityLevel: 'medium',
      ...MEDIUM_GAS_OPTION,
    });
    expect(queryByText('2.3838')).toBeInTheDocument();
    expect(queryByText('1.5')).toBeInTheDocument();
    expect(queryByText('21000')).toBeInTheDocument();
  });

  it('should render correct values for priorityLevel high', () => {
    const { queryByText } = renderComponent({
      priorityLevel: 'high',
      ...HIGH_GAS_OPTION,
    });
    expect(queryByText('2.9206')).toBeInTheDocument();
    expect(queryByText('2')).toBeInTheDocument();
    expect(queryByText('21000')).toBeInTheDocument();
  });
});
