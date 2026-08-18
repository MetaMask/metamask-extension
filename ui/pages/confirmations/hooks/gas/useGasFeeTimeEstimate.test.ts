import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getGasFeeTimeEstimate } from '../../../../store/actions';
import { useGasFeeTimeEstimate } from './useGasFeeTimeEstimate';

jest.mock('../../../../store/actions', () => ({
  getGasFeeTimeEstimate: jest.fn(),
}));

const mockedGetGasFeeTimeEstimate = jest.mocked(getGasFeeTimeEstimate);

describe('useGasFeeTimeEstimate', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mockedGetGasFeeTimeEstimate.mockResolvedValue({
      lowerTimeBound: 1000,
      upperTimeBound: 5000,
    });
  });

  afterEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
  });

  it('does not fetch when disabled', () => {
    renderHook(
      () =>
        useGasFeeTimeEstimate({
          maxPriorityFeePerGas: '1',
          maxFeePerGas: '2',
          enabled: false,
        }),
      { wrapper: createWrapper() },
    );

    expect(mockedGetGasFeeTimeEstimate).not.toHaveBeenCalled();
  });

  it('fetches when enabled and fee strings are present', async () => {
    const { result } = renderHook(
      () =>
        useGasFeeTimeEstimate({
          maxPriorityFeePerGas: '1',
          maxFeePerGas: '2',
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedGetGasFeeTimeEstimate).toHaveBeenCalledWith('1', '2');
    expect(result.current.data).toEqual({
      lowerTimeBound: 1000,
      upperTimeBound: 5000,
    });
  });
});
