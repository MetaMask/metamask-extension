import {
  generateEIP7702BatchTransaction,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { renderHook } from '@testing-library/react';

import { submitRequestToBackground } from '../../../../store/background-connection';
import {
  getLastMoneyAccountWithdrawAmount,
  updateMoneyAccountWithdrawAmount,
} from '../../../../store/controller-actions/transaction-pay-controller';
import { useDispatch } from '../../../../store/hooks';
import { useMoneyAccountWithdrawConfirm } from './useMoneyAccountWithdrawConfirm';
import { useTransactionAccountOverride } from './useTransactionAccountOverride';

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(() => Promise.resolve()),
}));
jest.mock(
  '../../../../store/controller-actions/transaction-pay-controller',
  () => ({
    getLastMoneyAccountWithdrawAmount: jest.fn(),
    updateMoneyAccountWithdrawAmount: jest.fn(),
  }),
);
jest.mock('../../../../store/hooks', () => ({ useDispatch: jest.fn() }));
jest.mock('./useTransactionAccountOverride');

const FROM = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc' as Hex;
const TELLER_ADDRESS = '0x1111111111111111111111111111111111111111' as Hex;
const MUSD_ADDRESS = '0x3333333333333333333333333333333333333333' as Hex;
const OVERRIDE_ADDRESS = '0x4444444444444444444444444444444444444444' as Hex;
const WITHDRAW_DATA = '0x1234567890abcdef1234567890abcdef12345678' as Hex;
const PLACEHOLDER_DATA = '0xemptyexecute';
const FUNDED_TRANSFER_DATA =
  '0xa9059cbb0000000000000000000000002222222222222222222222222222222222222222000000000000000000000000000000000000000000000000000000000000c350' as Hex;
const ZERO_TRANSFER_DATA =
  '0xa9059cbb00000000000000000000000022222222222222222222222222222222222222220000000000000000000000000000000000000000000000000000000000000000' as Hex;
const TRANSACTION_ID = 'tx-1';

const PLACEHOLDER_NESTED = [
  { to: TELLER_ADDRESS, data: '0x' as Hex },
  { to: MUSD_ADDRESS, data: '0x' as Hex },
] as TransactionMeta['nestedTransactions'];

const FUNDED_NESTED = [
  { to: TELLER_ADDRESS, data: WITHDRAW_DATA },
  { to: MUSD_ADDRESS, data: FUNDED_TRANSFER_DATA },
] as TransactionMeta['nestedTransactions'];

const FUNDED_UPDATE = {
  withdrawData: WITHDRAW_DATA,
  transferData: FUNDED_TRANSFER_DATA,
};

function buildTransaction(
  nestedTransactions?: TransactionMeta['nestedTransactions'],
): TransactionMeta {
  return {
    id: TRANSACTION_ID,
    type: TransactionType.batch,
    txParams: { from: FROM, to: FROM, data: PLACEHOLDER_DATA },
    nestedTransactions,
  } as unknown as TransactionMeta;
}

const mockUseDispatch = jest.mocked(useDispatch);
const mockUseTransactionAccountOverride = jest.mocked(
  useTransactionAccountOverride,
);
const mockGetLastMoneyAccountWithdrawAmount = jest.mocked(
  getLastMoneyAccountWithdrawAmount,
);
const mockUpdateMoneyAccountWithdrawAmount = jest.mocked(
  updateMoneyAccountWithdrawAmount,
);
const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

/**
 * Builds a dispatch that resolves thunks against a fake transaction
 * controller state.
 *
 * @param storeTransactions - Transactions the store should hold, in order.
 * Each call to the thunk reads the next entry, so later reads can observe a
 * background write.
 * @returns A jest mock behaving like `useDispatch()`'s return value.
 */
