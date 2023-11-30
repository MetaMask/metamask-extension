import { TransactionType } from '@metamask/transaction-controller';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers';
import useDescription from './useDescription';

describe('useDescription', () => {
  it('should return the description for personalSign transaction type', () => {
    const { result } = renderHookWithProvider(() => useDescription(), {
      confirm: {
        currentConfirmation: {
          type: TransactionType.personalSign,
        },
      },
    });

    expect(result.current).toBe(
      'Only sign this message if you fully understand the content and trust the requesting site.',
    );
  });
});
