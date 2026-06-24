import { TransactionMeta, TransactionType } from '@metamask/transaction-controller';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { useTokenValues } from '../../components/confirm/info/hooks/use-token-values';
import { useTokenDetails } from '../../components/confirm/info/hooks/useTokenDetails';
import { useSendBundleAmountSymbol } from './useSendBundleAmountSymbol';

// Mock the ERC20 derivation hooks so the test stays focused on this hook's
// own logic (native math + delegation) and does not require confirm context.
jest.mock('../../components/confirm/info/hooks/use-token-values', () => ({
  useTokenValues: jest.fn(),
}));
jest.mock('../../components/confirm/info/hooks/useTokenDetails', () => ({
  useTokenDetails: jest.fn(),
}));

describe('useSendBundleAmountSymbol', () => {
  const useTokenValuesMock = jest.mocked(useTokenValues);
  const useTokenDetailsMock = jest.mocked(useTokenDetails);

  beforeEach(() => {
    jest.resetAllMocks();
    // Default safe returns so the unconditionally-called ERC20 derivation
    // hooks can be destructured without throwing; individual tests override.
    (useTokenValuesMock as unknown as jest.Mock).mockReturnValue({});
    (useTokenDetailsMock as unknown as jest.Mock).mockReturnValue({});
  });

  it('returns an empty object when there is no transaction', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useSendBundleAmountSymbol(undefined),
      getMockConfirmStateForTransaction(
        { id: 'none' } as unknown as TransactionMeta,
      ),
    );

    expect(result.current).toEqual({});
  });

  it('derives amount and symbol for a native simpleSend', () => {
    const transactionMeta = {
      id: 'native-send',
      type: TransactionType.simpleSend,
      chainId: '0x5',
      txParams: {
        from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        to: '0x9dDA6Ef3D919c9bC8885D5560999A3640431e8e6',
        // 1 ETH in wei.
        value: '0xde0b6b3a7640000',
      },
    } as unknown as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useSendBundleAmountSymbol(transactionMeta),
      getMockConfirmStateForTransaction(transactionMeta, {
        metamask: {
          networkConfigurationsByChainId: {
            '0x5': { nativeCurrency: 'ETH' },
          },
        },
      }),
    );

    expect(result.current).toEqual({
      sendAmount: '1',
      sendSymbol: 'ETH',
      gasSymbol: 'ETH',
    });
  });

  it('prefers txParamsOriginal.value so enforced simulations do not zero the amount', () => {
    const transactionMeta = {
      id: 'native-send-sim',
      type: TransactionType.simpleSend,
      chainId: '0x5',
      txParams: {
        from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        to: '0x9dDA6Ef3D919c9bC8885D5560999A3640431e8e6',
        // Enforced simulation zeroed the value.
        value: '0x0',
      },
      txParamsOriginal: {
        from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        to: '0x9dDA6Ef3D919c9bC8885D5560999A3640431e8e6',
        // Original intended send of 1 ETH.
        value: '0xde0b6b3a7640000',
      },
    } as unknown as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useSendBundleAmountSymbol(transactionMeta),
      getMockConfirmStateForTransaction(transactionMeta, {
        metamask: {
          networkConfigurationsByChainId: {
            '0x5': { nativeCurrency: 'ETH' },
          },
        },
      }),
    );

    expect(result.current).toEqual({
      sendAmount: '1',
      sendSymbol: 'ETH',
      gasSymbol: 'ETH',
    });
  });

  it('returns undefined sendAmount when the native value is missing', () => {
    const transactionMeta = {
      id: 'native-send-no-value',
      type: TransactionType.simpleSend,
      chainId: '0x5',
      txParams: {
        from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        to: '0x9dDA6Ef3D919c9bC8885D5560999A3640431e8e6',
      },
    } as unknown as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useSendBundleAmountSymbol(transactionMeta),
      getMockConfirmStateForTransaction(transactionMeta, {
        metamask: {
          networkConfigurationsByChainId: {
            '0x5': { nativeCurrency: 'ETH' },
          },
        },
      }),
    );

    expect(result.current).toEqual({
      sendAmount: undefined,
      sendSymbol: 'ETH',
      gasSymbol: 'ETH',
    });
  });

  it('delegates to the ERC20 derivation for token sends', () => {
    (useTokenValuesMock as jest.Mock).mockReturnValue({
      displayTransferValue: '7',
    });
    (useTokenDetailsMock as jest.Mock).mockReturnValue({ tokenSymbol: 'TST' });

    const transactionMeta = {
      id: 'token-send',
      type: TransactionType.tokenMethodTransfer,
      chainId: '0x5',
      txParams: {
        from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        to: '0x9dDA6Ef3D919c9bC8885D5560999A3640431e8e6',
        data: '0xa9059cbb',
      },
    } as unknown as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useSendBundleAmountSymbol(transactionMeta),
      getMockConfirmStateForTransaction(transactionMeta, {
        metamask: {
          networkConfigurationsByChainId: {
            '0x5': { nativeCurrency: 'ETH' },
          },
        },
      }),
    );

    expect(useTokenValuesMock).toHaveBeenCalledWith(transactionMeta);
    expect(useTokenDetailsMock).toHaveBeenCalledWith(transactionMeta);
    // The sent token is TST, but gas is paid in the native currency (ETH).
    expect(result.current).toEqual({
      sendAmount: '7',
      sendSymbol: 'TST',
      gasSymbol: 'ETH',
    });
  });
});