function buildDispatch(storeTransactions: (TransactionMeta | undefined)[]) {
  let callIndex = 0;
  return jest.fn((thunk: unknown) => {
    if (typeof thunk !== 'function') {
      return thunk;
    }
    const transactions = [
      storeTransactions[Math.min(callIndex, storeTransactions.length - 1)],
    ].filter(Boolean);
    callIndex += 1;
    return (thunk as (dispatch: unknown, getState: () => unknown) => unknown)(
      jest.fn(),
      () => ({ metamask: { transactions } }),
    );
  });
}

function runHook() {
  const { result } = renderHook(() => useMoneyAccountWithdrawConfirm());
  return result.current;
}

describe('useMoneyAccountWithdrawConfirm', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      // Suppress the expected refusal logs.
    });
    mockUseDispatch.mockReturnValue(buildDispatch([undefined]) as never);
    mockUseTransactionAccountOverride.mockReturnValue(undefined);
    mockGetLastMoneyAccountWithdrawAmount.mockReturnValue(undefined);
    mockUpdateMoneyAccountWithdrawAmount.mockResolvedValue(false);
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('rebuilds the parent execute from funded nested calls without re-encoding', async () => {
    const transaction = buildTransaction(FUNDED_NESTED);
    const { prepareWithdrawTransaction } = runHook();

    const result = await prepareWithdrawTransaction(transaction);

    const expected = generateEIP7702BatchTransaction(FROM, FUNDED_NESTED ?? []);
    expect(result?.type).toBe(TransactionType.moneyAccountWithdraw);
    expect(result?.txParams.data).toBe(expected.data);
    expect(result?.txParams.to).toBe(expected.to ?? FROM);
    expect(mockUpdateMoneyAccountWithdrawAmount).not.toHaveBeenCalled();
  });

  it('persists the rebuilt transaction before approve', async () => {
    const { prepareWithdrawTransaction } = runHook();

    await prepareWithdrawTransaction(buildTransaction(FUNDED_NESTED));

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'updateTransaction',
      [expect.objectContaining({ id: TRANSACTION_ID })],
    );
  });

  it('prefers the funded transaction held in the store', async () => {
    mockUseDispatch.mockReturnValue(
      buildDispatch([buildTransaction(FUNDED_NESTED)]) as never,
    );
    const { prepareWithdrawTransaction } = runHook();

    const result = await prepareWithdrawTransaction(
      buildTransaction(PLACEHOLDER_NESTED),
    );

    expect(result?.nestedTransactions?.[1].data).toBe(FUNDED_TRANSFER_DATA);
    expect(mockUpdateMoneyAccountWithdrawAmount).not.toHaveBeenCalled();
  });

  it('encodes the committed amount and patches the nested calldata', async () => {
    mockGetLastMoneyAccountWithdrawAmount.mockReturnValue('0.05');
    mockUpdateMoneyAccountWithdrawAmount.mockResolvedValue(FUNDED_UPDATE);
    const { prepareWithdrawTransaction } = runHook();

    const result = await prepareWithdrawTransaction(
      buildTransaction(PLACEHOLDER_NESTED),
    );

    expect(mockUpdateMoneyAccountWithdrawAmount).toHaveBeenCalledWith(
      TRANSACTION_ID,
      '0.05',
      undefined,
    );
    expect(result?.nestedTransactions?.[0].data).toBe(WITHDRAW_DATA);
    expect(result?.nestedTransactions?.[1].data).toBe(FUNDED_TRANSFER_DATA);
    expect(result?.txParams.data).not.toBe(PLACEHOLDER_DATA);
  });

  it('passes the account override as the withdraw recipient', async () => {
    mockUseTransactionAccountOverride.mockReturnValue(OVERRIDE_ADDRESS);
    mockGetLastMoneyAccountWithdrawAmount.mockReturnValue('0.05');
    mockUpdateMoneyAccountWithdrawAmount.mockResolvedValue(FUNDED_UPDATE);
    const { prepareWithdrawTransaction } = runHook();

    await prepareWithdrawTransaction(buildTransaction(PLACEHOLDER_NESTED));

    expect(mockUpdateMoneyAccountWithdrawAmount).toHaveBeenCalledWith(
      TRANSACTION_ID,
      '0.05',
      OVERRIDE_ADDRESS,
    );
  });

  it('falls back to the store when the encoder result cannot be patched', async () => {
    mockUseDispatch.mockReturnValue(
      buildDispatch([undefined, buildTransaction(FUNDED_NESTED)]) as never,
    );
    mockGetLastMoneyAccountWithdrawAmount.mockReturnValue('0.05');
    mockUpdateMoneyAccountWithdrawAmount.mockResolvedValue(false);
    const { prepareWithdrawTransaction } = runHook();

    const result = await prepareWithdrawTransaction(buildTransaction());

    expect(result?.nestedTransactions?.[1].data).toBe(FUNDED_TRANSFER_DATA);
  });

  it('returns null when no amount has been committed', async () => {
    const { prepareWithdrawTransaction } = runHook();

    const result = await prepareWithdrawTransaction(buildTransaction());

    expect(result).toBeNull();
    expect(mockUpdateMoneyAccountWithdrawAmount).not.toHaveBeenCalled();
  });

  it('returns null when the committed amount is zero', async () => {
    mockGetLastMoneyAccountWithdrawAmount.mockReturnValue('0');
    const { prepareWithdrawTransaction } = runHook();

    const result = await prepareWithdrawTransaction(buildTransaction());

    expect(result).toBeNull();
    expect(mockUpdateMoneyAccountWithdrawAmount).not.toHaveBeenCalled();
  });

  it('returns null when the encoder does not commit', async () => {
    mockGetLastMoneyAccountWithdrawAmount.mockReturnValue('0.05');
    mockUpdateMoneyAccountWithdrawAmount.mockResolvedValue(false);
    const { prepareWithdrawTransaction } = runHook();

    const result = await prepareWithdrawTransaction(buildTransaction());

    expect(result).toBeNull();
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('returns null for a zero-amount transfer even when the calldata is encoded', async () => {
    mockGetLastMoneyAccountWithdrawAmount.mockReturnValue('0.05');
    mockUpdateMoneyAccountWithdrawAmount.mockResolvedValue({
      withdrawData: WITHDRAW_DATA,
      transferData: ZERO_TRANSFER_DATA,
    });
    const { prepareWithdrawTransaction } = runHook();

    const result = await prepareWithdrawTransaction(
      buildTransaction([
        { to: TELLER_ADDRESS, data: WITHDRAW_DATA },
        { to: MUSD_ADDRESS, data: ZERO_TRANSFER_DATA },
      ] as TransactionMeta['nestedTransactions']),
    );

    expect(result).toBeNull();
    expect(mockUpdateMoneyAccountWithdrawAmount).toHaveBeenCalledTimes(1);
  });

  it('returns null when the encoder returns unencoded nested calldata', async () => {
    mockGetLastMoneyAccountWithdrawAmount.mockReturnValue('0.05');
    mockUpdateMoneyAccountWithdrawAmount.mockResolvedValue({
      withdrawData: '0x',
      transferData: '0x',
    });
    const { prepareWithdrawTransaction } = runHook();

    const result = await prepareWithdrawTransaction(
      buildTransaction(PLACEHOLDER_NESTED),
    );

    expect(result).toBeNull();
  });

  it('rethrows when the encoder fails', async () => {
    mockGetLastMoneyAccountWithdrawAmount.mockReturnValue('0.05');
    mockUpdateMoneyAccountWithdrawAmount.mockRejectedValue(
      new Error('Update Amount: Money Account Withdrawal: missing vault'),
    );
    const { prepareWithdrawTransaction } = runHook();

    await expect(
      prepareWithdrawTransaction(buildTransaction(PLACEHOLDER_NESTED)),
    ).rejects.toThrow('Update Amount: Money Account Withdrawal: missing vault');
  });
});
