import { toHex } from '@metamask/controller-utils';
import {
  SimulationTokenStandard,
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../test/data/confirmations/helper';
import { buildSetApproveForAllTransactionData } from '../../../../../../test/data/confirmations/set-approval-for-all';
import {
  buildApproveTransactionData,
  buildIncreaseAllowanceTransactionData,
  buildPermit2ApproveTransactionData,
} from '../../../../../../test/data/confirmations/token-approve';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { tEn } from '../../../../../../test/lib/i18n-helpers';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useMultipleApprovalsAlerts } from './useMultipleApprovalsAlerts';

jest.mock('../../../../../../shared/modules/transaction.utils', () => ({
  parseApprovalTransactionData: jest.fn(),
}));

const mockParseApprovalTransactionData = jest.requireMock(
  '../../../../../../shared/modules/transaction.utils',
).parseApprovalTransactionData;

const ACCOUNT_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const TOKEN_ADDRESS_1 = '0x1234567890123456789012345678901234567890';
const TOKEN_ADDRESS_2 = '0x2345678901234567890123456789012345678901';
const SPENDER_ADDRESS = '0x3456789012345678901234567890123456789012';
const AMOUNT_MOCK = 1000;

const REASON_MULTIPLE_APPROVALS = tEn('alertReasonMultipleApprovals');
const CONTENT_MULTIPLE_APPROVALS =
  "You're giving someone else permission to withdraw your tokens, even though it's not necessary for this transaction.";

const createBatchTransaction = (
  nestedTransactions: { data?: Hex; to?: Hex; value: string }[],
): TransactionMeta =>
  ({
    id: 'batch-123',
    type: TransactionType.batch,
    status: TransactionStatus.unapproved,
    chainId: '0x1' as Hex,
    networkClientId: 'mainnet',
    time: Date.now(),
    txParams: {
      from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc' as Hex,
      to: '0x0000000000000000000000000000000000000000' as Hex,
      value: '0x0' as Hex,
    },
    nestedTransactions,
    simulationData: {
      tokenBalanceChanges: [],
    },
  } as unknown as TransactionMeta);

const createNestedTransaction = (data: Hex, to: Hex) => ({
  data,
  to,
  value: '0x0',
});

function runHook({
  currentConfirmation,
}: {
  currentConfirmation?: TransactionMeta;
} = {}) {
  const state = currentConfirmation
    ? getMockConfirmStateForTransaction(currentConfirmation)
    : getMockConfirmState();

  const response = renderHookWithConfirmContextProvider(
    useMultipleApprovalsAlerts,
    state,
  );

  return response.result.current;
}

