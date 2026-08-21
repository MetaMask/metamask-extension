import type { TransactionMeta } from '@metamask/transaction-controller';
import { act, waitFor } from '@testing-library/react';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { updateEditableParams } from '../../../../store/actions';
import { updateAtomicBatchData } from '../../../../store/controller-actions/transaction-controller';
import {
  updateMoneyAccountDepositAmount,
  updateMoneyAccountWithdrawAmount,
  type MoneyAccountWithdrawAmountUpdate,
} from '../../../../store/controller-actions/transaction-pay-controller';
import * as useTransactionPayDataModule from '../pay/useTransactionPayData';
import * as transactionPayUtils from '../../utils/transaction-pay';
import { useTransactionAccountOverride } from './useTransactionAccountOverride';
import { useUpdateTokenAmount } from './useUpdateTokenAmount';

jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  updateEditableParams: jest.fn(() => () => Promise.resolve()),
}));

jest.mock(
  '../../../../store/controller-actions/transaction-controller',
  () => ({
    ...jest.requireActual(
      '../../../../store/controller-actions/transaction-controller',
    ),
    updateAtomicBatchData: jest.fn(),
  }),
);

jest.mock(
  '../../../../store/controller-actions/transaction-pay-controller',
  () => ({
    ...jest.requireActual(
      '../../../../store/controller-actions/transaction-pay-controller',
    ),
    updateMoneyAccountDepositAmount: jest.fn(),
    updateMoneyAccountWithdrawAmount: jest.fn(),
  }),
);

jest.mock('../pay/useTransactionPayData');
jest.mock('../../utils/transaction-pay');
jest.mock('./useTransactionAccountOverride');

const MOCK_RECIPIENT = '0x1234567890123456789012345678901234567890';
const MOCK_TOKEN_ADDRESS = '0xabcdef0123456789abcdef0123456789abcdef01';
const MOCK_DECIMALS = 18;

const MOCK_TRANSFER_DATA = `0xa9059cbb000000000000000000000000${MOCK_RECIPIENT.slice(2)}0000000000000000000000000000000000000000000000000de0b6b3a7640000`;

function createMockTransactionMeta(
  overrides: Partial<TransactionMeta> = {},
): TransactionMeta {
  return {
    ...genUnapprovedContractInteractionConfirmation(),
    txParams: {
      ...(genUnapprovedContractInteractionConfirmation() as TransactionMeta)
        .txParams,
      to: MOCK_TOKEN_ADDRESS,
      data: MOCK_TRANSFER_DATA,
    },
    ...overrides,
  } as TransactionMeta;
}

function runHook({
  transactionMeta = createMockTransactionMeta(),
  tokenTransferData = {
    data: MOCK_TRANSFER_DATA,
    to: MOCK_TOKEN_ADDRESS,
    index: undefined as number | undefined,
  },
  requiredTokens = [{ decimals: MOCK_DECIMALS, skipIfBalance: false }],
}: {
  transactionMeta?: TransactionMeta;
  tokenTransferData?: {
    data: string | undefined;
    to: string | undefined;
    index: number | undefined;
  };
  requiredTokens?: { decimals: number; skipIfBalance?: boolean }[];
} = {}) {
  jest
    .mocked(transactionPayUtils.getTokenTransferData)
    .mockReturnValue(
      tokenTransferData as ReturnType<
        typeof transactionPayUtils.getTokenTransferData
      >,
    );
  jest
    .mocked(useTransactionPayDataModule.useTransactionPayRequiredTokens)
    .mockReturnValue(
      requiredTokens as ReturnType<
        typeof useTransactionPayDataModule.useTransactionPayRequiredTokens
      >,
    );
  jest
    .mocked(useTransactionPayDataModule.useTransactionPayPrimaryRequiredToken)
    .mockReturnValue(
      requiredTokens.find((t) => !t.skipIfBalance) as unknown as ReturnType<
        typeof useTransactionPayDataModule.useTransactionPayPrimaryRequiredToken
      >,
    );

  const state = getMockConfirmStateForTransaction(transactionMeta);

  return renderHookWithConfirmContextProvider(useUpdateTokenAmount, state);
}

