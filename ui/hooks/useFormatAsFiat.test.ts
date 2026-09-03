import { renderHook } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { useFormatAsFiat } from './useFormatAsFiat';

const solAssetId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
const solChainId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

jest.mock('./useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyWithMinThreshold: (value: number, currency: string) => {
      const absolute = Math.abs(value);
      return value < 0 ? `-${currency}:${absolute}` : `${currency}:${absolute}`;
    },
  }),
}));

jest.mock('./useConvertToFiat', () => ({
  useConvertToFiat: () => (token: { amount?: string } | undefined) => {
    if (!token?.amount) {
      return undefined;
    }
    return Number(token.amount) * 150;
  },
}));

jest.mock('../ducks/metamask/metamask', () => ({
  getCurrentCurrency: () => 'usd',
}));

describe('useFormatAsFiat', () => {
  it('formats a token with direction signs', () => {
    const store = configureMockStore()({});
    const { result } = renderHook(() => useFormatAsFiat(solChainId), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(Provider, { store, children }),
    });

    expect(
      result.current({
        amount: '0.005',
        symbol: 'SOL',
        assetId: solAssetId,
        direction: 'out',
      }),
    ).toBe('-usd:0.75');
  });
});
