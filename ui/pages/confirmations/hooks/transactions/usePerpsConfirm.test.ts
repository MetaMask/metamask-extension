import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { renderHook } from '@testing-library/react-hooks';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import { usePerpsConfirm } from './usePerpsConfirm';

describe('usePerpsConfirm', () => {
  it('returns the perps tab route for perpsDeposit transactions', () => {
    const { result } = renderHook(() =>
      usePerpsConfirm({
        type: TransactionType.perpsDeposit,
      } as TransactionMeta),
    );

    expect(result.current.postConfirmRoute).toBe(
      `${DEFAULT_ROUTE}?tab=perps`,
    );
  });

  it('returns undefined for non-perps transaction types', () => {
    const { result } = renderHook(() =>
      usePerpsConfirm({
        type: TransactionType.contractInteraction,
      } as TransactionMeta),
    );

    expect(result.current.postConfirmRoute).toBeUndefined();
  });

  it('returns undefined when no transaction meta is provided', () => {
    const { result } = renderHook(() => usePerpsConfirm());

    expect(result.current.postConfirmRoute).toBeUndefined();
  });
});
