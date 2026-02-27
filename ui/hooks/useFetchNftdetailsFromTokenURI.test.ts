import React from 'react';
import { waitFor } from '@testing-library/react';
import { renderHook as _renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useFetchNftDetailsFromTokenURI from './useFetchNftDetailsFromTokenURI';

let queryClient: QueryClient;

function renderHook<Result>(callback: () => Result) {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return _renderHook(callback, { wrapper });
}

describe('useFetchNftDetailsFromTokenURI', () => {
  afterEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
  });
  it('should return without fetching when tokenURI is undefined', async () => {
    let result;

    await act(async () => {
      result = renderHook(() => useFetchNftDetailsFromTokenURI(undefined));
    });

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as unknown as Record<string, any>).result.current).toEqual({
      image: '',
      name: '',
    });
  });

  it('should return when fetch fails', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      text: () => Promise.reject(new Error('Fetch failed')),
    } as Response);

    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchNftDetailsFromTokenURI('https://test.com'),
    );

    await waitForNextUpdate();

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as unknown as Record<string, any>).current).toEqual({
      image: '',
      name: '',
    });
  });

  it('should return correctly when tokenURI is defined and contains valid JSON', async () => {
    const mockData = {
      name: 'Rocks',
      description: 'This is a collection of Rock NFTs.',
      image:
        'https://ipfs.io/ipfs/bafkreifvhjdf6ve4jfv6qytqtux5nd4nwnelioeiqx5x2ez5yrgrzk7ypi',
    };

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockData)),
    } as Response);

    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchNftDetailsFromTokenURI('https://test.com'),
    );

    await waitForNextUpdate();

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as unknown as Record<string, any>).current).toEqual({
      image:
        'https://ipfs.io/ipfs/bafkreifvhjdf6ve4jfv6qytqtux5nd4nwnelioeiqx5x2ez5yrgrzk7ypi',
      name: 'Rocks',
    });
  });

  it('should gracefully fail when providing an invalid token URI', async () => {
    const mockFetch = jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new Error('MOCK BAD URI'));
    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchNftDetailsFromTokenURI('BAD_URI'),
    );
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    await waitForNextUpdate();
    expect(result.current).toEqual({
      image: '',
      name: '',
    });
  });

  it('should not set image or name when they are not strings in the response', async () => {
    const mockData = {
      name: { nested: 'object' },
      description: 'This is a collection of Rock NFTs.',
      image: ['array', 'of', 'images'],
    };

    const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockData)),
    } as Response);

    const { result, waitForNextUpdate } = renderHook(() =>
      useFetchNftDetailsFromTokenURI('https://test.com'),
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    await waitForNextUpdate();

    expect(result.current).toEqual({
      image: '',
      name: '',
    });
  });
});
