import { renderHook, act } from '@testing-library/react-hooks';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { getCurrentChainId } from '../../../shared/lib/selectors/networks';
import { getIsVipProgramEnabled } from '../../selectors/perps/feature-flags';
import {
  clearPerpsFeeDiscountCacheForTests,
  usePerpsMetamaskFeeDiscountBips,
} from './usePerpsMetamaskFeeDiscountBips';

const mockSubmitRequestToBackground = jest.fn();
jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

const TEST_ADDRESS = '0xabc0000000000000000000000000000000000def';
const TEST_CHAIN_ID = '0xa4b1'; // Arbitrum One (42161)
const TEST_CAIP_ACCOUNT_ID = `eip155:42161:${toChecksumHexAddress(
  TEST_ADDRESS,
)}`;
const ORIGINAL_METAMASK_FEE_BIPS = 10;

function setSelectors(
  overrides: {
    address?: string | null;
    chainId?: string;
    vipProgramEnabled?: boolean;
  } = {},
) {
  const address = 'address' in overrides ? overrides.address : TEST_ADDRESS;
  const chainId = overrides.chainId ?? TEST_CHAIN_ID;
  const vipProgramEnabled = overrides.vipProgramEnabled ?? true;
  mockUseSelector.mockImplementation((selector) => {
    if (selector === getSelectedInternalAccount) {
      return address ? { address } : undefined;
    }
    if (selector === getCurrentChainId) {
      return chainId;
    }
    if (selector === getIsVipProgramEnabled) {
      return vipProgramEnabled;
    }
    return undefined;
  });
}

function setDiscountResponse(discountBips: number | null | Error) {
  mockSubmitRequestToBackground.mockImplementation((method: string) => {
    if (method === 'rewardsGetPerpsDiscountForAccount') {
      if (discountBips instanceof Error) {
        return Promise.reject(discountBips);
      }
      return Promise.resolve(discountBips);
    }
    return Promise.resolve(undefined);
  });
}

