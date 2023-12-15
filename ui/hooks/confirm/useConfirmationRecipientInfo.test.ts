import mockState from '../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import useConfirmationRecipientInfo from './useConfirmationRecipientInfo';

describe('useConfirmationRecipientInfo', () => {
  it('returns recipientName as the account name of the from address', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationRecipientInfo(),
      {
        ...mockState,
        confirm: {
          currentConfirmation: {
            id: '1',
            msgParams: { from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc' },
          },
        },
      },
    );

    expect(result.current.recipientName).toBe('Test Account');
  });
});
