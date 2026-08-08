import { renderHook } from '@testing-library/react-hooks';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';

import { useIsHardwareWalletAccount } from '../useIsHardwareWalletAccount';
import { useBridgeNavigation } from '../bridge/useBridgeNavigation';
import { useSendBundleAmountSymbol } from './useSendBundleAmountSymbol';
import { useSendBundleHwNavigation } from './useSendBundleHwNavigation';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../useIsHardwareWalletAccount');
jest.mock('../bridge/useBridgeNavigation');
jest.mock('./useSendBundleAmountSymbol');

const FROM = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

describe('useSendBundleHwNavigation', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    jest.mocked(useSelector).mockReturnValue(false);
    jest.mocked(useIsHardwareWalletAccount).mockReturnValue(true);
    jest.mocked(useBridgeNavigation).mockReturnValue({
      navigateToHwSigningPage: jest.fn(),
    } as unknown as ReturnType<typeof useBridgeNavigation>);
    jest.mocked(useSendBundleAmountSymbol).mockReturnValue({});
  });

  it('redirects using the confirmation hardware wallet after Non-EVM network selection', () => {
    const transactionMeta = {
      id: 'hardware-wallet-send',
      type: TransactionType.simpleSend,
      txParams: {
        from: FROM,
      },
    } as TransactionMeta;

    const { result } = renderHook(() =>
      useSendBundleHwNavigation({ transactionMeta }),
    );

    expect(useIsHardwareWalletAccount).toHaveBeenCalledWith(FROM);
    expect(result.current.shouldRedirectToHwSigningPage).toBe(true);
  });

  it('does not throw when txParams is undefined (e.g. typed sign confirmations)', () => {
    // Signature confirmations (signTypedData, personalSign, ...) share the
    // confirm footer with transactions but have no txParams. The hook must
    // not crash when the footer renders for these confirmation types.
    const transactionMeta = {
      id: 'typed-sign',
      type: undefined,
    } as TransactionMeta;

    const { result } = renderHook(() =>
      useSendBundleHwNavigation({ transactionMeta }),
    );

    expect(useIsHardwareWalletAccount).toHaveBeenCalledWith(undefined);
    expect(result.current.shouldRedirectToHwSigningPage).toBe(false);
  });
});
