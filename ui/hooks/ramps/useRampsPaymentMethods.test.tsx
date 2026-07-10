import { renderHook, act } from '@testing-library/react-hooks';
import { useQuery } from '@tanstack/react-query';
import { setRampsSelectedPaymentMethod } from '../../store/controller-actions/ramps-controller';
import { useRampsPaymentMethods } from './useRampsPaymentMethods';
import { createRampsMockStore, createRampsTestWrapper } from './test-utils';

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn(),
  };
});

jest.mock('../../store/controller-actions/ramps-controller', () => ({
  setRampsSelectedPaymentMethod: jest.fn().mockResolvedValue(undefined),
  getRampsPaymentMethods: jest.fn(),
}));

const mockedUseQuery = jest.mocked(useQuery);

const paymentMethod = {
  id: 'credit_debit_card',
  name: 'Debit or Credit',
} as never;

const enabledStore = createRampsMockStore({
  providers: {
    data: [],
    selected: { id: 'transak' },
    isLoading: false,
    error: null,
  },
  paymentMethods: {
    data: [paymentMethod],
    selected: paymentMethod,
    isLoading: false,
    error: null,
  },
});

describe('useRampsPaymentMethods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    } as never);
  });

  it('matches snapshot when idle', () => {
    const { result } = renderHook(() => useRampsPaymentMethods(), {
      wrapper: createRampsTestWrapper(),
    });

    expect(result.current).toMatchSnapshot();
  });

  it('returns loading status while the query is loading', () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isError: false,
      error: null,
    } as never);

    const { result } = renderHook(() => useRampsPaymentMethods(), {
      wrapper: createRampsTestWrapper(enabledStore),
    });

    expect(result.current.status).toBe('loading');
    expect(result.current.isLoading).toBe(true);
  });

  it('returns loaded payment methods and exposes write helper', async () => {
    mockedUseQuery.mockReturnValue({
      data: [paymentMethod],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    } as never);

    const { result } = renderHook(() => useRampsPaymentMethods(), {
      wrapper: createRampsTestWrapper(enabledStore),
    });

    expect(result.current.status).toBe('success');
    expect(result.current.paymentMethods).toEqual([paymentMethod]);

    await act(async () => {
      await result.current.setSelectedPaymentMethod(paymentMethod);
    });

    expect(setRampsSelectedPaymentMethod).toHaveBeenCalledWith(paymentMethod);
  });

  it('preserves selected payment method while the query is loading', () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isError: false,
      error: null,
    } as never);

    renderHook(() => useRampsPaymentMethods(), {
      wrapper: createRampsTestWrapper(enabledStore),
    });

    expect(setRampsSelectedPaymentMethod).not.toHaveBeenCalled();
  });

  it('clears selected payment method when the query returns no methods', () => {
    mockedUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    } as never);

    renderHook(() => useRampsPaymentMethods(), {
      wrapper: createRampsTestWrapper(enabledStore),
    });

    expect(setRampsSelectedPaymentMethod).toHaveBeenCalledWith(null);
  });

  it('returns error status when the query fails', () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: new Error('network down'),
    } as never);

    const { result } = renderHook(() => useRampsPaymentMethods(), {
      wrapper: createRampsTestWrapper(enabledStore),
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toContain('network down');
  });
});
