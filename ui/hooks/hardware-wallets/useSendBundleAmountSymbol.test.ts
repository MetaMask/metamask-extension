import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { renderHookWithConfirmContextProvider } from '../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../test/data/confirmations/helper';
import { useSendBundleAmountSymbol } from './useSendBundleAmountSymbol';

const FROM = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const TOKEN_ADDRESS = '0x9dDA6Ef3D919c9bC8885D5560999A3640431e8e6';

describe('useSendBundleAmountSymbol', () => {
  it('returns an empty object when there is no transaction', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useSendBundleAmountSymbol(undefined),
      getMockConfirmStateForTransaction({
        id: 'none',
      } as unknown as TransactionMeta),
    );

    expect(result.current).toEqual({});
  });

  it('derives amount and symbol for a native simpleSend', () => {
    const transactionMeta = {
      id: 'native-send',
      type: TransactionType.simpleSend,
      chainId: '0x5',
      txParams: {
        from: FROM,
        to: TOKEN_ADDRESS,
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
        from: FROM,
        to: TOKEN_ADDRESS,
        // Enforced simulation zeroed the value.
        value: '0x0',
      },
      txParamsOriginal: {
        from: FROM,
        to: TOKEN_ADDRESS,
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
        from: FROM,
        to: TOKEN_ADDRESS,
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

  it('decodes the ERC20 transfer amount and symbol from the token list', () => {
    // transfer(recipient=FROM, amount=7_000_000) for a 6-decimal token → 7 TST.
    const recipientArg = FROM.slice(2).toLowerCase().padStart(64, '0');
    const amountArg = (7_000_000).toString(16).padStart(64, '0');
    const erc20TransferData = `0xa9059cbb${recipientArg}${amountArg}`;

    const transactionMeta = {
      id: 'token-send',
      type: TransactionType.tokenMethodTransfer,
      chainId: '0x5',
      txParams: {
        from: FROM,
        to: TOKEN_ADDRESS,
        data: erc20TransferData,
      },
    } as unknown as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useSendBundleAmountSymbol(transactionMeta),
      getMockConfirmStateForTransaction(transactionMeta, {
        metamask: {
          allTokens: {
            '0x5': {
              [FROM]: [{ address: TOKEN_ADDRESS, symbol: 'TST', decimals: 6 }],
            },
          },
          networkConfigurationsByChainId: {
            '0x5': { nativeCurrency: 'ETH' },
          },
        },
      }),
    );

    // No gas fee token selected → gas is paid in the native currency.
    expect(result.current).toEqual({
      sendAmount: '7',
      sendSymbol: 'TST',
      gasSymbol: 'ETH',
    });
  });

  it('derives gasSymbol from the selected (non-native) gas fee token', () => {
    // transfer(recipient=FROM, amount=7_000_000) for a 6-decimal token → 7 TST.
    const recipientArg = FROM.slice(2).toLowerCase().padStart(64, '0');
    const amountArg = (7_000_000).toString(16).padStart(64, '0');
    const erc20TransferData = `0xa9059cbb${recipientArg}${amountArg}`;
    const FEE_TOKEN_ADDRESS = '0xfee0000000000000000000000000000000000fee';

    const transactionMeta = {
      id: 'token-send-fee-token',
      type: TransactionType.tokenMethodTransfer,
      chainId: '0x5',
      // User chose to pay the network fee in a non-native token.
      selectedGasFeeToken: FEE_TOKEN_ADDRESS,
      gasFeeTokens: [
        { tokenAddress: FEE_TOKEN_ADDRESS, symbol: 'USDC', decimals: 6 },
      ],
      txParams: {
        from: FROM,
        to: TOKEN_ADDRESS,
        data: erc20TransferData,
      },
    } as unknown as TransactionMeta;

    const { result } = renderHookWithConfirmContextProvider(
      () => useSendBundleAmountSymbol(transactionMeta),
      getMockConfirmStateForTransaction(transactionMeta, {
        metamask: {
          allTokens: {
            '0x5': {
              [FROM]: [{ address: TOKEN_ADDRESS, symbol: 'TST', decimals: 6 }],
            },
          },
          networkConfigurationsByChainId: {
            '0x5': { nativeCurrency: 'ETH' },
          },
        },
      }),
    );

    // gasSymbol reflects the selected fee token (USDC), NOT the native ETH.
    expect(result.current).toEqual({
      sendAmount: '7',
      sendSymbol: 'TST',
      gasSymbol: 'USDC',
    });
  });
});
