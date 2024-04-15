import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import useConfirmationRecipientInfo from './useConfirmationRecipientInfo';

const RecipientAddress = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

describe('useConfirmationRecipientInfo', () => {
  describe('when the current confirimation is a signature', () => {
    it('returns the account name of the from address as the recipient name', () => {
      const { result } = renderHookWithProvider(
        () => useConfirmationRecipientInfo(),
        {
          ...mockState,
          confirm: {
            currentConfirmation: {
              id: '1',
              msgParams: { from: RecipientAddress },
            },
          },
        },
      );

      expect(result.current.recipientAddress).toBe(RecipientAddress);
      expect(result.current.recipientName).toBe(
        mockState.metamask.identities[RecipientAddress].name,
      );
    });
  });

  it('returns empty strings if there if current confirmation is not defined', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationRecipientInfo(),
      mockState,
    );

    expect(result.current.recipientAddress).toBe('');
    expect(result.current.recipientName).toBe('');
  });
});
