import type { SimilarAddressMatch } from '@metamask/phishing-controller';
import { renderHook } from '@testing-library/react-hooks';
import { checkAddressPoisoning } from '../../../../store/actions';
import { useAddressPoisoningDetection } from './useAddressPoisoningDetection';

jest.mock('../../../../store/actions', () => ({
  checkAddressPoisoning: jest.fn(),
}));

const mockCheckAddressPoisoning = jest.mocked(checkAddressPoisoning);

describe('useAddressPoisoningDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns no suspect when address is undefined', () => {
    const { result } = renderHook(() =>
      useAddressPoisoningDetection(undefined),
    );

    expect(result.current).toEqual({
      isPoisoningSuspect: false,
      bestMatch: null,
      matches: [],
      pending: false,
    });
    expect(mockCheckAddressPoisoning).not.toHaveBeenCalled();
  });

  it('detects a poisoning suspect when matches are returned', async () => {
    const match = {
      knownAddress: '0x111122223333444455556666777788889999aaaa',
      prefixMatchLength: 4,
      suffixMatchLength: 4,
      poisoningScore: 8,
      diffIndices: [6, 7],
    };
    mockCheckAddressPoisoning.mockResolvedValue([match]);

    const { result, waitFor } = renderHook(() =>
      useAddressPoisoningDetection(
        '0x1111ffffffffffffffffffffffffffffffffaaaa',
      ),
    );

    expect(mockCheckAddressPoisoning).toHaveBeenCalledWith(
      '0x1111ffffffffffffffffffffffffffffffffaaaa',
    );

    await waitFor(() => result.current.pending === false);

    expect(result.current).toEqual({
      isPoisoningSuspect: true,
      bestMatch: match,
      matches: [match],
      pending: false,
    });
  });

  it('returns pending immediately for a new address before the effect starts', () => {
    mockCheckAddressPoisoning.mockReturnValue(
      new Promise<SimilarAddressMatch[]>(() => undefined),
    );

    const { result } = renderHook(() =>
      useAddressPoisoningDetection(
        '0x1111ffffffffffffffffffffffffffffffffaaaa',
      ),
    );

    expect(result.current).toEqual({
      isPoisoningSuspect: false,
      bestMatch: null,
      matches: [],
      pending: true,
    });
  });

  it('clears stale matches while a new address check is pending', async () => {
    const firstAddress = '0x1111ffffffffffffffffffffffffffffffffaaaa';
    const secondAddress = '0x2222ffffffffffffffffffffffffffffffffbbbb';
    const match = {
      knownAddress: '0x111122223333444455556666777788889999aaaa',
      prefixMatchLength: 4,
      suffixMatchLength: 4,
      poisoningScore: 8,
      diffIndices: [6, 7],
    };
    const pendingCheck = new Promise<SimilarAddressMatch[]>(() => undefined);
    mockCheckAddressPoisoning
      .mockResolvedValueOnce([match])
      .mockReturnValueOnce(pendingCheck);

    const { result, rerender, waitFor } = renderHook(
      ({ address }) => useAddressPoisoningDetection(address),
      {
        initialProps: { address: firstAddress },
      },
    );

    await waitFor(() => result.current.pending === false);
    expect(result.current.bestMatch).toBe(match);

    rerender({ address: secondAddress });

    expect(result.current).toEqual({
      isPoisoningSuspect: false,
      bestMatch: null,
      matches: [],
      pending: true,
    });
  });

  it('returns no suspect when no similar addresses are found', async () => {
    mockCheckAddressPoisoning.mockResolvedValue([]);

    const { result, waitFor } = renderHook(() =>
      useAddressPoisoningDetection(
        '0x22223333444455556666777788889999aaaabbbb',
      ),
    );

    await waitFor(() => result.current.pending === false);

    expect(result.current.isPoisoningSuspect).toBe(false);
    expect(result.current.bestMatch).toBeNull();
    expect(result.current.matches).toEqual([]);
  });

  it('fails closed when the background check returns an invalid response', async () => {
    mockCheckAddressPoisoning.mockResolvedValue(
      undefined as unknown as SimilarAddressMatch[],
    );

    const { result, waitFor } = renderHook(() =>
      useAddressPoisoningDetection(
        '0x22223333444455556666777788889999aaaabbbb',
      ),
    );

    await waitFor(() => result.current.pending === false);

    expect(result.current).toEqual({
      isPoisoningSuspect: false,
      bestMatch: null,
      matches: [],
      pending: false,
    });
  });

  it('fails closed when the background check rejects', async () => {
    mockCheckAddressPoisoning.mockRejectedValue(new Error('failed'));

    const { result, waitFor } = renderHook(() =>
      useAddressPoisoningDetection(
        '0x22223333444455556666777788889999aaaabbbb',
      ),
    );

    await waitFor(() => result.current.pending === false);

    expect(result.current.isPoisoningSuspect).toBe(false);
    expect(result.current.matches).toEqual([]);
  });
});