describe('usePerpsMetamaskFeeDiscountBips', () => {
  beforeEach(() => {
    mockSubmitRequestToBackground.mockReset();
    mockUseSelector.mockReset();
    clearPerpsFeeDiscountCacheForTests();
    setSelectors();
  });

  it('returns undefined while the discount lookup is in flight', () => {
    mockSubmitRequestToBackground.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() =>
      usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS),
    );
    expect(result.current).toBeUndefined();
  });

  it('returns the discount in basis points when > 0', async () => {
    setDiscountResponse(5000);

    const { result, waitForNextUpdate } = renderHook(() =>
      usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS),
    );
    await waitForNextUpdate();

    expect(result.current).toBe(5000);
  });

  it('caps the discount at 10000 bips (100%)', async () => {
    setDiscountResponse(12000);

    const { result, waitForNextUpdate } = renderHook(() =>
      usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS),
    );
    await waitForNextUpdate();

    expect(result.current).toBe(10000);
  });

  it('returns undefined when bips is exactly 0', async () => {
    setDiscountResponse(0);

    const { result } = renderHook(() =>
      usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS),
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBeUndefined();
  });

  it('returns undefined when the controller returns null (unhydrated / non-eligible)', async () => {
    setDiscountResponse(null);

    const { result } = renderHook(() =>
      usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS),
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBeUndefined();
  });

  it('swallows a thrown discount lookup (returns undefined, no error surfaced)', async () => {
    setDiscountResponse(new Error('network down'));

    const { result } = renderHook(() =>
      usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS),
    );
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current).toBeUndefined();
  });

  it('returns undefined and skips the lookup when vipProgramEnabled is false', async () => {
    setSelectors({ vipProgramEnabled: false });
    setDiscountResponse(5000);

    const { result } = renderHook(() =>
      usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS),
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBeUndefined();
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('returns undefined and skips the lookup entirely when no account is selected', async () => {
    setSelectors({ address: null });
    setDiscountResponse(5000);

    const { result } = renderHook(() =>
      usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS),
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBeUndefined();
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('returns undefined when the chain id cannot be parsed to CAIP-10', async () => {
    setSelectors({ chainId: 'not-a-chain-id' });
    setDiscountResponse(5000);

    const { result } = renderHook(() =>
      usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS),
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current).toBeUndefined();
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('calls rewardsGetPerpsDiscountForAccount with the CAIP-10 id and the original MM fee bips', async () => {
    setDiscountResponse(2500);

    const { waitForNextUpdate } = renderHook(() =>
      usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS),
    );
    await waitForNextUpdate();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'rewardsGetPerpsDiscountForAccount',
      [TEST_CAIP_ACCOUNT_ID, ORIGINAL_METAMASK_FEE_BIPS],
    );
  });

  it('caches a non-null discount across rerenders for the same address', async () => {
    setDiscountResponse(2000);

    const { waitForNextUpdate, rerender, result } = renderHook(() =>
      usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS),
    );
    await waitForNextUpdate();
    expect(result.current).toBe(2000);

    // Force a re-render — the effect deps (selectedAddress, currentChainId)
    // haven't changed, so the effect shouldn't re-fire. Even if it did, the
    // cache should keep the call count at 1.
    rerender();

    const discountCalls = mockSubmitRequestToBackground.mock.calls.filter(
      (call) => call[0] === 'rewardsGetPerpsDiscountForAccount',
    );
    expect(discountCalls).toHaveLength(1);
    expect(result.current).toBe(2000);
  });

  it('serves the cached discount synchronously on a fresh mount (no extra background call)', async () => {
    setDiscountResponse(3000);

    // First mount: populates the cache.
    const first = renderHook(() =>
      usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS),
    );
    await first.waitForNextUpdate();
    expect(first.result.current).toBe(3000);
    first.unmount();

    // Second mount with the same address: should hit the cache and not call
    // the background again.
    const second = renderHook(() =>
      usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS),
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(second.result.current).toBe(3000);
    const discountCalls = mockSubmitRequestToBackground.mock.calls.filter(
      (call) => call[0] === 'rewardsGetPerpsDiscountForAccount',
    );
    expect(discountCalls).toHaveLength(1);
  });

  it('refetches when the chain changes for the same address (cache is keyed by CAIP account id)', async () => {
    setDiscountResponse(2000);

    const { rerender, result, waitForNextUpdate } = renderHook(
      ({ chainId }: { chainId: string }) => {
        setSelectors({ chainId });
        return usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS);
      },
      { initialProps: { chainId: TEST_CHAIN_ID } },
    );
    await waitForNextUpdate();
    expect(result.current).toBe(2000);

    // Switch to a different chain for the same address. The CAIP account id
    // changes, so the cache must miss and the background must be called again.
    setDiscountResponse(4000);
    rerender({ chainId: '0x1' });
    await waitForNextUpdate();
    expect(result.current).toBe(4000);

    const discountCalls = mockSubmitRequestToBackground.mock.calls.filter(
      (call) => call[0] === 'rewardsGetPerpsDiscountForAccount',
    );
    expect(discountCalls).toHaveLength(2);
    expect(discountCalls[0][1][0]).toBe(TEST_CAIP_ACCOUNT_ID);
    expect(discountCalls[1][1][0]).toBe(
      `eip155:1:${toChecksumHexAddress(TEST_ADDRESS)}`,
    );
  });

  it('does not cache a null discount (refetches on next effect run)', async () => {
    setDiscountResponse(null);

    const { rerender } = renderHook(
      ({ chainId }: { chainId: string }) => {
        setSelectors({ chainId });
        return usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS);
      },
      { initialProps: { chainId: TEST_CHAIN_ID } },
    );
    // Flush the initial null lookup. `waitForNextUpdate` would hang here
    // because the hook stays at its initial `undefined` value — there's no
    // state change to await.
    await act(async () => {
      await Promise.resolve();
    });

    // Changing chainId re-runs the effect.
    rerender({ chainId: '0x1' });
    await act(async () => {
      await Promise.resolve();
    });

    const discountCalls = mockSubmitRequestToBackground.mock.calls.filter(
      (call) => call[0] === 'rewardsGetPerpsDiscountForAccount',
    );
    expect(discountCalls).toHaveLength(2);
  });

  it('resets to undefined immediately when the account switches before the new fetch resolves', async () => {
    // First account resolves to 5000.
    setDiscountResponse(5000);
    const { rerender, result, waitForNextUpdate } = renderHook(
      ({ address }: { address: string }) => {
        setSelectors({ address });
        return usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS);
      },
      { initialProps: { address: TEST_ADDRESS } },
    );
    await waitForNextUpdate();
    expect(result.current).toBe(5000);

    // Switch to a new address. New fetch is deliberately never resolved.
    mockSubmitRequestToBackground.mockReturnValue(new Promise(() => undefined));
    rerender({ address: '0x1111111111111111111111111111111111111111' });

    // The previous discount must be cleared synchronously — before the new
    // fetch settles — so downstream memos don't apply account-A's discount
    // to account-B's trades.
    expect(result.current).toBeUndefined();
  });

  it('does not update state after unmount', async () => {
    let resolveDiscount!: (v: number | null) => void;
    mockSubmitRequestToBackground.mockImplementation((method: string) => {
      if (method === 'rewardsGetPerpsDiscountForAccount') {
        return new Promise<number | null>((res) => {
          resolveDiscount = res;
        });
      }
      return Promise.resolve(undefined);
    });

    const { result, unmount } = renderHook(() =>
      usePerpsMetamaskFeeDiscountBips(ORIGINAL_METAMASK_FEE_BIPS),
    );

    unmount();

    await act(async () => {
      resolveDiscount(5000);
      await Promise.resolve();
    });

    // result.current sticks to the last value rendered before unmount.
    expect(result.current).toBeUndefined();
  });
});
