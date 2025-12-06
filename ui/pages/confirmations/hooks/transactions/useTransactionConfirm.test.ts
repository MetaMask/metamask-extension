import {
  GasFeeToken,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { QuoteResponse, TxData } from '@metamask/bridge-controller';

import {
  genUnapprovedContractInteractionConfirmation,
  mockBridgeQuotes,
} from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { updateAndApproveTx } from '../../../../store/actions';
import { GAS_FEE_TOKEN_MOCK } from '../../../../../test/data/confirmations/gas';
import * as DappSwapContext from '../../context/dapp-swap';
import { useIsGaslessSupported } from '../gas/useIsGaslessSupported';
import { useGaslessSupportedSmartTransactions } from '../gas/useGaslessSupportedSmartTransactions';
import { useTransactionConfirm } from './useTransactionConfirm';
import * as DappSwapActions from './dapp-swap-comparison/useDappSwapActions';

jest.mock('../../../../../shared/modules/selectors');

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  updateAndApproveTx: jest.fn(),
}));

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

jest.mock('../gas/useIsGaslessSupported');

jest.mock('../gas/useGaslessSupportedSmartTransactions');

const CUSTOM_NONCE_VALUE = '1234';

const TRANSACTION_META_MOCK =
  genUnapprovedContractInteractionConfirmation() as TransactionMeta;

function runHook({
  customNonceValue,
  gasFeeTokens,
  selectedGasFeeToken,
}: {
  customNonceValue?: string;
  gasFeeTokens?: GasFeeToken[];
  selectedGasFeeToken?: Hex;
} = {}) {
  const { result } = renderHookWithConfirmContextProvider(
    useTransactionConfirm,
    getMockConfirmStateForTransaction(
      genUnapprovedContractInteractionConfirmation({
        gasFeeTokens,
        selectedGasFeeToken,
      }),
      {
        appState: {
          customNonceValue,
        },
        metamask: {},
      },
    ),
  );

  return result.current;
}

