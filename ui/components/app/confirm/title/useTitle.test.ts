import { TransactionType } from '@metamask/transaction-controller';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import useTitle from './useTitle';

describe('useTitle', () => {
  it('should return the title for personalSign transaction type', () => {
    const { result } = renderHookWithProvider(() => useTitle(), {
      confirm: {
        currentConfirmation: {
          type: TransactionType.personalSign,
        },
      },
    });

    expect(result.current).toBe('Signature request');
  });
});
