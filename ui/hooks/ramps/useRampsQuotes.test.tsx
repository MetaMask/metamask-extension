import { renderHook, act } from '@testing-library/react-hooks';
import { useQuery } from '@tanstack/react-query';
import {
  getRampsBuyWidgetData,
  getRampsQuotes,
} from '../../store/controller-actions/ramps-controller';
import { useRampsQuotes } from './useRampsQuotes';
import { createRampsTestWrapper } from './test-utils';

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn(),
  };
});

jest.mock('../../store/controller-actions/ramps-controller', () => ({
  getRampsQuotes: jest.fn().mockResolvedValue({ quotes: [] }),
  getRampsBuyWidgetData: jest
    .fn()
    .mockResolvedValue({ url: 'https://example.com' }),
}));

const mockedUseQuery = jest.mocked(useQuery);

const quoteOptions = {
  assetId: 'eip155:1/slip44:60',
  amount: 100,
  walletAddress: '0xabc',
};

describe('useRampsQuotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as never);
  });

  it('matches snapshot when query is disabled', () => {
    const { result } = renderHook(() => useRampsQuotes(), {
      wrapper: createRampsTestWrapper(),
    });

    expect(result.current).toMatchSnapshot();
  });

  it('returns idle loading state when the query is disabled', () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as never);

    const { result } = renderHook(() => useRampsQuotes(), {
      wrapper: createRampsTestWrapper(),
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.loading).toBe(false);
  });

  it('returns loading status while quotes are fetching', () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as never);

    const { result } = renderHook(() => useRampsQuotes(quoteOptions), {
      wrapper: createRampsTestWrapper(),
    });

    expect(result.current.status).toBe('loading');
    expect(result.current.loading).toBe(true);
  });

  it('returns loaded quotes and exposes write helpers', async () => {
    const quotesResponse = { quotes: [{ id: 'q1' }] };
    mockedUseQuery.mockReturnValue({
      data: quotesResponse,
      isLoading: false,
      isError: false,
      error: null,
    } as never);

    const { result } = renderHook(() => useRampsQuotes(quoteOptions), {
      wrapper: createRampsTestWrapper(),
    });

    expect(result.current.status).toBe('success');
    expect(result.current.data).toEqual(quotesResponse);

    await act(async () => {
      await result.current.getQuotes(quoteOptions);
      await result.current.getBuyWidgetData({ id: 'q1' } as never);
    });

    expect(getRampsQuotes).toHaveBeenCalledWith(quoteOptions);
    expect(getRampsBuyWidgetData).toHaveBeenCalledWith({ id: 'q1' });
  });

  it('returns error status when the query fails', () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('quote failed'),
    } as never);

    const { result } = renderHook(() => useRampsQuotes(quoteOptions), {
      wrapper: createRampsTestWrapper(),
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toEqual(new Error('quote failed'));
  });
});
