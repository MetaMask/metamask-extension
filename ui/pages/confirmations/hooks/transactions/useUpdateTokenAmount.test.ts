import type { TransactionMeta } from '@metamask/transaction-controller';
import { act } from '@testing-library/react';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { updateEditableParams } from '../../../../store/actions';
import { updateAtomicBatchData } from '../../../../store/controller-actions/transaction-controller';
import * as useTransactionPayDataModule from '../pay/useTransactionPayData';
import * as transactionPayUtils from '../../utils/transaction-pay';
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

jest.mock('../pay/useTransactionPayData');
jest.mock('../../utils/transaction-pay');

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

  const state = getMockConfirmStateForTransaction(transactionMeta);

  return renderHookWithConfirmContextProvider(useUpdateTokenAmount, state);
}

describe('useUpdateTokenAmount', () => {
  const updateEditableParamsMock = jest.mocked(updateEditableParams);
  const updateAtomicBatchDataMock = jest.mocked(updateAtomicBatchData);

  beforeEach(() => {
    jest.resetAllMocks();
    updateAtomicBatchDataMock.mockResolvedValue(undefined);
    updateEditableParamsMock.mockReturnValue((() =>
      Promise.resolve()) as never);
  });

  describe('updateTokenAmount', () => {
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

    it('uses 18 decimals as default when no required token found', () => {
      const transactionMeta = createMockTransactionMeta();
      const { result } = runHook({
        transactionMeta,
        requiredTokens: [],
      });

      act(() => {
        result.current.updateTokenAmount('2');
      });

      expect(updateEditableParamsMock).toHaveBeenCalled();
    });
  });

  describe('isUpdating', () => {
    it('returns false initially', () => {
      const { result } = runHook();

      expect(result.current.isUpdating).toBe(false);
    });
  });
});
