import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { getInternalAccountByAddress } from '../../../selectors';
import useConfirmationRecipientInfo from './useConfirmationRecipientInfo';

const SenderAddress = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

describe('useConfirmationRecipientInfo', () => {
  describe('when the current confirmation is a signature', () => {
    it('returns the account name of the from address as the recipient name', () => {
      const { result } = renderHookWithProvider(
        () => useConfirmationRecipientInfo(),
        {
          ...mockState,
          confirm: {
            currentConfirmation: {
              id: '1',
              msgParams: { from: SenderAddress },
            },
          },
        },
      );

      const expectedAccount = getInternalAccountByAddress(
        mockState,
        SenderAddress,
      );

      expect(result.current.senderAddress).toBe(SenderAddress);
      expect(result.current.senderName).toBe(expectedAccount.metadata.name);
    });
  });

  it('returns empty strings if there if current confirmation is not defined', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationRecipientInfo(),
      mockState,
    );

    expect(result.current.senderAddress).toBe('');
    expect(result.current.senderName).toBe('');
  });
});
