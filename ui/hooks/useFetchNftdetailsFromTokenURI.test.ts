import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';
import useFetchNftDetailsFromTokenURI from './useFetchNftDetailsFromTokenURI';

describe('useFetchNftDetailsFromTokenURI', () => {
  afterEach(() => {
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
    jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() =>
        Promise.resolve({
          ok: false,
          text: () => Promise.reject(new Error('Fetch failed')),
        }),
      ) as jest.Mock,
    );

    let result;

    await act(async () => {
      result = renderHook(() =>
        useFetchNftDetailsFromTokenURI('https://test.com'),
      );
    });

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as unknown as Record<string, any>).result.current).toEqual({
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

    jest.spyOn(global, 'fetch').mockImplementation(
      jest.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify(mockData)),
        }),
      ) as jest.Mock,
    );

    let result;

    await act(async () => {
      result = renderHook(() =>
        useFetchNftDetailsFromTokenURI('https://test.com'),
      );
    });

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as unknown as Record<string, any>).result.current).toEqual({
      image:
        'https://ipfs.io/ipfs/bafkreifvhjdf6ve4jfv6qytqtux5nd4nwnelioeiqx5x2ez5yrgrzk7ypi',
      name: 'Rocks',
    });
  });
});
