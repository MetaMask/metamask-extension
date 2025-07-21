import { ApprovalType } from '@metamask/controller-utils';
import {
  NestedTransactionMetadata,
  SimulationTokenBalanceChange,
  SimulationTokenStandard,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { TokenStandard } from '../../../../../../shared/constants/transaction';
import { parseApprovalTransactionData } from '../../../../../../shared/modules/transaction.utils';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { getTokenStandardAndDetailsByChain } from '../../../../../store/actions';
import { ApprovalBalanceChange } from '../../../components/confirm/info/hooks/useBatchApproveBalanceChanges';
import { useMultipleApprovalsAlerts } from './useMultipleApprovalsAlerts';

// Mock dependencies
jest.mock('../../../../../../shared/modules/transaction.utils');
jest.mock('../../../../../store/actions');
jest.mock(
  '../../../components/confirm/info/hooks/useBatchApproveBalanceChanges',
  () => ({
    useBatchApproveBalanceChanges: jest.fn(),
  }),
);
jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));
jest.mock('../../../../../hooks/useAsync', () => ({
  useAsyncResult: jest.fn(),
}));

const mockParseApprovalTransactionData =
  parseApprovalTransactionData as jest.MockedFunction<
    typeof parseApprovalTransactionData
  >;
const mockGetTokenStandardAndDetailsByChain =
  getTokenStandardAndDetailsByChain as jest.MockedFunction<
    typeof getTokenStandardAndDetailsByChain
  >;

// Get the mocked functions
const { useBatchApproveBalanceChanges } = jest.requireMock(
  '../../../components/confirm/info/hooks/useBatchApproveBalanceChanges',
);
const { useI18nContext } = jest.requireMock(
  '../../../../../hooks/useI18nContext',
);
const { useAsyncResult } = jest.requireMock('../../../../../hooks/useAsync');

const ACCOUNT_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc' as Hex;
const TOKEN_ADDRESS_1 = '0x1234567890123456789012345678901234567890' as Hex;
const TOKEN_ADDRESS_2 = '0x2345678901234567890123456789012345678901' as Hex;
const SPENDER_ADDRESS = '0x3456789012345678901234567890123456789012' as Hex;

const mockT = (key: string) => key;

// Mock approval balance change for tests
const MOCK_APPROVAL_BALANCE_CHANGE: ApprovalBalanceChange = {
  asset: {
    address: TOKEN_ADDRESS_1,
    chainId: '0x5',
    standard: TokenStandard.ERC20,
  },
  amount: new BigNumber('1000'),
  fiatAmount: null,
  isApproval: true,
  isAllApproval: false,
  isUnlimitedApproval: false,
  nestedTransactionIndex: 0,
};

const createMockNestedTransaction = (
  data: string,
  to: Hex,
): NestedTransactionMetadata => ({
  data: data as Hex,
  to,
  value: '0x0',
  gas: '0x5208',
});

const createMockSimulationChange = (
  address: Hex,
  difference: string,
  isDecrease: boolean,
): SimulationTokenBalanceChange => ({
  address,
  difference: difference as Hex,
  isDecrease,
  previousBalance: '0x0',
  newBalance: '0x0',
  standard: SimulationTokenStandard.erc20,
});

function runHook({
  currentConfirmation,
  nestedTransactions = [],
  simulationData = [],
  approveBalanceChanges = [],
}: {
  currentConfirmation?: Partial<TransactionMeta>;
  nestedTransactions?: NestedTransactionMetadata[];
  simulationData?: SimulationTokenBalanceChange[];
  approveBalanceChanges?: ApprovalBalanceChange[];
} = {}) {
  const confirmation = currentConfirmation
    ? {
        ...genUnapprovedContractInteractionConfirmation({ chainId: '0x5' }),
        ...currentConfirmation,
        nestedTransactions,
        simulationData: {
          tokenBalanceChanges: simulationData,
        },
      }
    : undefined;

  let pendingApprovals = {};
  if (confirmation) {
    pendingApprovals = {
      [confirmation.id as string]: {
        id: confirmation.id,
        type: ApprovalType.Transaction,
      },
    };
  }

  const state = getMockConfirmState({
    metamask: {
      pendingApprovals,
      transactions: confirmation ? [confirmation] : [],
    },
  });

  // Mock the batch approve balance changes hook
  useBatchApproveBalanceChanges.mockReturnValue({
    value: approveBalanceChanges,
  });

  // Mock i18n
  useI18nContext.mockReturnValue(mockT);

  const response = renderHookWithConfirmContextProvider(
    useMultipleApprovalsAlerts,
    state,
  );

  return response.result.current;
}