describe('useTransactionConfirm', () => {
  const updateAndApproveTxMock = jest.mocked(updateAndApproveTx);
  const useIsGaslessSupportedMock = jest.mocked(useIsGaslessSupported);
  const useGaslessSupportedSmartTransactionsMock = jest.mocked(
    useGaslessSupportedSmartTransactions,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: false,
      isSupported: false,
    });
    updateAndApproveTxMock.mockReturnValue(() =>
      Promise.resolve({} as TransactionMeta),
    );

    useIsGaslessSupportedMock.mockReturnValue({
      isSupported: false,
      isSmartTransaction: false,
    });

    useGaslessSupportedSmartTransactionsMock.mockReturnValue({
      isSupported: false,
      isSmartTransaction: false,
      pending: false,
    });

    updateAndApproveTxMock.mockReturnValue(() =>
      Promise.resolve({} as TransactionMeta),
    );
  });

  it('dispatches update and approve action', async () => {
    const { onTransactionConfirm } = runHook();

    await onTransactionConfirm();

    expect(updateAndApproveTxMock).toHaveBeenCalledTimes(1);
  });

  it('updates custom nonce', async () => {
    const { onTransactionConfirm } = runHook({ customNonceValue: '1234' });

    await onTransactionConfirm();

    const actualTransactionMeta = updateAndApproveTxMock.mock.calls[0][0];

    expect(actualTransactionMeta).toStrictEqual(
      expect.objectContaining({
        customNonceValue: CUSTOM_NONCE_VALUE,
      }),
    );
  });

  it('updates batch transaction if smart transaction and selected gas fee token', async () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: true,
      isSupported: true,
    });
    useGaslessSupportedSmartTransactionsMock.mockReturnValue({
      isSupported: true,
      isSmartTransaction: true,
      pending: false,
    });

    const { onTransactionConfirm } = runHook({
      gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
      selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
    });

    await onTransactionConfirm();

    const actualTransactionMeta = updateAndApproveTxMock.mock.calls[0][0];

    expect(actualTransactionMeta.batchTransactions).toStrictEqual([
      {
        data: `0xa9059cbb000000000000000000000000${GAS_FEE_TOKEN_MOCK.recipient.slice(
          2,
        )}0000000000000000000000000000000000000000000000000000000000000${GAS_FEE_TOKEN_MOCK.amount.slice(
          2,
        )}`,
        gas: GAS_FEE_TOKEN_MOCK.gasTransfer,
        maxFeePerGas: GAS_FEE_TOKEN_MOCK.maxFeePerGas,
        maxPriorityFeePerGas: GAS_FEE_TOKEN_MOCK.maxPriorityFeePerGas,
        to: GAS_FEE_TOKEN_MOCK.tokenAddress,
        type: TransactionType.gasPayment,
      },
    ]);
  });

  it('updates transaction params if smart transaction and selected gas fee token', async () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: true,
      isSupported: true,
    });
    useGaslessSupportedSmartTransactionsMock.mockReturnValue({
      isSupported: true,
      isSmartTransaction: true,
      pending: false,
    });

    const { onTransactionConfirm } = runHook({
      gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
      selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
    });

    await onTransactionConfirm();

    const actualTransactionMeta = updateAndApproveTxMock.mock.calls[0][0];

    expect(actualTransactionMeta.txParams).toStrictEqual(
      expect.objectContaining({
        gas: GAS_FEE_TOKEN_MOCK.gas,
        maxFeePerGas: GAS_FEE_TOKEN_MOCK.maxFeePerGas,
        maxPriorityFeePerGas: GAS_FEE_TOKEN_MOCK.maxPriorityFeePerGas,
      }),
    );
  });

  it('does not update transaction params if smart transaction and no selected gas fee token', async () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: true,
      isSupported: true,
    });

    const { onTransactionConfirm } = runHook({
      gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
    });

    await onTransactionConfirm();

    const actualTransactionMeta = updateAndApproveTxMock.mock.calls[0][0];

    expect(actualTransactionMeta.txParams).toStrictEqual(
      expect.objectContaining({
        gas: TRANSACTION_META_MOCK.txParams.gas,
        maxFeePerGas: TRANSACTION_META_MOCK.txParams.maxFeePerGas,
        maxPriorityFeePerGas:
          TRANSACTION_META_MOCK.txParams.maxPriorityFeePerGas,
      }),
    );
  });

  it('calls handleSmartTransaction if chainSupportsSendBundle is true', async () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: true,
      isSupported: true,
    });
    useGaslessSupportedSmartTransactionsMock.mockReturnValue({
      isSupported: true,
      isSmartTransaction: true,
      pending: false,
    });

    const { onTransactionConfirm } = runHook({
      gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
      selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
    });

    await onTransactionConfirm();

    const actualTransactionMeta = updateAndApproveTxMock.mock.calls[0][0];
    expect(actualTransactionMeta.batchTransactions).toStrictEqual([
      {
        data: `0xa9059cbb000000000000000000000000${GAS_FEE_TOKEN_MOCK.recipient.slice(
          2,
        )}0000000000000000000000000000000000000000000000000000000000000${GAS_FEE_TOKEN_MOCK.amount.slice(
          2,
        )}`,
        gas: GAS_FEE_TOKEN_MOCK.gasTransfer,
        maxFeePerGas: GAS_FEE_TOKEN_MOCK.maxFeePerGas,
        maxPriorityFeePerGas: GAS_FEE_TOKEN_MOCK.maxPriorityFeePerGas,
        to: GAS_FEE_TOKEN_MOCK.tokenAddress,
        type: TransactionType.gasPayment,
      },
    ]);
  });

  it('does not call handleSmartTransaction if chainSupportsSendBundle is false', async () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: true,
      isSupported: true,
    });
    useGaslessSupportedSmartTransactionsMock.mockReturnValue({
      isSupported: false,
      isSmartTransaction: true,
      pending: false,
    });

    const { onTransactionConfirm } = runHook({
      gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
      selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
    });

    await onTransactionConfirm();

    const actualTransactionMeta = updateAndApproveTxMock.mock.calls[0][0];
    expect(actualTransactionMeta.txParams).toStrictEqual(
      expect.objectContaining({
        gas: TRANSACTION_META_MOCK.txParams.gas,
        maxFeePerGas: TRANSACTION_META_MOCK.txParams.maxFeePerGas,
        maxPriorityFeePerGas:
          TRANSACTION_META_MOCK.txParams.maxPriorityFeePerGas,
      }),
    );
  });

  it('returns false if chainId is undefined during chainSupportsSendBundle check', async () => {
    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: false,
      isSupported: true,
    });

    const { onTransactionConfirm } = runHook({
      customNonceValue: CUSTOM_NONCE_VALUE,
    });

    await onTransactionConfirm();

    expect(updateAndApproveTxMock).toHaveBeenCalledWith(
      expect.not.objectContaining({
        batchTransactions: expect.any(Array),
      }),
      true,
      '',
    );
  });

  it('dispatches update and approve action', async () => {
    const { onTransactionConfirm } = runHook();

    await onTransactionConfirm();

    expect(updateAndApproveTxMock).toHaveBeenCalledTimes(1);
  });

  it('updates custom nonce', async () => {
    const { onTransactionConfirm } = runHook({ customNonceValue: '1234' });

    await onTransactionConfirm();

    const actualTransactionMeta = updateAndApproveTxMock.mock.calls[0][0];
    expect(actualTransactionMeta.customNonceValue).toBe(CUSTOM_NONCE_VALUE);
  });

  it('call function to capture swap submit', async () => {
    const mockOnDappSwapCompleted = jest.fn();
    jest.spyOn(DappSwapActions, 'useDappSwapActions').mockReturnValue({
      onDappSwapCompleted: mockOnDappSwapCompleted,
      updateSwapWithQuoteDetailsIfRequired: jest.fn(),
    } as unknown as ReturnType<typeof DappSwapActions.useDappSwapActions>);

    const { onTransactionConfirm } = runHook({ customNonceValue: '1234' });
    await onTransactionConfirm();

    expect(mockOnDappSwapCompleted).toHaveBeenCalledTimes(1);
  });

  it('updates batch transaction if smart transaction and selected gas fee token', async () => {
    useGaslessSupportedSmartTransactionsMock.mockReturnValue({
      isSupported: true,
      isSmartTransaction: true,
      pending: false,
    });

    const { onTransactionConfirm } = runHook({
      gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
      selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
    });

    await onTransactionConfirm();

    const actual = updateAndApproveTxMock.mock.calls[0][0];
    expect(actual.batchTransactions).toStrictEqual([
      expect.objectContaining({
        to: GAS_FEE_TOKEN_MOCK.tokenAddress,
        type: TransactionType.gasPayment,
      }),
    ]);
  });

  it('updates swap with MM quote if available', async () => {
    jest.spyOn(DappSwapContext, 'useDappSwapContext').mockReturnValue({
      isQuotedSwapDisplayedInInfo: true,
      selectedQuote: mockBridgeQuotes[0] as unknown as QuoteResponse,
      setSelectedQuote: jest.fn(),
      setQuotedSwapDisplayedInInfo: jest.fn(),
    } as unknown as ReturnType<typeof DappSwapContext.useDappSwapContext>);

    useGaslessSupportedSmartTransactionsMock.mockReturnValue({
      isSupported: true,
      isSmartTransaction: true,
      pending: false,
    });

    const { onTransactionConfirm } = runHook({
      gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
      selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
    });

    await onTransactionConfirm();

    const actual = updateAndApproveTxMock.mock.calls[0][0];
    expect(actual.txParams).toStrictEqual(
      expect.objectContaining({
        authorizationList: undefined,
        data: (mockBridgeQuotes[0].trade as TxData).data,
        from: '0x2e0d7e8c45221fca00d74a3609a0f7097035d09b',
        gas: '0x3',
        maxFeePerGas: '0x4',
        maxPriorityFeePerGas: '0x5',
        to: '0x9dDA6Ef3D919c9bC8885D5560999A3640431e8e6',
        value: '0x0',
      }),
    );
  });

  it('updates transaction params if smart transaction and selected gas fee token', async () => {
    useGaslessSupportedSmartTransactionsMock.mockReturnValue({
      isSupported: true,
      isSmartTransaction: true,
      pending: false,
    });

    const { onTransactionConfirm } = runHook({
      gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
      selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
    });

    await onTransactionConfirm();

    const actual = updateAndApproveTxMock.mock.calls[0][0];
    expect(actual.txParams).toStrictEqual(
      expect.objectContaining({
        gas: GAS_FEE_TOKEN_MOCK.gas,
        maxFeePerGas: GAS_FEE_TOKEN_MOCK.maxFeePerGas,
        maxPriorityFeePerGas: GAS_FEE_TOKEN_MOCK.maxPriorityFeePerGas,
      }),
    );
  });

  it('uses 7702 flow if gasless supported and not smart tx supported', async () => {
    useGaslessSupportedSmartTransactionsMock.mockReturnValue({
      isSupported: false,
      isSmartTransaction: false,
      pending: false,
    });
    useIsGaslessSupportedMock.mockReturnValue({
      isSupported: true,
      isSmartTransaction: false,
    });

    const { onTransactionConfirm } = runHook({
      gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
      selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
    });

    await onTransactionConfirm();

    const actual = updateAndApproveTxMock.mock.calls[0][0];
    expect(actual.isExternalSign).toBe(true);
    expect(actual.isGasFeeSponsored).toBe(
      TRANSACTION_META_MOCK.isGasFeeSponsored,
    );
  });

  it('does not call handleSmartTransaction if no selected gas fee token', async () => {
    useGaslessSupportedSmartTransactionsMock.mockReturnValue({
      isSupported: true,
      isSmartTransaction: true,
      pending: false,
    });

    const { onTransactionConfirm } = runHook({
      gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
    });

    await onTransactionConfirm();

    const actual = updateAndApproveTxMock.mock.calls[0][0];
    expect(actual.txParams).toStrictEqual(
      expect.objectContaining({
        gas: TRANSACTION_META_MOCK.txParams.gas,
        maxFeePerGas: TRANSACTION_META_MOCK.txParams.maxFeePerGas,
        maxPriorityFeePerGas:
          TRANSACTION_META_MOCK.txParams.maxPriorityFeePerGas,
      }),
    );
  });
});
