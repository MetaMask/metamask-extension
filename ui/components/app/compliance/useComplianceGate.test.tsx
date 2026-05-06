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

  it('fails open when the compliance API rejects even if cached state is blocked', async () => {
    mockSubmitRequestToBackground.mockRejectedValueOnce(new Error('offline'));
    const action = jest.fn().mockReturnValue('allowed');
    const { result } = renderHook(() => useComplianceGate(ADDRESS), {
      wrapper: getWrapper(
        getState({
          walletComplianceStatusMap: {
            [ADDRESS]: getStatus(ADDRESS, true),
          },
        }),
      ),
    });

    let value: string | undefined;
    await act(async () => {
      value = await result.current.gate(action);
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(value).toBe('allowed');
    expect(mockShowAccessRestrictedModal).not.toHaveBeenCalled();
  });

  it('resets stale blocked results after the address changes', async () => {
    mockSubmitRequestToBackground
      .mockResolvedValueOnce([getStatus(BLOCKED_ADDRESS, true)])
      .mockResolvedValueOnce([getStatus(ADDRESS, false)]);
    const action = jest.fn();
    const { result, rerender } = renderHook<
      { address: string },
      ReturnType<typeof useComplianceGate>
    >(
      ({ address }) => useComplianceGate(address),
      {
        initialProps: { address: BLOCKED_ADDRESS },
        wrapper: getWrapper(),
      },
    );

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
});
