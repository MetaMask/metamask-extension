import React from 'react';
import { TokenGasFeeListItem } from './token-gas-fee-list-item';
import { GasFeeToken } from '@metamask/transaction-controller';
import { renderWithProvider } from '../../../../../../../../test/lib/render-helpers';
import configureStore from '../../../../../../../store/store';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { toHex } from '@metamask/controller-utils';

const GAS_FEE_TOKEN_MOCK: GasFeeToken = {
  amount: toHex(1000),
  balance: toHex(2345),
  decimals: 3,
  gas: '0x3',
  maxFeePerGas: '0x4',
  maxPriorityFeePerGas: '0x5',
  rateWei: toHex('1798170000000000000'),
  recipient: '0x7',
  symbol: 'TEST',
  tokenAddress: '0xabc',
};

const STATE_MOCK = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    preferences: {
      ...mockState.metamask.preferences,
      showFiatInTestnets: true,
    },
  },
};

const store = configureStore(STATE_MOCK);

describe('TokenGasFeeListItem', () => {
  it('includes fiat amount', () => {
    const result = renderWithProvider(
      <TokenGasFeeListItem gasFeeToken={GAS_FEE_TOKEN_MOCK} />,
      store,
    );

    expect(result.getByText('$1,000.00 USD')).toBeInTheDocument();
  });

  it('includes fiat balance', () => {
    const result = renderWithProvider(
      <TokenGasFeeListItem gasFeeToken={GAS_FEE_TOKEN_MOCK} />,
      store,
    );

    expect(result.getByText('Bal: $2,345.00 USD')).toBeInTheDocument();
  });

  it('includes token amount', () => {
    const result = renderWithProvider(
      <TokenGasFeeListItem gasFeeToken={GAS_FEE_TOKEN_MOCK} />,
      store,
    );

    expect(result.getByText('1 TEST')).toBeInTheDocument();
  });
});
