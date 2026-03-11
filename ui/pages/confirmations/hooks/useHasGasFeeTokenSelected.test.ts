import { renderHook } from '@testing-library/react-hooks';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { useHasGasFeeTokenSelected } from './useHasGasFeeTokenSelected';

describe('useHasGasFeeTokenSelected', () => {
  it('returns false when transaction is undefined', () => {
    const { result } = renderHook(() => useHasGasFeeTokenSelected(undefined));
    expect(result.current).toBe(false);
  });

  it('returns false when transaction.selectedGasFeeToken is undefined', () => {
    const tx = {
      id: 'tx-1',
      txParams: {},
    } as TransactionMeta;
    const { result } = renderHook(() => useHasGasFeeTokenSelected(tx));
    expect(result.current).toBe(false);
  });

  it('returns false when transaction.selectedGasFeeToken is missing', () => {
    const tx = {
      id: 'tx-2',
      txParams: { from: '0x', to: '0x' },
    } as TransactionMeta;
    const { result } = renderHook(() => useHasGasFeeTokenSelected(tx));
    expect(result.current).toBe(false);
  });

  it('returns true when transaction.selectedGasFeeToken is set', () => {
    const tx = {
      id: 'tx-3',
      txParams: {},
      selectedGasFeeToken: '0xabc123',
    } as unknown as TransactionMeta;
    const { result } = renderHook(() => useHasGasFeeTokenSelected(tx));
    expect(result.current).toBe(true);
  });

  it('returns false when selectedGasFeeToken is empty string', () => {
    const tx = {
      id: 'tx-4',
      txParams: {},
      selectedGasFeeToken: '',
    } as unknown as TransactionMeta;
    const { result } = renderHook(() => useHasGasFeeTokenSelected(tx));
    expect(result.current).toBe(false);
  });
});
