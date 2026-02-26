import React from 'react';
import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useFetchNftDetailsFromTokenURI from './useFetchNftDetailsFromTokenURI';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useFetchNftDetailsFromTokenURI', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns defaults when tokenURI is undefined', () => {
    const { result } = renderHook(
      () => useFetchNftDetailsFromTokenURI(undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.image).toBe('');
    expect(result.current.name).toBe('');
  });

  it('returns defaults when tokenURI is null', () => {
    const { result } = renderHook(
      () => useFetchNftDetailsFromTokenURI(null),
      { wrapper: createWrapper() },
    );

    expect(result.current.image).toBe('');
    expect(result.current.name).toBe('');
  });

  it('returns defaults when fetch response is not ok', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.reject(new Error('Not found')),
    } as Response);

    const { result } = renderHook(
      () => useFetchNftDetailsFromTokenURI('https://test.com'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.image).toBe('');
    expect(result.current.name).toBe('');
  });

  it('returns image and name from valid JSON response', async () => {
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

    const { result } = renderHook(
      () => useFetchNftDetailsFromTokenURI('https://test.com'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.image).toBe(mockData.image);
    expect(result.current.name).toBe('Rocks');
  });

  it('returns defaults when fetch throws', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new Error('MOCK BAD URI'));

    const { result } = renderHook(
      () => useFetchNftDetailsFromTokenURI('BAD_URI'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.image).toBe('');
    expect(result.current.name).toBe('');
  });

  it('returns defaults when image and name are not strings in response', async () => {
    const mockData = {
      name: { nested: 'object' },
      description: 'This is a collection of Rock NFTs.',
      image: ['array', 'of', 'images'],
    };

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockData)),
    } as Response);

    const { result } = renderHook(
      () => useFetchNftDetailsFromTokenURI('https://test.com'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.image).toBe('');
    expect(result.current.name).toBe('');
  });

  it('handles JSON with trailing commas', async () => {
    const invalidJson = '{"name": "Test", "image": "https://example.com/img.png",}';

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(invalidJson),
    } as Response);

    const { result } = renderHook(
      () => useFetchNftDetailsFromTokenURI('https://test.com'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.image).toBe('https://example.com/img.png');
    expect(result.current.name).toBe('Test');
  });
});
