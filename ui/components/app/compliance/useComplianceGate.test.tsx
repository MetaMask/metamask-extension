import React, { type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { act, renderHook } from '@testing-library/react-hooks';
import { submitRequestToBackground } from '../../../store/background-connection';
import { useComplianceGate } from './useComplianceGate';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockShowAccessRestrictedModal = jest.fn();

jest.mock('./access-restricted-context', () => ({
  useAccessRestrictedModal: () => ({
    showAccessRestrictedModal: mockShowAccessRestrictedModal,
  }),
}));

jest.mock('../../../../shared/lib/manifestFlags', () => {
  const manifestFlags = { remoteFeatureFlags: {} };
  return {
    getManifestFlags: () => manifestFlags,
  };
});

const mockStore = configureMockStore([]);
const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

const ADDRESS = '0xabc';
const BLOCKED_ADDRESS = '0xblocked';

type WalletComplianceStatus = {
  address: string;
  blocked: boolean;
  checkedAt: string;
};

function getState({
  complianceEnabled = true,
  walletComplianceStatusMap = {},
}: {
  complianceEnabled?: boolean;
  walletComplianceStatusMap?: Record<string, WalletComplianceStatus>;
} = {}) {
  return {
    metamask: {
      remoteFeatureFlags: { complianceEnabled },
      walletComplianceStatusMap,
      lastCheckedAt: null,
    },
  };
}

function getWrapper(state = getState()) {
  const store = mockStore(state);
  return function complianceTestWrapper({
    children,
  }: PropsWithChildren<Record<string, unknown>>) {
    return <Provider store={store}>{children}</Provider>;
  };
}

function getStatus(address: string, blocked: boolean): WalletComplianceStatus {
  return {
    address,
    blocked,
    checkedAt: '2026-05-05T00:00:00.000Z',
  };
}

function createDeferred<ResultValue>() {
  let resolve: (value: ResultValue) => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<ResultValue>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

describe('useComplianceGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips the API and runs the action when compliance is disabled', async () => {
    const action = jest.fn().mockReturnValue('allowed');
    const { result } = renderHook(() => useComplianceGate(ADDRESS), {
      wrapper: getWrapper(getState({ complianceEnabled: false })),
    });

    let value: string | undefined;
    await act(async () => {
      value = await result.current.gate(action);
    });

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    expect(action).toHaveBeenCalledTimes(1);
    expect(value).toBe('allowed');
  });

  it('prefetches wallet compliance when enabled', async () => {
    mockSubmitRequestToBackground.mockResolvedValueOnce([
      getStatus(ADDRESS, false),
    ]);

    renderHook(() => useComplianceGate(ADDRESS), {
      wrapper: getWrapper(),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'complianceCheckWalletsCompliance',
      [[ADDRESS]],
    );
  });

  it('blocks the action and shows access-restricted UX for a blocked result', async () => {
    mockSubmitRequestToBackground.mockResolvedValueOnce([
      getStatus(ADDRESS, true),
    ]);
    const action = jest.fn();
    const { result } = renderHook(() => useComplianceGate(ADDRESS), {
      wrapper: getWrapper(),
    });

    await act(async () => {
      await result.current.gate(action);
    });

    expect(action).not.toHaveBeenCalled();
    expect(mockShowAccessRestrictedModal).toHaveBeenCalledTimes(1);
  });

  it('blocks when any address in an array is blocked', async () => {
    mockSubmitRequestToBackground.mockResolvedValueOnce([
      getStatus(ADDRESS, false),
      getStatus(BLOCKED_ADDRESS, true),
    ]);
    const action = jest.fn();
    const { result } = renderHook(
      () => useComplianceGate([ADDRESS, BLOCKED_ADDRESS]),
      {
        wrapper: getWrapper(),
      },
    );

    await act(async () => {
      await result.current.gate(action);
    });

    expect(action).not.toHaveBeenCalled();
    expect(mockShowAccessRestrictedModal).toHaveBeenCalledTimes(1);
  });

  it('waits for the in-flight prefetch before running the action', async () => {
    const deferred = createDeferred<WalletComplianceStatus[]>();
    mockSubmitRequestToBackground.mockReturnValueOnce(deferred.promise);
    const action = jest.fn();
    const { result } = renderHook(() => useComplianceGate(ADDRESS), {
      wrapper: getWrapper(),
    });

    const gatePromise = result.current.gate(action);

    expect(action).not.toHaveBeenCalled();

    await act(async () => {
      deferred.resolve([getStatus(ADDRESS, false)]);
      await gatePromise;
    });

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('does not make a second compliance call when a prefetch has settled', async () => {
    // The mount prefetch is the only request the hook should make; gate() must
    // trust its result rather than firing another (cross-process + network)
    // check. The call-count assertion below proves no second request is made.
    mockSubmitRequestToBackground.mockResolvedValueOnce([
      getStatus(ADDRESS, false),
    ]);
    const action = jest.fn().mockReturnValue('allowed');
    const { result } = renderHook(() => useComplianceGate(ADDRESS), {
      wrapper: getWrapper(),
    });

    await act(async () => {
      await Promise.resolve();
    });

    let value: string | undefined;
    await act(async () => {
      value = await result.current.gate(action);
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledTimes(1);
    expect(value).toBe('allowed');
    expect(mockShowAccessRestrictedModal).not.toHaveBeenCalled();
  });

  it('trusts a blocked prefetch result without re-checking on gate', async () => {
    mockSubmitRequestToBackground.mockResolvedValueOnce([
      getStatus(ADDRESS, true),
    ]);
    const action = jest.fn();
    const { result } = renderHook(() => useComplianceGate(ADDRESS), {
      wrapper: getWrapper(),
    });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.gate(action);
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
    expect(action).not.toHaveBeenCalled();
    expect(mockShowAccessRestrictedModal).toHaveBeenCalledTimes(1);
  });

  it('fails open when the compliance API rejects', async () => {
    mockSubmitRequestToBackground.mockRejectedValueOnce(new Error('offline'));
    const action = jest.fn().mockReturnValue('allowed');
    const { result } = renderHook(() => useComplianceGate(ADDRESS), {
      wrapper: getWrapper(),
    });

    let value: string | undefined;
    await act(async () => {
      value = await result.current.gate(action);
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(value).toBe('allowed');
    expect(mockShowAccessRestrictedModal).not.toHaveBeenCalled();
  });

  it('fails open and does not retry after a rejected prefetch', async () => {
    // A rejected prefetch fails open (not blocked). gate() must not issue its
    // own retry check — subsequent actions simply proceed until the next
    // address-change prefetch refreshes the cached status. The call-count
    // assertion below proves no retry request is made.
    mockSubmitRequestToBackground.mockRejectedValueOnce(new Error('offline'));
    const firstAction = jest.fn().mockReturnValue('allowed');
    const secondAction = jest.fn().mockReturnValue('allowed-again');
    const { result } = renderHook(() => useComplianceGate(ADDRESS), {
      wrapper: getWrapper(),
    });

    await act(async () => {
      await Promise.resolve();
    });

    let firstValue: string | undefined;
    await act(async () => {
      firstValue = await result.current.gate(firstAction);
    });

    let secondValue: string | undefined;
    await act(async () => {
      secondValue = await result.current.gate(secondAction);
    });

    expect(firstAction).toHaveBeenCalledTimes(1);
    expect(secondAction).toHaveBeenCalledTimes(1);
    expect(firstValue).toBe('allowed');
    expect(secondValue).toBe('allowed-again');
    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
    expect(mockShowAccessRestrictedModal).not.toHaveBeenCalled();
  });

  it('blocks when the background returns a cached blocked status', async () => {
    mockSubmitRequestToBackground.mockResolvedValueOnce([
      getStatus(ADDRESS, true),
    ]);
    const action = jest.fn();
    const { result } = renderHook(() => useComplianceGate(ADDRESS), {
      wrapper: getWrapper(
        getState({
          walletComplianceStatusMap: {
            [ADDRESS]: getStatus(ADDRESS, true),
          },
        }),
      ),
    });

    await act(async () => {
      await result.current.gate(action);
    });

    expect(action).not.toHaveBeenCalled();
    expect(mockShowAccessRestrictedModal).toHaveBeenCalledTimes(1);
  });

  it('resets stale blocked results after the address changes', async () => {
    mockSubmitRequestToBackground
      .mockResolvedValueOnce([getStatus(BLOCKED_ADDRESS, true)])
      .mockResolvedValueOnce([getStatus(ADDRESS, false)]);
    const action = jest.fn();
    const { result, rerender } = renderHook<
      { address: string },
      ReturnType<typeof useComplianceGate>
    >(({ address }) => useComplianceGate(address), {
      initialProps: { address: BLOCKED_ADDRESS },
      wrapper: getWrapper(),
    });

    await act(async () => {
      await Promise.resolve();
    });

    rerender({ address: ADDRESS });

    await act(async () => {
      await result.current.gate(action);
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(mockShowAccessRestrictedModal).not.toHaveBeenCalled();
  });

  it('abandons the gated action when the wallet switches while a check is in flight', async () => {
    const deferredA = createDeferred<WalletComplianceStatus[]>();
    mockSubmitRequestToBackground
      .mockReturnValueOnce(deferredA.promise) // wallet A prefetch (in flight)
      .mockResolvedValueOnce([getStatus(ADDRESS, false)]); // wallet B prefetch
    const action = jest.fn();
    const { result, rerender } = renderHook<
      { address: string },
      ReturnType<typeof useComplianceGate>
    >(({ address }) => useComplianceGate(address), {
      initialProps: { address: BLOCKED_ADDRESS },
      wrapper: getWrapper(),
    });

    // Start the gated action while wallet A's prefetch is still in flight, then
    // switch to wallet B before A resolves.
    const gatePromise = result.current.gate(action);
    rerender({ address: ADDRESS });

    await act(async () => {
      deferredA.resolve([getStatus(BLOCKED_ADDRESS, false)]);
      await gatePromise;
    });

    // The action belonged to wallet A, which is no longer selected: run nothing.
    expect(action).not.toHaveBeenCalled();
    expect(mockShowAccessRestrictedModal).not.toHaveBeenCalled();
  });

  it('does not show a stale restricted modal when the wallet switches mid-check', async () => {
    const deferredA = createDeferred<WalletComplianceStatus[]>();
    mockSubmitRequestToBackground
      .mockReturnValueOnce(deferredA.promise) // wallet A prefetch (in flight)
      .mockResolvedValueOnce([getStatus(ADDRESS, false)]); // wallet B prefetch
    const action = jest.fn();
    const { result, rerender } = renderHook<
      { address: string },
      ReturnType<typeof useComplianceGate>
    >(({ address }) => useComplianceGate(address), {
      initialProps: { address: BLOCKED_ADDRESS },
      wrapper: getWrapper(),
    });

    const gatePromise = result.current.gate(action);
    rerender({ address: ADDRESS });

    await act(async () => {
      // Wallet A resolves blocked, but the user already switched to wallet B.
      deferredA.resolve([getStatus(BLOCKED_ADDRESS, true)]);
      await gatePromise;
    });

    // Wallet A's blocked verdict must not surface a modal for wallet B.
    expect(mockShowAccessRestrictedModal).not.toHaveBeenCalled();
    expect(action).not.toHaveBeenCalled();
  });
});
