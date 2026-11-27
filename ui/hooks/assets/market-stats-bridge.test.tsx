import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { subscribeToMessengerEvent } from '../../store/background-connection';
import { MarketStatsBridge } from './market-stats-bridge';

jest.mock('react-redux', () => ({
  useSelector: (
    selector: (state: { metamask: { currentCurrency: string } }) => unknown,
  ) => selector({ metamask: { currentCurrency: 'usd' } }),
}));

jest.mock('../../store/background-connection', () => ({
  subscribeToMessengerEvent: jest.fn(),
  submitRequestToBackground: jest.fn(),
}));

describe('MarketStatsBridge', () => {
  it('listens for ticks once and releases the listener on unmount', async () => {
    const off = jest.fn().mockResolvedValue(undefined);
    jest.mocked(subscribeToMessengerEvent).mockResolvedValue(off);

    const { unmount } = render(
      <QueryClientProvider client={new QueryClient()}>
        <MarketStatsBridge />
      </QueryClientProvider>,
    );

    expect(subscribeToMessengerEvent).toHaveBeenCalledTimes(1);
    expect(subscribeToMessengerEvent).toHaveBeenCalledWith(
      'MarketStatsService:pricesUpdated',
      expect.any(Function),
    );

    unmount();
    await Promise.resolve();
    await Promise.resolve();

    expect(off).toHaveBeenCalledTimes(1);
  });
});
