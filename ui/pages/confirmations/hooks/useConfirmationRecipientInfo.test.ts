import {
  getMockTypedSignConfirmState,
  getMockConfirmState,
} from '../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import useConfirmationRecipientInfo from './useConfirmationRecipientInfo';

const SenderAddress = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

describe('useConfirmationRecipientInfo', () => {
  it('returns the account group name as the sender name', () => {
    const mockState = getMockTypedSignConfirmState();

    const { result } = renderHookWithConfirmContextProvider(
      () => useConfirmationRecipientInfo(),
      mockState,
    );

    expect(result.current.senderAddress).toBe(SenderAddress);
    expect(result.current.senderName).toBe('Account 1');
    expect(result.current.walletName).toBe('Wallet 1');
    expect(result.current.hasMoreThanOneWallet).toBe(true);
  });

  it('returns empty strings if current confirmation is not defined', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useConfirmationRecipientInfo(),
      getMockConfirmState(),
    );

    expect(result.current.senderAddress).toBe('');
    expect(result.current.senderName).toBe('');
  });
});