describe('useMultipleApprovalsAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // Default mock for token standard fetching
    mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
      standard: TokenStandard.ERC20,
    });

    // Mock useAsyncResult to return token standards synchronously
    useAsyncResult.mockReturnValue({
      value: {
        [TOKEN_ADDRESS_1]: TokenStandard.ERC20,
        [TOKEN_ADDRESS_2]: TokenStandard.ERC20,
      },
    });
  });

  describe('when no confirmation exists', () => {
    it('returns no alerts', () => {
      const alerts = runHook();
      expect(alerts).toEqual([]);
    });
  });

  describe('when no nested transactions exist', () => {
    it('returns no alerts', () => {
      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
      });
      expect(alerts).toEqual([]);
    });
  });

  describe('when no approve balance changes exist', () => {
    it('returns no alerts', () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', TOKEN_ADDRESS_1),
      ];

      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        amountOrTokenId: new BigNumber('1000'),
        tokenAddress: undefined,
        isRevokeAll: false,
      });

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        approveBalanceChanges: [],
      });

      expect(alerts).toEqual([]);
    });
  });

  describe('when approvals are used (have corresponding outflows)', () => {
    it('returns no alerts', async () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', TOKEN_ADDRESS_1),
      ];

      const simulationData = [
        createMockSimulationChange(TOKEN_ADDRESS_1, '0x64', true), // decrease
      ];

      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        amountOrTokenId: new BigNumber('1000'),
        tokenAddress: undefined,
        isRevokeAll: false,
      });

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        simulationData,
        approveBalanceChanges: [], // non-empty to pass the check
      });

      expect(alerts).toEqual([]);
    });
  });

  describe('when approvals are unused (no corresponding outflows)', () => {
    it('returns alert for unused approvals', async () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', TOKEN_ADDRESS_1),
      ];

      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        amountOrTokenId: new BigNumber('1000'),
        tokenAddress: undefined,
        isRevokeAll: false,
      });

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        simulationData: [], // no outflows
        approveBalanceChanges: [MOCK_APPROVAL_BALANCE_CHANGE],
      });

      expect(alerts).toEqual([
        {
          field: RowAlertKey.EstimatedChangesStatic,
          isBlocking: false,
          key: 'multipleApprovals',
          reason: 'alertReasonMultipleApprovals',
          content: 'alertContentMultipleApprovals',
          severity: Severity.Danger,
        },
      ]);
    });
  });

  describe('approval parsing scenarios', () => {
    it('handles regular ERC20 approve', () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', TOKEN_ADDRESS_1),
      ];

      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        amountOrTokenId: new BigNumber('1000'),
        tokenAddress: undefined, // regular approve
        isRevokeAll: false,
      });

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        approveBalanceChanges: [MOCK_APPROVAL_BALANCE_CHANGE],
      });

      expect(alerts).toHaveLength(1);
    });

    it('handles Permit2 approve', () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', SPENDER_ADDRESS),
      ];

      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        amountOrTokenId: new BigNumber('1000'),
        tokenAddress: TOKEN_ADDRESS_1, // Permit2 approve
        isRevokeAll: false,
      });

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        approveBalanceChanges: [MOCK_APPROVAL_BALANCE_CHANGE],
      });

      expect(alerts).toHaveLength(1);
    });

    it('handles increaseAllowance', () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', TOKEN_ADDRESS_1),
      ];

      mockParseApprovalTransactionData.mockReturnValue({
        name: 'increaseAllowance',
        amountOrTokenId: new BigNumber('500'),
        tokenAddress: undefined,
        isRevokeAll: false,
      });

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        approveBalanceChanges: [MOCK_APPROVAL_BALANCE_CHANGE],
      });

      expect(alerts).toHaveLength(1);
    });

    it('handles setApprovalForAll', () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', TOKEN_ADDRESS_1),
      ];

      mockParseApprovalTransactionData.mockReturnValue({
        name: 'setApprovalForAll',
        amountOrTokenId: new BigNumber('1'),
        tokenAddress: undefined,
        isRevokeAll: false,
      });

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        approveBalanceChanges: [MOCK_APPROVAL_BALANCE_CHANGE],
      });

      expect(alerts).toHaveLength(1);
    });
  });

  describe('approval skipping scenarios', () => {
    it('skips setApprovalForAll revocations', () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', TOKEN_ADDRESS_1),
      ];

      mockParseApprovalTransactionData.mockReturnValue({
        name: 'setApprovalForAll',
        amountOrTokenId: new BigNumber('0'),
        tokenAddress: undefined,
        isRevokeAll: true, // revocation
      });

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        approveBalanceChanges: [],
      });

      expect(alerts).toEqual([]);
    });

    it('skips ERC20 zero amount approvals (revocations)', () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', TOKEN_ADDRESS_1),
      ];

      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        amountOrTokenId: new BigNumber('0'), // zero amount
        tokenAddress: undefined,
        isRevokeAll: false,
      });

      mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
        standard: TokenStandard.ERC20,
      });

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        approveBalanceChanges: [],
      });

      expect(alerts).toEqual([]);
    });

    it('does not skip ERC721 token ID 0 approvals', () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', TOKEN_ADDRESS_1),
      ];

      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        amountOrTokenId: new BigNumber('0'), // token ID 0 for NFT
        tokenAddress: undefined,
        isRevokeAll: false,
      });

      // Override the default mock to return ERC721 for TOKEN_ADDRESS_1
      useAsyncResult.mockReturnValue({
        value: {
          [TOKEN_ADDRESS_1]: TokenStandard.ERC721,
          [TOKEN_ADDRESS_2]: TokenStandard.ERC20, // Keep others as ERC20
        },
      });

      mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
        standard: TokenStandard.ERC721,
      });

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        approveBalanceChanges: [MOCK_APPROVAL_BALANCE_CHANGE],
      });

      expect(alerts).toHaveLength(1);
    });

    it('skips transactions with no data', () => {
      const nestedTransactions = [
        createMockNestedTransaction('', TOKEN_ADDRESS_1), // no data
      ];

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        approveBalanceChanges: [],
      });

      expect(alerts).toEqual([]);
    });

    it('skips transactions with unparseable data', () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', TOKEN_ADDRESS_1),
      ];

      mockParseApprovalTransactionData.mockReturnValue(undefined);

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        approveBalanceChanges: [],
      });

      expect(alerts).toEqual([]);
    });

    it('skips unsupported approval methods', () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', TOKEN_ADDRESS_1),
      ];

      mockParseApprovalTransactionData.mockReturnValue({
        name: 'unsupportedMethod', // unsupported
        amountOrTokenId: new BigNumber('1000'),
        tokenAddress: undefined,
        isRevokeAll: false,
      });

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        approveBalanceChanges: [],
      });

      expect(alerts).toEqual([]);
    });
  });

  describe('multiple approvals scenarios', () => {
    it('handles multiple unused approvals', () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', TOKEN_ADDRESS_1),
        createMockNestedTransaction('0x456', TOKEN_ADDRESS_2),
      ];

      // parseApprovalTransactionData gets called multiple times:
      // 1. Once for each transaction in getUniqueTokenAddresses (2 calls)
      // 2. Once for each transaction in extractApprovals (2 calls)
      // So we need to set up 4 return values
      mockParseApprovalTransactionData
        .mockReturnValueOnce({
          name: 'approve',
          amountOrTokenId: new BigNumber('1000'),
          tokenAddress: undefined,
          isRevokeAll: false,
        })
        .mockReturnValueOnce({
          name: 'approve',
          amountOrTokenId: new BigNumber('2000'),
          tokenAddress: undefined,
          isRevokeAll: false,
        })
        .mockReturnValueOnce({
          name: 'approve',
          amountOrTokenId: new BigNumber('1000'),
          tokenAddress: undefined,
          isRevokeAll: false,
        })
        .mockReturnValueOnce({
          name: 'approve',
          amountOrTokenId: new BigNumber('2000'),
          tokenAddress: undefined,
          isRevokeAll: false,
        });

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        simulationData: [], // No outflows - should be unused
        approveBalanceChanges: [MOCK_APPROVAL_BALANCE_CHANGE],
      });

      expect(alerts).toHaveLength(1);
    });

    it('handles mixed used and unused approvals', () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', TOKEN_ADDRESS_1),
        createMockNestedTransaction('0x456', TOKEN_ADDRESS_2),
      ];

      const simulationData = [
        createMockSimulationChange(TOKEN_ADDRESS_1, '0x64', true), // used
        // TOKEN_ADDRESS_2 has no outflow - unused
      ];

      // parseApprovalTransactionData gets called 4 times:
      // 1. Once for each transaction in getUniqueTokenAddresses (2 calls)
      // 2. Once for each transaction in extractApprovals (2 calls)
      mockParseApprovalTransactionData
        .mockReturnValueOnce({
          name: 'approve',
          amountOrTokenId: new BigNumber('1000'),
          tokenAddress: undefined,
          isRevokeAll: false,
        })
        .mockReturnValueOnce({
          name: 'approve',
          amountOrTokenId: new BigNumber('2000'),
          tokenAddress: undefined,
          isRevokeAll: false,
        })
        .mockReturnValueOnce({
          name: 'approve',
          amountOrTokenId: new BigNumber('1000'),
          tokenAddress: undefined,
          isRevokeAll: false,
        })
        .mockReturnValueOnce({
          name: 'approve',
          amountOrTokenId: new BigNumber('2000'),
          tokenAddress: undefined,
          isRevokeAll: false,
        });

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        simulationData,
        approveBalanceChanges: [MOCK_APPROVAL_BALANCE_CHANGE],
      });

      expect(alerts).toHaveLength(1);
    });
  });

  describe('token standard handling', () => {
    it('handles token standard fetch failure gracefully', () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', TOKEN_ADDRESS_1),
      ];

      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        amountOrTokenId: new BigNumber('1000'),
        tokenAddress: undefined,
        isRevokeAll: false,
      });

      mockGetTokenStandardAndDetailsByChain.mockRejectedValue(
        new Error('Network error'),
      );

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        approveBalanceChanges: [MOCK_APPROVAL_BALANCE_CHANGE],
      });

      // Should still work with fallback to TokenStandard.none
      expect(alerts).toHaveLength(1);
    });

    it('handles invalid token standard gracefully', () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', TOKEN_ADDRESS_1),
      ];

      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        amountOrTokenId: new BigNumber('1000'),
        tokenAddress: undefined,
        isRevokeAll: false,
      });

      mockGetTokenStandardAndDetailsByChain.mockResolvedValue({
        standard: 'INVALID_STANDARD' as TokenStandard,
      });

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        approveBalanceChanges: [MOCK_APPROVAL_BALANCE_CHANGE],
      });

      expect(alerts).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('handles case-insensitive token address matching', () => {
      const nestedTransactions = [
        createMockNestedTransaction(
          '0x123',
          TOKEN_ADDRESS_1.toUpperCase() as Hex,
        ),
      ];

      const simulationData = [
        createMockSimulationChange(
          TOKEN_ADDRESS_1.toLowerCase() as Hex,
          '0x64',
          true,
        ),
      ];

      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        amountOrTokenId: new BigNumber('1000'),
        tokenAddress: undefined,
        isRevokeAll: false,
      });

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        simulationData,
        approveBalanceChanges: [],
      });

      expect(alerts).toEqual([]); // should match despite case difference
    });

    it('handles empty simulation data array', () => {
      const nestedTransactions = [
        createMockNestedTransaction('0x123', TOKEN_ADDRESS_1),
      ];

      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        amountOrTokenId: new BigNumber('1000'),
        tokenAddress: undefined,
        isRevokeAll: false,
      });

      const alerts = runHook({
        currentConfirmation: {
          txParams: { from: ACCOUNT_ADDRESS },
          chainId: '0x5',
        },
        nestedTransactions,
        simulationData: undefined, // undefined simulation data
        approveBalanceChanges: [MOCK_APPROVAL_BALANCE_CHANGE],
      });

      expect(alerts).toHaveLength(1); // should treat as unused
    });
  });
});
