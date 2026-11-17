import { it } from '@jest/globals';
import { act, waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { useMoneyAccountLifecycle } from './use-money-account-lifecycle';
import { MoneyAccountLifecycleControllerQueryKeys } from './query-keys';

const mockSubmitRequestToBackground = jest.fn();
const mockUseMoneyAccountAvailability = jest.fn();

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('./use-money-account-availability', () => ({
  useMoneyAccountAvailability: () => mockUseMoneyAccountAvailability(),
}));

const ADDRESS = '0x0000000000000000000000000000000000000001';

const availableMock = {
  availability: { isAvailable: true as const, address: ADDRESS },
};

const getStateResponse = (lifecycle: { type: string }) => ({
  moneyAccounts: { [ADDRESS]: lifecycle },
  addressRegistrations: {},
});

const mockGetState = (lifecycle: { type: string }) => {
  mockSubmitRequestToBackground.mockImplementation((action: string) => {
    if (action === MoneyAccountLifecycleControllerQueryKeys.GetState) {
      return Promise.resolve(getStateResponse(lifecycle));
    }
    return Promise.resolve(undefined);
  });
};

describe('useMoneyAccountLifecycle', () => {
  const originalInTest = process.env.IN_TEST;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.IN_TEST;
    mockUseMoneyAccountAvailability.mockReturnValue(availableMock);
  });

  afterEach(() => {
    if (originalInTest === undefined) {
      delete process.env.IN_TEST;
    } else {
      process.env.IN_TEST = originalInTest;
    }
  });

  it.each(['mfa', 'migrating'])('is read-only for %s', async (type) => {
    mockGetState({ type });

    const { result } = renderHookWithProvider(() => useMoneyAccountLifecycle());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isReadOnly).toBe(true);
  });

  it.each(['sfa', 'notInIdentity'])('is writable for %s', async (type) => {
    mockGetState({ type });

    const { result } = renderHookWithProvider(() => useMoneyAccountLifecycle());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isReadOnly).toBe(false);
  });

  it('is writable when the address has no recorded lifecycle', async () => {
    mockSubmitRequestToBackground.mockImplementation((action: string) => {
      if (action === MoneyAccountLifecycleControllerQueryKeys.GetState) {
        return Promise.resolve({ moneyAccounts: {}, addressRegistrations: {} });
      }
      return Promise.resolve(undefined);
    });

    const { result } = renderHookWithProvider(() => useMoneyAccountLifecycle());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.lifecycle).toBeUndefined();
    expect(result.current.isReadOnly).toBe(false);
  });

  it('reports loading until the first read settles', async () => {
    let resolveGetState: (value: unknown) => void = () => undefined;
    mockSubmitRequestToBackground.mockImplementation((action: string) => {
      if (action === MoneyAccountLifecycleControllerQueryKeys.GetState) {
        return new Promise((resolve) => {
          resolveGetState = resolve;
        });
      }
      return Promise.resolve(undefined);
    });

    const { result } = renderHookWithProvider(() => useMoneyAccountLifecycle());

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveGetState(getStateResponse({ type: 'sfa' }));
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('reads nothing when the Money Account is unavailable', () => {
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: { isAvailable: false },
    });

    const { result } = renderHookWithProvider(() => useMoneyAccountLifecycle());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isReadOnly).toBe(false);
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('keeps the recorded lifecycle when the refresh fails', async () => {
    mockSubmitRequestToBackground.mockImplementation((action: string) => {
      if (action === MoneyAccountLifecycleControllerQueryKeys.GetState) {
        return Promise.resolve(getStateResponse({ type: 'mfa' }));
      }
      return Promise.reject(new Error('CHOMP unavailable'));
    });

    const { result } = renderHookWithProvider(() => useMoneyAccountLifecycle());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.isReadOnly).toBe(true));
  });

  it('stays loading while the first refresh is pending and no lifecycle is recorded', async () => {
    let resolveRefresh: () => void = () => undefined;
    mockSubmitRequestToBackground.mockImplementation((action: string) => {
      if (action === MoneyAccountLifecycleControllerQueryKeys.GetState) {
        return Promise.resolve({ moneyAccounts: {}, addressRegistrations: {} });
      }
      return new Promise<void>((resolve) => {
        resolveRefresh = resolve;
      });
    });

    const { result } = renderHookWithProvider(() => useMoneyAccountLifecycle());

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolveRefresh();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('marks the account unavailable when the refresh fails and no lifecycle is recorded', async () => {
    let rejectRefresh: (error: Error) => void = () => undefined;
    mockSubmitRequestToBackground.mockImplementation((action: string) => {
      if (action === MoneyAccountLifecycleControllerQueryKeys.GetState) {
        return Promise.resolve({ moneyAccounts: {}, addressRegistrations: {} });
      }
      return new Promise<void>((_, reject) => {
        rejectRefresh = reject;
      });
    });

    const { result } = renderHookWithProvider(() => useMoneyAccountLifecycle());

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'MoneyAccountLifecycleController:refresh',
      );
    });

    await act(async () => {
      rejectRefresh(new Error('CHOMP unavailable'));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isReadOnly).toBe(false);
    expect(result.current.isLifecycleUnavailable).toBe(true);
  });

  it('refreshes the recorded lifecycle once after the first read', async () => {
    mockGetState({ type: 'sfa' });

    const { result } = renderHookWithProvider(() => useMoneyAccountLifecycle());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => {
      expect(
        mockSubmitRequestToBackground.mock.calls.filter(
          ([action]) => action === 'MoneyAccountLifecycleController:refresh',
        ),
      ).toHaveLength(1);
    });
  });
});
