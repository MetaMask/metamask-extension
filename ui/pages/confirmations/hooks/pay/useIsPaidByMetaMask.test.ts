import { renderHook } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import type { TransactionPayTotals } from '@metamask/transaction-pay-controller';
import { useConfirmContext } from '../../context/confirm';
import { useTransactionPayTotals } from './useTransactionPayData';
import { useIsPaidByMetaMask } from './useIsPaidByMetaMask';

jest.mock('../../context/confirm');
jest.mock('./useTransactionPayData');

const useConfirmContextMock = jest.mocked(useConfirmContext);
const useTransactionPayTotalsMock = jest.mocked(useTransactionPayTotals);

function mockConfirmation(type: TransactionType) {
  useConfirmContextMock.mockReturnValue({
    currentConfirmation: { type },
  } as ReturnType<typeof useConfirmContext>);
}

function mockTotals(overrides?: Partial<TransactionPayTotals['fees']>) {
  useTransactionPayTotalsMock.mockReturnValue({
    fees: {
      sourceNetwork: { estimate: { usd: '0' } },
      targetNetwork: { usd: '0' },
      provider: { usd: '0' },
      metaMask: { usd: '0' },
      ...overrides,
    },
  } as TransactionPayTotals);
}

describe('useIsPaidByMetaMask', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockConfirmation(TransactionType.musdConversion);
    mockTotals();
  });

  it('returns true when all fees are zero for musdConversion', () => {
    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(true);
  });

  it('returns false when sourceNetwork fee is non-zero', () => {
    mockTotals({
      sourceNetwork: { estimate: { usd: '0.01' } },
    } as TransactionPayTotals['fees']);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false when targetNetwork fee is non-zero', () => {
    mockTotals({
      targetNetwork: { usd: '0.05' },
    } as TransactionPayTotals['fees']);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false when provider fee is non-zero', () => {
    mockTotals({
      provider: { usd: '1.00' },
    } as TransactionPayTotals['fees']);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false when metaMask fee is non-zero', () => {
    mockTotals({
      metaMask: { usd: '0.50' },
    } as TransactionPayTotals['fees']);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false for non-musdConversion transaction types', () => {
    mockConfirmation(TransactionType.simpleSend);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false when totals are undefined', () => {
    useTransactionPayTotalsMock.mockReturnValue(undefined);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false when fees are undefined', () => {
    useTransactionPayTotalsMock.mockReturnValue({} as TransactionPayTotals);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false when currentConfirmation is undefined', () => {
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: undefined,
    } as ReturnType<typeof useConfirmContext>);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('handles missing metaMask fee gracefully (undefined)', () => {
    mockTotals({
      metaMask: undefined,
    } as unknown as TransactionPayTotals['fees']);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(true);
  });

  it('handles missing sourceNetwork.estimate gracefully', () => {
    mockTotals({
      sourceNetwork: {} as TransactionPayTotals['fees']['sourceNetwork'],
    } as TransactionPayTotals['fees']);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(true);
  });
});
