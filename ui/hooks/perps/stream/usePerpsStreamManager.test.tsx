import { it } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSelector } from 'react-redux';
import {
  getPerpsStreamManager,
  resetPerpsStreamManager,
} from '../../../providers/perps/PerpsStreamManager';
import { getIsPerpsTerminalBackendEnabled } from '../../../selectors/perps';
import {
  getSelectedEvmInternalAccount,
  getUseExternalServices,
} from '../../../selectors';
import { usePerpsStreamManager } from './usePerpsStreamManager';

const mockSubmitRequestToBackground = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('../../../selectors', () => ({
  ...jest.requireActual('../../../selectors'),
  getSelectedEvmInternalAccount: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../providers/perps/CandleStreamChannel', () => ({
  CandleStreamChannel: jest.fn().mockImplementation(() => ({
    clearAll: jest.fn(),
    clearCache: jest.fn(),
  })),
}));

let uuidCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
  value: {
    ...globalThis.crypto,
    randomUUID: () => `test-uuid-${(uuidCounter += 1)}`,
  },
});

const getSelectedMock = getSelectedEvmInternalAccount as jest.MockedFunction<
  typeof getSelectedEvmInternalAccount
>;
const useSelectorMock = useSelector as jest.MockedFunction<typeof useSelector>;

describe('usePerpsStreamManager', () => {
  let useExternalServices = true;
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockReset();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
    resetPerpsStreamManager();
    uuidCounter = 0;
    useExternalServices = true;

    useSelectorMock.mockImplementation((selector) => {
      if (selector === getUseExternalServices) {
        return useExternalServices;
      }
      if (selector === getIsPerpsTerminalBackendEnabled) {
        return false;
      }
      return (selector as (s: unknown) => unknown)({});
    });
  });

  it.each([
    ['BTC', 'bc1qselected', 'bip122:p2wpkh'],
    ['Tron', 'TSelected', 'tron:eoa'],
  ])(
    'initializes the EVM session while %s is selected',
    async (name, address, type) => {
      const evm = {
        id: 'evm',
        address: '0xready',
        type: 'eip155:eoa',
        metadata: { name: 'EVM', lastSelected: 1 },
      };
      const nonEvm = {
        id: 'non-evm',
        address,
        type,
        metadata: { name, lastSelected: 2 },
      };
      const state = {
        metamask: {
          internalAccounts: {
            selectedAccount: nonEvm.id,
            accounts: { evm, nonEvm },
          },
        },
      };
      getSelectedMock.mockImplementation(
        jest.requireActual('../../../selectors').getSelectedEvmInternalAccount,
      );
      useSelectorMock.mockImplementation((selector) => {
        if (selector === getUseExternalServices) {
          return true;
        }
        if (selector === getIsPerpsTerminalBackendEnabled) {
          return false;
        }
        return selector(state as never);
      });

      const { result } = renderHook(() => usePerpsStreamManager());
      await waitFor(() => expect(result.current.streamManager).not.toBeNull());
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsInitForAccount',
        ['0xready'],
      );
      expect(result.current.selectedAddress).toBe('0xready');
    },
  );

  it('recovers without remount when Basic Functionality is enabled after initialization fails', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    getSelectedMock.mockReturnValue({ address: '0xready' } as never);
    mockSubmitRequestToBackground.mockRejectedValueOnce(
      new Error('Perps connection is unavailable'),
    );
    const { result, rerender } = renderHook(() => usePerpsStreamManager());
    await waitFor(() => expect(result.current.error).not.toBeNull());
    useExternalServices = false;
    rerender();
    expect(result.current.streamManager).toBeNull();
    useExternalServices = true;
    rerender();
    await waitFor(() => expect(result.current.streamManager).not.toBeNull());
    expect(result.current.error).toBeNull();
    consoleSpy.mockRestore();
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

  it('configures the market backend before initializing the manager', () => {
    const manager = getPerpsStreamManager();
    const setUseTerminalApiSpy = jest.spyOn(manager, 'setUseTerminalApi');
    manager.markets.pushData([{ symbol: 'ENS', name: 'ENS' }] as never[]);
    getSelectedMock.mockReturnValue(undefined as never);
    useSelectorMock.mockImplementation((selector) => {
      if (selector === getUseExternalServices) {
        return true;
      }
      if (selector === getIsPerpsTerminalBackendEnabled) {
        return true;
      }
      return (selector as (s: unknown) => unknown)({});
    });

    renderHook(() => usePerpsStreamManager());

    expect(setUseTerminalApiSpy).toHaveBeenCalledWith(true);
    expect(manager.markets.hasCachedData()).toBe(false);
    manager.setUseTerminalApi(false);
    setUseTerminalApiSpy.mockRestore();
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
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsInitForAccount',
      ['0xready'],
    );
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
      if (method === 'perpsInitForAccount') {
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

    // B waits for A's RPC to settle before starting its own initialization.
    expect(perpsInitCount).toBe(1);
    expect(result.current.streamManager).toBeNull();
    expect(result.current.selectedAddress).toBe('0xB');

    expect(releaseFirstInit).toBeDefined();
    if (releaseFirstInit === undefined) {
      throw new Error('releaseFirstInit not set by Promise executor');
    }
    const releaseStaleInit = releaseFirstInit;

    await act(async () => {
      releaseStaleInit();
    });

    await waitFor(() => {
      expect(result.current.streamManager).not.toBeNull();
    });
    expect(perpsInitCount).toBe(2);
    expect(getPerpsStreamManager().getCurrentAddress()).toBe('0xB');
  });
});
