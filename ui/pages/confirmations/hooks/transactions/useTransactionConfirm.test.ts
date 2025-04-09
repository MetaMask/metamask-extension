import { GasFeeToken, TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { updateAndApproveTx } from '../../../../store/actions';
import { getIsSmartTransaction } from '../../../../../shared/modules/selectors';
import { useTransactionConfirm } from './useTransactionConfirm';

jest.mock('../../../../../shared/modules/selectors');

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  updateAndApproveTx: jest.fn(),
}));

const CUSTOM_NONCE_VALUE = '1234';

const GAS_FEE_TOKEN_MOCK: GasFeeToken = {
  amount: toHex(1000),
  balance: toHex(2345),
  decimals: 3,
  gas: '0x3',
  maxFeePerGas: '0x4',
  maxPriorityFeePerGas: '0x5',
  rateWei: toHex('1798170000000000000'),
  recipient: '0x1234567890123456789012345678901234567890',
  symbol: 'TEST',
  tokenAddress: '0x1234567890123456789012345678901234567890',
};

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
  const getIsSmartTransactionMock = jest.mocked(getIsSmartTransaction);

  beforeEach(() => {
    jest.resetAllMocks();

    getIsSmartTransactionMock.mockReturnValue(false);
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
    getIsSmartTransactionMock.mockReturnValue(true);

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
        maxFeePerGas: GAS_FEE_TOKEN_MOCK.maxFeePerGas,
        maxPriorityFeePerGas: GAS_FEE_TOKEN_MOCK.maxPriorityFeePerGas,
        to: GAS_FEE_TOKEN_MOCK.tokenAddress,
      },
    ]);
  });

  it('updates transaction params if smart transaction and selected gas fee token', async () => {
    getIsSmartTransactionMock.mockReturnValue(true);

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
    getIsSmartTransactionMock.mockReturnValue(true);

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
});
