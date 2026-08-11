import { act, renderHook } from '@testing-library/react';
import type { Hex } from '@metamask/utils';

import { usePerpsWithdrawMultiSigCheck } from './usePerpsWithdrawMultiSigCheck';

let mockSelectedAccount: { address: Hex } | null = {
  address: '0x000000000000000000000000000000000000a001' as Hex,
};
let mockIsTestnet = false;
const mockFetch = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('../../../../selectors', () => ({
  getSelectedEvmInternalAccount: () => mockSelectedAccount,
}));

jest.mock('../../../../selectors/perps-controller', () => ({
  selectPerpsIsTestnet: () => mockIsTestnet,
}));

jest.mock('../../../../../shared/lib/fetch-with-timeout', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => mockFetch,
}));

// The hook holds a session-scoped cache keyed by address. Each test uses a
// unique address so the cache starts empty per test.
let addressCounter = 0;
function nextAddress(): Hex {
  addressCounter += 1;
  const n = addressCounter.toString(16).padStart(4, '0');
  return `0x000000000000000000000000000000000000b${n}` as Hex;
}

function mockResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => body,
  };
}

describe('usePerpsWithdrawMultiSigCheck', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockIsTestnet = false;
  });

  it('returns a checkIsMultiSigAccount function', () => {
    mockSelectedAccount = { address: nextAddress() };
    const { result } = renderHook(() => usePerpsWithdrawMultiSigCheck());
    expect(result.current.checkIsMultiSigAccount).toBeInstanceOf(Function);
  });

  it('resolves false without fetching when no EVM account is selected', async () => {
    mockSelectedAccount = null;
    const { result } = renderHook(() => usePerpsWithdrawMultiSigCheck());

    let value: boolean | undefined;
    await act(async () => {
      value = await result.current.checkIsMultiSigAccount();
    });

    expect(value).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('resolves false without fetching in testnet mode', async () => {
    mockSelectedAccount = { address: nextAddress() };
    mockIsTestnet = true;
    const { result } = renderHook(() => usePerpsWithdrawMultiSigCheck());

    let value: boolean | undefined;
    await act(async () => {
      value = await result.current.checkIsMultiSigAccount();
    });

    expect(value).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('resolves true when the account is a HyperLiquid multi-sig user', async () => {
    const address = nextAddress();
    mockSelectedAccount = { address };
    mockFetch.mockResolvedValue(
      mockResponse({ authorizedUsers: ['0xabc'], threshold: 2 }),
    );
    const { result } = renderHook(() => usePerpsWithdrawMultiSigCheck());

    let value: boolean | undefined;
    await act(async () => {
      value = await result.current.checkIsMultiSigAccount();
    });

    expect(value).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.hyperliquid.xyz/info',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('resolves false when the account is not a multi-sig user', async () => {
    const address = nextAddress();
    mockSelectedAccount = { address };
    mockFetch.mockResolvedValue(mockResponse(null));
    const { result } = renderHook(() => usePerpsWithdrawMultiSigCheck());

    let value: boolean | undefined;
    await act(async () => {
      value = await result.current.checkIsMultiSigAccount();
    });

    expect(value).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('fails open (resolves false) when the fetch rejects', async () => {
    const address = nextAddress();
    mockSelectedAccount = { address };
    mockFetch.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => usePerpsWithdrawMultiSigCheck());

    let value: boolean | undefined;
    await act(async () => {
      value = await result.current.checkIsMultiSigAccount();
    });

    expect(value).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('fails open (resolves false) when the response is not ok', async () => {
    const address = nextAddress();
    mockSelectedAccount = { address };
    mockFetch.mockResolvedValue(mockResponse(null, false));
    const { result } = renderHook(() => usePerpsWithdrawMultiSigCheck());

    let value: boolean | undefined;
    await act(async () => {
      value = await result.current.checkIsMultiSigAccount();
    });

    expect(value).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('caches the result so a second mount does not fetch again', async () => {
    const address = nextAddress();
    mockSelectedAccount = { address };
    mockFetch.mockResolvedValue(
      mockResponse({ authorizedUsers: ['0xabc'], threshold: 1 }),
    );

    const first = renderHook(() => usePerpsWithdrawMultiSigCheck());
    let firstValue: boolean | undefined;
    await act(async () => {
      firstValue = await first.result.current.checkIsMultiSigAccount();
    });

    const second = renderHook(() => usePerpsWithdrawMultiSigCheck());
    let secondValue: boolean | undefined;
    await act(async () => {
      secondValue = await second.result.current.checkIsMultiSigAccount();
    });

    expect(firstValue).toBe(true);
    expect(secondValue).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