describe('useMultipleApprovalsAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts for non-batch transactions', () => {
    const regularTransaction: TransactionMeta = {
      id: 'regular-123',
      type: TransactionType.contractInteraction,
      chainId: '0x1',
      txParams: {
        from: ACCOUNT_ADDRESS,
        to: TOKEN_ADDRESS_1,
        value: '0x0',
      },
    } as unknown as TransactionMeta;

    const alerts = runHook({ currentConfirmation: regularTransaction });
    expect(alerts).toEqual([]);
  });

  it('returns no alerts when no confirmation', () => {
    const alerts = runHook();
    expect(alerts).toEqual([]);
  });

  it('returns no alerts for batch transaction without nested transactions', () => {
    const batchTransaction = createBatchTransaction([]);
    const alerts = runHook({ currentConfirmation: batchTransaction });
    expect(alerts).toEqual([]);
  });

  it('returns no alerts when parseApprovalTransactionData returns null', () => {
    mockParseApprovalTransactionData.mockReturnValue(null);

    const nestedTx = createNestedTransaction(
      buildApproveTransactionData(SPENDER_ADDRESS, AMOUNT_MOCK),
      TOKEN_ADDRESS_1,
    );
    const batchTransaction = createBatchTransaction([nestedTx]);

    const alerts = runHook({ currentConfirmation: batchTransaction });
    expect(alerts).toEqual([]);
  });

  it('filters out revocation transactions (zero amounts)', () => {
    mockParseApprovalTransactionData.mockReturnValue({
      name: 'approve',
      amountOrTokenId: new BigNumber(0),
      isRevokeAll: false,
      tokenAddress: undefined,
    });

    const nestedTx = createNestedTransaction(
      buildApproveTransactionData(SPENDER_ADDRESS, 0),
      TOKEN_ADDRESS_1,
    );
    const batchTransaction = createBatchTransaction([nestedTx]);

    const alerts = runHook({ currentConfirmation: batchTransaction });
    expect(alerts).toEqual([]);
  });

  it('filters out setApprovalForAll revocations', () => {
    mockParseApprovalTransactionData.mockReturnValue({
      name: 'setApprovalForAll',
      amountOrTokenId: undefined,
      isRevokeAll: true,
      tokenAddress: undefined,
    });

    const nestedTx = createNestedTransaction(
      buildSetApproveForAllTransactionData(SPENDER_ADDRESS, false),
      TOKEN_ADDRESS_1,
    );
    const batchTransaction = createBatchTransaction([nestedTx]);

    const alerts = runHook({ currentConfirmation: batchTransaction });
    expect(alerts).toEqual([]);
  });

  describe('ERC20 approve transactions', () => {
    it('detects unused ERC20 approvals', () => {
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        amountOrTokenId: new BigNumber(AMOUNT_MOCK),
        isRevokeAll: false,
        tokenAddress: undefined,
      });

      const nestedTx = createNestedTransaction(
        buildApproveTransactionData(SPENDER_ADDRESS, AMOUNT_MOCK),
        TOKEN_ADDRESS_1,
      );
      const batchTransaction = createBatchTransaction([nestedTx]);

      const alerts = runHook({ currentConfirmation: batchTransaction });

      expect(alerts).toEqual([
        {
          field: RowAlertKey.EstimatedChangesStatic,
          isBlocking: false,
          key: 'multipleApprovals',
          reason: REASON_MULTIPLE_APPROVALS,
          content: CONTENT_MULTIPLE_APPROVALS,
          severity: Severity.Danger,
        },
      ]);
    });

    it('does not alert when ERC20 approval has corresponding outflow', () => {
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        amountOrTokenId: new BigNumber(AMOUNT_MOCK),
        isRevokeAll: false,
        tokenAddress: undefined,
      });

      const nestedTx = createNestedTransaction(
        buildApproveTransactionData(SPENDER_ADDRESS, AMOUNT_MOCK),
        TOKEN_ADDRESS_1,
      );
      const batchTransaction = createBatchTransaction([nestedTx]);

      // Add simulation data showing token outflow
      batchTransaction.simulationData = {
        tokenBalanceChanges: [
          {
            address: TOKEN_ADDRESS_1.toLowerCase() as Hex,
            difference: toHex(100),
            isDecrease: true,
            standard: SimulationTokenStandard.erc20,
            previousBalance: '0x0',
            newBalance: '0x0',
          },
        ],
      };

      const alerts = runHook({ currentConfirmation: batchTransaction });
      expect(alerts).toEqual([]);
    });
  });

  describe('Permit2 approve transactions', () => {
    it('detects unused Permit2 approvals', () => {
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        amountOrTokenId: new BigNumber(AMOUNT_MOCK),
        isRevokeAll: false,
        tokenAddress: TOKEN_ADDRESS_1,
      });

      const nestedTx = createNestedTransaction(
        buildPermit2ApproveTransactionData(
          TOKEN_ADDRESS_1,
          SPENDER_ADDRESS,
          AMOUNT_MOCK,
          1234567890,
        ),
        SPENDER_ADDRESS,
      );
      const batchTransaction = createBatchTransaction([nestedTx]);

      const alerts = runHook({ currentConfirmation: batchTransaction });

      expect(alerts).toEqual([
        {
          field: RowAlertKey.EstimatedChangesStatic,
          isBlocking: false,
          key: 'multipleApprovals',
          reason: REASON_MULTIPLE_APPROVALS,
          content: CONTENT_MULTIPLE_APPROVALS,
          severity: Severity.Danger,
        },
      ]);
    });
  });

  describe('increaseAllowance transactions', () => {
    it('detects unused increaseAllowance approvals', () => {
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'increaseAllowance',
        amountOrTokenId: new BigNumber(AMOUNT_MOCK),
        isRevokeAll: false,
        tokenAddress: undefined,
      });

      const nestedTx = createNestedTransaction(
        buildIncreaseAllowanceTransactionData(SPENDER_ADDRESS, AMOUNT_MOCK),
        TOKEN_ADDRESS_1,
      );
      const batchTransaction = createBatchTransaction([nestedTx]);

      const alerts = runHook({ currentConfirmation: batchTransaction });

      expect(alerts).toEqual([
        {
          field: RowAlertKey.EstimatedChangesStatic,
          isBlocking: false,
          key: 'multipleApprovals',
          reason: REASON_MULTIPLE_APPROVALS,
          content: CONTENT_MULTIPLE_APPROVALS,
          severity: Severity.Danger,
        },
      ]);
    });
  });

  describe('setApprovalForAll (NFT) transactions', () => {
    it('detects unused NFT approvals', () => {
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'setApprovalForAll',
        amountOrTokenId: undefined,
        isRevokeAll: false,
        tokenAddress: undefined,
      });

      const nestedTx = createNestedTransaction(
        buildSetApproveForAllTransactionData(SPENDER_ADDRESS, true),
        TOKEN_ADDRESS_1,
      );
      const batchTransaction = createBatchTransaction([nestedTx]);

      const alerts = runHook({ currentConfirmation: batchTransaction });

      expect(alerts).toEqual([
        {
          field: RowAlertKey.EstimatedChangesStatic,
          isBlocking: false,
          key: 'multipleApprovals',
          reason: REASON_MULTIPLE_APPROVALS,
          content: CONTENT_MULTIPLE_APPROVALS,
          severity: Severity.Danger,
        },
      ]);
    });

    it('does not alert when NFT approval has corresponding outflow', () => {
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'setApprovalForAll',
        amountOrTokenId: undefined,
        isRevokeAll: false,
        tokenAddress: undefined,
      });

      const nestedTx = createNestedTransaction(
        buildSetApproveForAllTransactionData(SPENDER_ADDRESS, true),
        TOKEN_ADDRESS_1,
      );
      const batchTransaction = createBatchTransaction([nestedTx]);

      // Add simulation data showing NFT outflow
      batchTransaction.simulationData = {
        tokenBalanceChanges: [
          {
            address: TOKEN_ADDRESS_1.toLowerCase() as Hex,
            difference: toHex(1),
            isDecrease: true,
            standard: SimulationTokenStandard.erc20,
            previousBalance: '0x0',
            newBalance: '0x0',
          },
        ],
      };

      const alerts = runHook({ currentConfirmation: batchTransaction });
      expect(alerts).toEqual([]);
    });
  });

  describe('multiple approvals scenarios', () => {
    it('detects multiple unused approvals of different types', () => {
      mockParseApprovalTransactionData
        .mockReturnValueOnce({
          name: 'approve',
          amountOrTokenId: new BigNumber(AMOUNT_MOCK),
          isRevokeAll: false,
          tokenAddress: undefined,
        })
        .mockReturnValueOnce({
          name: 'setApprovalForAll',
          amountOrTokenId: undefined,
          isRevokeAll: false,
          tokenAddress: undefined,
        });

      const nestedTx1 = createNestedTransaction(
        buildApproveTransactionData(SPENDER_ADDRESS, AMOUNT_MOCK),
        TOKEN_ADDRESS_1,
      );
      const nestedTx2 = createNestedTransaction(
        buildSetApproveForAllTransactionData(SPENDER_ADDRESS, true),
        TOKEN_ADDRESS_2,
      );
      const batchTransaction = createBatchTransaction([nestedTx1, nestedTx2]);

      const alerts = runHook({ currentConfirmation: batchTransaction });

      expect(alerts).toEqual([
        {
          field: RowAlertKey.EstimatedChangesStatic,
          isBlocking: false,
          key: 'multipleApprovals',
          reason: REASON_MULTIPLE_APPROVALS,
          content: CONTENT_MULTIPLE_APPROVALS,
          severity: Severity.Danger,
        },
      ]);
    });

    it('handles mixed used and unused approvals', () => {
      mockParseApprovalTransactionData
        .mockReturnValueOnce({
          name: 'approve',
          amountOrTokenId: new BigNumber(AMOUNT_MOCK),
          isRevokeAll: false,
          tokenAddress: undefined,
        })
        .mockReturnValueOnce({
          name: 'approve',
          amountOrTokenId: new BigNumber(AMOUNT_MOCK),
          isRevokeAll: false,
          tokenAddress: undefined,
        });

      const nestedTx1 = createNestedTransaction(
        buildApproveTransactionData(SPENDER_ADDRESS, AMOUNT_MOCK),
        TOKEN_ADDRESS_1,
      );
      const nestedTx2 = createNestedTransaction(
        buildApproveTransactionData(SPENDER_ADDRESS, AMOUNT_MOCK),
        TOKEN_ADDRESS_2,
      );
      const batchTransaction = createBatchTransaction([nestedTx1, nestedTx2]);

      // Add simulation data showing only one token has outflow
      batchTransaction.simulationData = {
        tokenBalanceChanges: [
          {
            address: TOKEN_ADDRESS_1.toLowerCase() as Hex,
            difference: toHex(100),
            isDecrease: true,
            standard: SimulationTokenStandard.erc20,
            previousBalance: '0x0',
            newBalance: '0x0',
          },
        ],
      };

      const alerts = runHook({ currentConfirmation: batchTransaction });

      expect(alerts).toEqual([
        {
          field: RowAlertKey.EstimatedChangesStatic,
          isBlocking: false,
          key: 'multipleApprovals',
          reason: REASON_MULTIPLE_APPROVALS,
          content: CONTENT_MULTIPLE_APPROVALS,
          severity: Severity.Danger,
        },
      ]);
    });
  });

  describe('edge cases', () => {
    it('handles transactions without data field', () => {
      const nestedTx = {
        to: TOKEN_ADDRESS_1 as Hex,
        value: '0x0',
        // no data field
      };
      const batchTransaction = createBatchTransaction([nestedTx]);

      const alerts = runHook({ currentConfirmation: batchTransaction });
      expect(alerts).toEqual([]);
    });

    it('handles transactions without to field', () => {
      const nestedTx = {
        data: buildApproveTransactionData(SPENDER_ADDRESS, AMOUNT_MOCK),
        value: '0x0',
        // no to field
      };
      const batchTransaction = createBatchTransaction([nestedTx]);

      const alerts = runHook({ currentConfirmation: batchTransaction });
      expect(alerts).toEqual([]);
    });

    it('handles unknown approval function names', () => {
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'unknownFunction',
        amountOrTokenId: new BigNumber(AMOUNT_MOCK),
        isRevokeAll: false,
        tokenAddress: undefined,
      });

      const nestedTx = createNestedTransaction(
        '0x12345678' as Hex,
        TOKEN_ADDRESS_1,
      );
      const batchTransaction = createBatchTransaction([nestedTx]);

      const alerts = runHook({ currentConfirmation: batchTransaction });
      expect(alerts).toEqual([]);
    });

    it('handles missing simulation data', () => {
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        amountOrTokenId: new BigNumber(AMOUNT_MOCK),
        isRevokeAll: false,
        tokenAddress: undefined,
      });

      const nestedTx = createNestedTransaction(
        buildApproveTransactionData(SPENDER_ADDRESS, AMOUNT_MOCK),
        TOKEN_ADDRESS_1,
      );
      const batchTransaction = createBatchTransaction([nestedTx]);

      // Remove simulation data
      delete batchTransaction.simulationData;

      const alerts = runHook({ currentConfirmation: batchTransaction });

      expect(alerts).toEqual([
        {
          field: RowAlertKey.EstimatedChangesStatic,
          isBlocking: false,
          key: 'multipleApprovals',
          reason: REASON_MULTIPLE_APPROVALS,
          content: CONTENT_MULTIPLE_APPROVALS,
          severity: Severity.Danger,
        },
      ]);
    });
  });
});
