import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { getSelectedInternalAccount } from '../../../selectors/accounts';
import {
  getPerpsStreamManager,
  resetPerpsStreamManager,
} from '../../../providers/perps/PerpsStreamManager';
import { usePerpsStreamManager } from './usePerpsStreamManager';

const mockSubmitRequestToBackground = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('../../../selectors/accounts', () => ({
  getSelectedInternalAccount: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../providers/perps/CandleStreamChannel', () => ({
  CandleStreamChannel: jest.fn().mockImplementation(() => ({
    clearAll: jest.fn(),
  })),
}));

let uuidCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
  value: {
    ...globalThis.crypto,
    randomUUID: () => `test-uuid-${(uuidCounter += 1)}`,
  },
});

const getSelectedMock = getSelectedInternalAccount as jest.MockedFunction<
  typeof getSelectedInternalAccount
>;
const useSelectorMock = useSelector as jest.MockedFunction<typeof useSelector>;

describe('usePerpsStreamManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockReset();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
    resetPerpsStreamManager();
    uuidCounter = 0;

    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: unknown) => unknown)({}),
    );
  });

  afterEach(() => {
    resetPerpsStreamManager();
  });

  it('returns error and null streamManager when no account is selected', () => {
    // Selector can be undefined during onboarding; production type is narrowed.
    getSelectedMock.mockReturnValue(undefined as never);

    const { result } = renderHook(() => usePerpsStreamManager());

    expect(result.current.streamManager).toBeNull();
    expect(result.current.error?.message).toBe('No account selected');
    expect(result.current.isInitializing).toBe(false);
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('exposes streamManager after initForAddress resolves', async () => {
    getSelectedMock.mockReturnValue({ address: '0xready' } as never);

    const { result } = renderHook(() => usePerpsStreamManager());

    await waitFor(() => {
      expect(result.current.streamManager).not.toBeNull();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isInitializing).toBe(false);
    expect(getPerpsStreamManager().isInitialized('0xready')).toBe(true);
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith('perpsInit');
  });

  it('does not call initForAddress when already initialized for that address', async () => {
    getSelectedMock.mockReturnValue({
      address: '0xcached',
    } as never);

    await getPerpsStreamManager().initForAddress('0xcached');
    mockSubmitRequestToBackground.mockClear();

    const { result } = renderHook(() => usePerpsStreamManager());

    await waitFor(() => {
      expect(result.current.streamManager).not.toBeNull();
    });

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('sets error when initForAddress rejects', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    getSelectedMock.mockReturnValue({
      address: '0xbad',
    } as never);

    mockSubmitRequestToBackground.mockRejectedValue(new Error('rpc failed'));

    const { result } = renderHook(() => usePerpsStreamManager());

    await waitFor(() => {
      expect(result.current.error?.message).toBe('rpc failed');
    });

    expect(result.current.streamManager).toBeNull();
    expect(result.current.isInitializing).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('ignores stale init completion after selected address changes', async () => {
    let releaseFirstInit: (() => void) | undefined;
    const firstInitGate = new Promise<void>((resolve) => {
      releaseFirstInit = resolve;
    });

    let perpsInitCount = 0;
    mockSubmitRequestToBackground.mockImplementation(async (method: string) => {
      if (method === 'perpsDisconnect') {
        return undefined;
      }
      if (method === 'perpsInit') {
        perpsInitCount += 1;
        if (perpsInitCount === 1) {
          await firstInitGate;
        }
        return undefined;
      }
      return undefined;
    });

    getSelectedMock.mockReturnValue({ address: '0xA' } as never);

    const { result, rerender } = renderHook(() => usePerpsStreamManager());

    await waitFor(() => {
      expect(result.current.isInitializing).toBe(true);
    });

    getSelectedMock.mockReturnValue({ address: '0xB' } as never);

    await act(async () => {
      rerender();
    });

    await waitFor(() => {
      expect(result.current.streamManager).not.toBeNull();
    });

    expect(getPerpsStreamManager().getCurrentAddress()).toBe('0xB');

    expect(releaseFirstInit).toBeDefined();
    if (releaseFirstInit === undefined) {
      throw new Error('releaseFirstInit not set by Promise executor');
    }
    const releaseStaleInit = releaseFirstInit;

    await act(async () => {
      releaseStaleInit();
    });

    await waitFor(() => {
      expect(getPerpsStreamManager().getCurrentAddress()).toBe('0xB');
    });
  });
});