describe('useUpdateTokenAmount', () => {
  const updateEditableParamsMock = jest.mocked(updateEditableParams);
  const updateAtomicBatchDataMock = jest.mocked(updateAtomicBatchData);
  const useTransactionAccountOverrideMock = jest.mocked(
    useTransactionAccountOverride,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    updateAtomicBatchDataMock.mockResolvedValue(undefined);
    updateEditableParamsMock.mockReturnValue((() =>
      Promise.resolve()) as never);
    useTransactionAccountOverrideMock.mockReturnValue(undefined);
  });

  describe('updateTokenAmount', () => {
    it('dispatches the money deposit commit path for a money account deposit batch', async () => {
      const updateMoneyAmountMock = jest
        .mocked(updateMoneyAccountDepositAmount)
        .mockResolvedValue(true);

      const transactionMeta = createMockTransactionMeta({
        nestedTransactions: [
          { to: MOCK_TOKEN_ADDRESS, type: 'approve' },
          { to: MOCK_RECIPIENT, type: 'moneyAccountDeposit' },
        ],
      } as unknown as Partial<TransactionMeta>);

      const { result } = runHook({
        transactionMeta,
        // The placeholder batch has no transfer calldata to parse.
        tokenTransferData: {
          data: undefined,
          to: undefined,
          index: undefined,
        },
      });

      // The commit promise settles in a microtask, and its `finally` clears the
      // pending flag, so the state update must be flushed inside `act`.
      await act(async () => {
        result.current.updateTokenAmount('1.5');
      });

      expect(updateMoneyAmountMock).toHaveBeenCalledWith(
        transactionMeta.id,
        '1.5',
      );
      expect(updateAtomicBatchDataMock).not.toHaveBeenCalled();
      expect(updateEditableParamsMock).not.toHaveBeenCalled();
    });

    it('dispatches the withdrawal commit path for a money account withdrawal batch', async () => {
      const updateWithdrawAmountMock = jest
        .mocked(updateMoneyAccountWithdrawAmount)
        .mockResolvedValue(false);

      const transactionMeta = createMockTransactionMeta({
        nestedTransactions: [
          { to: MOCK_TOKEN_ADDRESS, type: 'moneyAccountWithdraw' },
          { to: MOCK_RECIPIENT, type: 'transfer' },
        ],
      } as unknown as Partial<TransactionMeta>);

      const { result } = runHook({
        transactionMeta,
        tokenTransferData: {
          data: undefined,
          to: undefined,
          index: undefined,
        },
      });

      // The commit promise settles in a microtask, and its `finally` clears the
      // pending flag, so the state update must be flushed inside `act`.
      await act(async () => {
        result.current.updateTokenAmount('2');
      });

      expect(updateWithdrawAmountMock).toHaveBeenCalledWith(
        transactionMeta.id,
        '2',
        undefined,
      );
      expect(updateAtomicBatchDataMock).not.toHaveBeenCalled();
    });

    it('passes the account override as the withdraw recipient', async () => {
      const accountOverride =
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;
      useTransactionAccountOverrideMock.mockReturnValue(accountOverride);

      const updateWithdrawAmountMock = jest
        .mocked(updateMoneyAccountWithdrawAmount)
        .mockResolvedValue(false);

      const transactionMeta = createMockTransactionMeta({
        nestedTransactions: [
          { to: MOCK_TOKEN_ADDRESS, type: 'moneyAccountWithdraw' },
          { to: MOCK_RECIPIENT, type: 'transfer' },
        ],
      } as unknown as Partial<TransactionMeta>);

      const { result } = runHook({
        transactionMeta,
        tokenTransferData: {
          data: undefined,
          to: undefined,
          index: undefined,
        },
      });

      // The commit promise settles in a microtask, and its `finally` clears the
      // pending flag, so the state update must be flushed inside `act`.
      await act(async () => {
        result.current.updateTokenAmount('2');
      });

      expect(updateWithdrawAmountMock).toHaveBeenCalledWith(
        transactionMeta.id,
        '2',
        accountOverride,
      );
    });

    it('does nothing when data is undefined', () => {
      const { result } = runHook({
        tokenTransferData: {
          data: undefined,
          to: MOCK_TOKEN_ADDRESS,
          index: undefined,
        },
      });

      act(() => {
        result.current.updateTokenAmount('100');
      });

      expect(updateEditableParamsMock).not.toHaveBeenCalled();
      expect(updateAtomicBatchDataMock).not.toHaveBeenCalled();
    });

    it('does nothing when to is undefined', () => {
      const { result } = runHook({
        tokenTransferData: {
          data: MOCK_TRANSFER_DATA,
          to: undefined,
          index: undefined,
        },
      });

      act(() => {
        result.current.updateTokenAmount('100');
      });

      expect(updateEditableParamsMock).not.toHaveBeenCalled();
      expect(updateAtomicBatchDataMock).not.toHaveBeenCalled();
    });

    it('does nothing when new amount equals current amount', () => {
      const { result } = runHook();

      act(() => {
        result.current.updateTokenAmount('1');
      });

      expect(updateEditableParamsMock).not.toHaveBeenCalled();
      expect(updateAtomicBatchDataMock).not.toHaveBeenCalled();
    });

    it('dispatches updateEditableParams for standard transactions', () => {
      const transactionMeta = createMockTransactionMeta();
      const { result } = runHook({ transactionMeta });

      act(() => {
        result.current.updateTokenAmount('2');
      });

      expect(updateEditableParamsMock).toHaveBeenCalledTimes(1);
      expect(updateEditableParamsMock).toHaveBeenCalledWith(
        transactionMeta.id,
        expect.objectContaining({
          data: expect.stringMatching(/^0xa9059cbb/u),
        }),
      );
    });

    it('calls updateAtomicBatchData for nested transactions', () => {
      const transactionMeta = createMockTransactionMeta();
      const nestedCallIndex = 0;

      const { result } = runHook({
        transactionMeta,
        tokenTransferData: {
          data: MOCK_TRANSFER_DATA,
          to: MOCK_TOKEN_ADDRESS,
          index: nestedCallIndex,
        },
      });

      act(() => {
        result.current.updateTokenAmount('2');
      });

      expect(updateAtomicBatchDataMock).toHaveBeenCalledTimes(1);
      expect(updateAtomicBatchDataMock).toHaveBeenCalledWith({
        transactionId: transactionMeta.id,
        transactionIndex: nestedCallIndex,
        transactionData: expect.stringMatching(/^0xa9059cbb/u),
      });
      expect(updateEditableParamsMock).not.toHaveBeenCalled();
    });

    it('encodes the new amount correctly with 18 decimals', () => {
      const transactionMeta = createMockTransactionMeta();
      const { result } = runHook({
        transactionMeta,
        requiredTokens: [{ decimals: 18, skipIfBalance: false }],
      });

      act(() => {
        result.current.updateTokenAmount('2');
      });

      const calledData = updateEditableParamsMock.mock.calls[0][1]
        .data as string;
      expect(calledData).toContain('1bc16d674ec80000');
    });

    it('does nothing when no primary required token resolves decimals', () => {
      const transactionMeta = createMockTransactionMeta();
      const { result } = runHook({
        transactionMeta,
        requiredTokens: [],
      });

      act(() => {
        result.current.updateTokenAmount('2');
      });

      expect(updateEditableParamsMock).not.toHaveBeenCalled();
      expect(updateAtomicBatchDataMock).not.toHaveBeenCalled();
    });

    it('does nothing when only skipIfBalance required tokens are present', () => {
      const transactionMeta = createMockTransactionMeta();
      const { result } = runHook({
        transactionMeta,
        requiredTokens: [{ decimals: MOCK_DECIMALS, skipIfBalance: true }],
      });

      act(() => {
        result.current.updateTokenAmount('2');
      });

      expect(updateEditableParamsMock).not.toHaveBeenCalled();
      expect(updateAtomicBatchDataMock).not.toHaveBeenCalled();
    });
  });

  describe('isUpdating', () => {
    it('returns false initially', () => {
      const { result } = runHook();

      expect(result.current.isUpdating).toBe(false);
    });

    it('is true while a money deposit amount commit is in flight, and false once it resolves', async () => {
      let resolveCommit: (value: boolean) => void = () => undefined;
      jest.mocked(updateMoneyAccountDepositAmount).mockReturnValue(
        new Promise((resolve) => {
          resolveCommit = resolve;
        }),
      );

      const transactionMeta = createMockTransactionMeta({
        nestedTransactions: [
          { to: MOCK_TOKEN_ADDRESS, type: 'approve' },
          { to: MOCK_RECIPIENT, type: 'moneyAccountDeposit' },
        ],
      } as unknown as Partial<TransactionMeta>);

      const { result } = runHook({
        transactionMeta,
        tokenTransferData: {
          data: undefined,
          to: undefined,
          index: undefined,
        },
      });

      expect(result.current.isUpdating).toBe(false);

      act(() => {
        result.current.updateTokenAmount('1.5');
      });

      await waitFor(() => expect(result.current.isUpdating).toBe(true));

      await act(async () => {
        resolveCommit(true);
      });

      await waitFor(() => expect(result.current.isUpdating).toBe(false));
    });

    it('is true while a money withdrawal amount commit is in flight, and false once it resolves', async () => {
      let resolveCommit: (
        value: false | MoneyAccountWithdrawAmountUpdate,
      ) => void = () => undefined;
      jest.mocked(updateMoneyAccountWithdrawAmount).mockReturnValue(
        new Promise((resolve) => {
          resolveCommit = resolve;
        }),
      );

      const transactionMeta = createMockTransactionMeta({
        nestedTransactions: [
          { to: MOCK_TOKEN_ADDRESS, type: 'moneyAccountWithdraw' },
          { to: MOCK_RECIPIENT, type: 'transfer' },
        ],
      } as unknown as Partial<TransactionMeta>);

      const { result } = runHook({
        transactionMeta,
        tokenTransferData: {
          data: undefined,
          to: undefined,
          index: undefined,
        },
      });

      act(() => {
        result.current.updateTokenAmount('2');
      });

      await waitFor(() => expect(result.current.isUpdating).toBe(true));

      await act(async () => {
        resolveCommit({
          withdrawData: '0x',
          transferData: '0x',
        });
      });

      await waitFor(() => expect(result.current.isUpdating).toBe(false));
    });

    it('stays true across a scheduling markAmountAsDisplayed call and the commit it precedes, then resolves once', async () => {
      // Simulates `useTransactionCustomAmount` calling `markAmountAsDisplayed`
      // synchronously when it schedules the debounced commit, ahead of the
      // debounce delay that eventually invokes `updateTokenAmount`. Both
      // record the same displayed amount, so the eventual commit resolving
      // that amount is what re-enables Confirm — recording twice is
      // harmless.
      let resolveCommit: (value: boolean) => void = () => undefined;
      jest.mocked(updateMoneyAccountDepositAmount).mockReturnValue(
        new Promise((resolve) => {
          resolveCommit = resolve;
        }),
      );

      const transactionMeta = createMockTransactionMeta({
        nestedTransactions: [
          { to: MOCK_TOKEN_ADDRESS, type: 'approve' },
          { to: MOCK_RECIPIENT, type: 'moneyAccountDeposit' },
        ],
      } as unknown as Partial<TransactionMeta>);

      const { result } = runHook({
        transactionMeta,
        tokenTransferData: {
          data: undefined,
          to: undefined,
          index: undefined,
        },
      });

      act(() => {
        result.current.markAmountAsDisplayed('1.5');
      });

      await waitFor(() => expect(result.current.isUpdating).toBe(true));

      act(() => {
        result.current.updateTokenAmount('1.5');
      });

      expect(result.current.isUpdating).toBe(true);

      await act(async () => {
        resolveCommit(true);
      });

      await waitFor(() => expect(result.current.isUpdating).toBe(false));
    });

    it('stays true when an older commit resolves while a newer amount is displayed', async () => {
      // The transaction's calldata encodes the older amount while the user
      // sees the newer one; Confirm must stay disabled until the newer
      // amount's own commit lands.
      const resolvers: ((value: boolean) => void)[] = [];
      jest.mocked(updateMoneyAccountDepositAmount).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvers.push(resolve);
          }),
      );

      const transactionMeta = createMockTransactionMeta({
        nestedTransactions: [
          { to: MOCK_TOKEN_ADDRESS, type: 'approve' },
          { to: MOCK_RECIPIENT, type: 'moneyAccountDeposit' },
        ],
      } as unknown as Partial<TransactionMeta>);

      const { result } = runHook({
        transactionMeta,
        tokenTransferData: {
          data: undefined,
          to: undefined,
          index: undefined,
        },
      });

      act(() => {
        result.current.updateTokenAmount('1.5');
      });
      act(() => {
        result.current.updateTokenAmount('2');
      });

      await waitFor(() => expect(result.current.isUpdating).toBe(true));

      // The "1.5" commit landing must not enable Confirm: displayed is "2".
      await act(async () => {
        resolvers[0](true);
      });
      expect(result.current.isUpdating).toBe(true);

      await act(async () => {
        resolvers[1](true);
      });
      await waitFor(() => expect(result.current.isUpdating).toBe(false));
    });

    it('stays true when the commit fails', async () => {
      // A failed commit means the calldata still encodes the previous
      // amount; enabling Confirm would let the user sign it while the
      // screen shows the new amount.
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      jest
        .mocked(updateMoneyAccountDepositAmount)
        .mockRejectedValue(new Error('vault read failed'));

      const transactionMeta = createMockTransactionMeta({
        nestedTransactions: [
          { to: MOCK_TOKEN_ADDRESS, type: 'approve' },
          { to: MOCK_RECIPIENT, type: 'moneyAccountDeposit' },
        ],
      } as unknown as Partial<TransactionMeta>);

      const { result } = runHook({
        transactionMeta,
        tokenTransferData: {
          data: undefined,
          to: undefined,
          index: undefined,
        },
      });

      await act(async () => {
        result.current.updateTokenAmount('1.5');
      });

      expect(result.current.isUpdating).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('stays true when the commit resolves without committing', async () => {
      // `false` means the background did not write calldata (zero amount or
      // superseded intent) - the displayed amount is not on the transaction.
      jest.mocked(updateMoneyAccountDepositAmount).mockResolvedValue(false);

      const transactionMeta = createMockTransactionMeta({
        nestedTransactions: [
          { to: MOCK_TOKEN_ADDRESS, type: 'approve' },
          { to: MOCK_RECIPIENT, type: 'moneyAccountDeposit' },
        ],
      } as unknown as Partial<TransactionMeta>);

      const { result } = runHook({
        transactionMeta,
        tokenTransferData: {
          data: undefined,
          to: undefined,
          index: undefined,
        },
      });

      await act(async () => {
        result.current.updateTokenAmount('1.5');
      });

      expect(result.current.isUpdating).toBe(true);
    });
  });
});
