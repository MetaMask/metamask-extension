import React from 'react';
import { screen } from '@testing-library/react';

import { ETH } from '../../../helpers/constants/common';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';

import TransactionDetail from './transaction-detail.component';

jest.mock('../../../store/actions', () => ({
  disconnectGasFeeEstimatePoller: jest.fn(),
  getGasFeeEstimatesAndStartPolling: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  addPollingTokenToAppState: jest.fn(),
}));

const render = ({ componentProps, contextProps } = {}) => {
  const store = configureStore({
    metamask: {
      nativeCurrency: ETH,
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
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
    },
  });

  return renderWithProvider(
    <GasFeeContextProvider {...contextProps}>
      <TransactionDetail
        onEdit={() => {
          console.log('on edit');
        }}
        rows={[]}
        {...componentProps}
      />
    </GasFeeContextProvider>,
    store,
  );
};

describe('TransactionDetail', () => {
  beforeEach(() => {
    process.env.EIP_1559_V2 = true;
  });

  afterEach(() => {
    process.env.EIP_1559_V2 = false;
  });

  it('should render edit link with text low if low gas estimates are selected', () => {
    render({ contextProps: { transaction: { userFeeLevel: 'low' } } });
    expect(screen.queryByText('🐢')).toBeInTheDocument();
    expect(screen.queryByText('Low')).toBeInTheDocument();
  });

  it('should render edit link with text markey if medium gas estimates are selected', () => {
    render({ contextProps: { transaction: { userFeeLevel: 'medium' } } });
    expect(screen.queryByText('🦊')).toBeInTheDocument();
    expect(screen.queryByText('Market')).toBeInTheDocument();
  });

  it('should render edit link with text agressive if high gas estimates are selected', () => {
    render({ contextProps: { transaction: { userFeeLevel: 'high' } } });
    expect(screen.queryByText('🦍')).toBeInTheDocument();
    expect(screen.queryByText('Aggressive')).toBeInTheDocument();
  });

  it('should render edit link with text Site suggested if site suggested estimated are used', () => {
    render({
      contextProps: {
        transaction: {
          dappSuggestedGasFees: { maxFeePerGas: 1, maxPriorityFeePerGas: 1 },
          txParams: { maxFeePerGas: 1, maxPriorityFeePerGas: 1 },
        },
      },
    });
    expect(screen.queryByText('🌐')).toBeInTheDocument();
    expect(screen.queryByText('Site suggested')).toBeInTheDocument();
    expect(document.getElementsByClassName('info-tooltip')).toHaveLength(1);
  });

  it('should render edit link with text advance if custom gas estimates are used', () => {
    render({
      contextProps: {
        defaultEstimateToUse: 'custom',
      },
    });
    expect(screen.queryByText('⚙')).toBeInTheDocument();
    expect(screen.queryByText('Advanced')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).toBeInTheDocument();
  });

  it('should not render edit link if transaction has simulation error and prop userAcknowledgedGasMissing is false', () => {
    render({
      contextProps: {
        transaction: {
          simulationFails: true,
          userFeeLevel: 'low',
        },
      },
      componentProps: { userAcknowledgedGasMissing: false },
    });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('Low')).not.toBeInTheDocument();
  });

  it('should render edit link if userAcknowledgedGasMissing is true even if transaction has simulation error', () => {
    render({
      contextProps: {
        transaction: {
          simulationFails: true,
          userFeeLevel: 'low',
        },
      },
      componentProps: { userAcknowledgedGasMissing: true },
    });
    expect(screen.queryByRole('button')).toBeInTheDocument();
    expect(screen.queryByText('Low')).toBeInTheDocument();
  });
});
