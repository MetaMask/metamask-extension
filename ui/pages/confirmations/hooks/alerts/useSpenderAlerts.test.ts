import { renderHook } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';
import { BigNumber } from 'bignumber.js';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../context/confirm';
import {
  parseApprovalTransactionData,
  parseTypedDataMessage,
} from '../../../../../shared/modules/transaction.utils';
import { Severity } from '../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import {
  useTrustSignal,
  TrustSignalDisplayState,
} from '../../../../hooks/useTrustSignals';
import { useIsNFT } from '../../components/confirm/info/approve/hooks/use-is-nft';
import { DAI_CONTRACT_ADDRESS } from '../../components/confirm/info/shared/constants';
import { useSpenderAlerts } from './useSpenderAlerts';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock('../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));

jest.mock('../../../../../shared/modules/transaction.utils', () => ({
  parseApprovalTransactionData: jest.fn(),
  parseTypedDataMessage: jest.fn(),
}));

jest.mock('../../../../hooks/useTrustSignals', () => ({
  useTrustSignal: jest.fn(),
  TrustSignalDisplayState: {
    Loading: 'loading',
    Malicious: 'malicious',
    Petname: 'petname',
    Verified: 'verified',
    Warning: 'warning',
    Recognized: 'recognized',
    Unknown: 'unknown',
  },
}));

jest.mock('../../../../../app/scripts/lib/ppom/security-alerts-api', () => ({
  isSecurityAlertsAPIEnabled: jest.fn(),
}));

jest.mock('../../components/confirm/info/approve/hooks/use-is-nft', () => ({
  useIsNFT: jest.fn(),
}));

const mockIsSecurityAlertsAPIEnabled = jest.requireMock(
  '../../../../../app/scripts/lib/ppom/security-alerts-api',
).isSecurityAlertsAPIEnabled;

const mockUseIsNFT = useIsNFT as jest.MockedFunction<typeof useIsNFT>;

const mockUseTrustSignal = useTrustSignal as jest.MockedFunction<
  typeof useTrustSignal
>;
const mockUseI18nContext = useI18nContext as jest.MockedFunction<
  typeof useI18nContext
>;
const mockUseConfirmContext = useConfirmContext as jest.MockedFunction<
  typeof useConfirmContext
>;
const mockParseApprovalTransactionData =
  parseApprovalTransactionData as jest.MockedFunction<
    typeof parseApprovalTransactionData
  >;
const mockParseTypedDataMessage = parseTypedDataMessage as jest.MockedFunction<
  typeof parseTypedDataMessage
>;

const MOCK_SPENDER_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_TRANSACTION_ID = 'test-tx-id';

const expectedWarningAlert = {
  actions: [],
  field: RowAlertKey.Spender,
  isBlocking: false,
  key: 'spenderTrustSignalWarning',
  message: 'alertMessageAddressTrustSignal',
  reason: 'nameModalTitleWarning',
  severity: Severity.Warning,
};

const expectedMaliciousAlert = {
  actions: [],
  field: RowAlertKey.Spender,
  isBlocking: false,
  key: 'spenderTrustSignalMalicious',
  message: 'alertMessageAddressTrustSignalMalicious',
  reason: 'nameModalTitleMalicious',
  severity: Severity.Danger,
};

const MOCK_APPROVE_CALLDATA =
  '0x095ea7b30000000000000000000000001234567890123456789012345678901234567890';
const MOCK_SET_APPROVAL_FOR_ALL_CALLDATA =
  '0xa22cb4650000000000000000000000001234567890123456789012345678901234567890';

describe('useSpenderAlerts', () => {
  const mockT = (key: string) => key;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseI18nContext.mockReturnValue(mockT);
    mockUseTrustSignal.mockReturnValue({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });
    mockIsSecurityAlertsAPIEnabled.mockReturnValue(true);
    mockUseIsNFT.mockReturnValue({ isNFT: false, pending: false });
  });

  describe('approval transactions', () => {
    it('should return alert for malicious spender in tokenMethodApprove', () => {
      // Mock transaction data
      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodApprove,
        chainId: '0x1',
        txParams: {
          data: '0xapprovedata',
        },
      };

      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockTransaction,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        spender: MOCK_SPENDER_ADDRESS as `0x${string}`,
      });

      // Mock malicious trust signal response
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Known malicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(mockUseTrustSignal).toHaveBeenCalledWith(
        MOCK_SPENDER_ADDRESS,
        NameType.ETHEREUM_ADDRESS,
        '0x1',
      );
      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedMaliciousAlert);
    });

    it('should return alert for warning spender in tokenMethodApprove', () => {
      // Mock transaction data
      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodApprove,
        txParams: {
          data: '0xapprovedata',
        },
      };

      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockTransaction,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        spender: MOCK_SPENDER_ADDRESS as `0x${string}`,
      });

      // Mock warning trust signal response
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Warning,
        label: 'Potentially suspicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedWarningAlert);
    });

    it('should return empty array for benign spender', () => {
      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodApprove,
        txParams: {
          data: '0xapprovedata',
        },
      };

      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockTransaction,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        spender: MOCK_SPENDER_ADDRESS as `0x${string}`,
      });

      // Mock benign trust signal response (verified/unknown)
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Verified,
        label: 'Verified contract',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('should return empty array for unknown trust signal state', () => {
      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodApprove,
        txParams: {
          data: '0xapprovedata',
        },
      };

      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockTransaction,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        spender: MOCK_SPENDER_ADDRESS as `0x${string}`,
      });

      // Mock unknown trust signal response
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Unknown,
        label: null,
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });
  });

  describe('permit signatures', () => {
    it('should return alert for malicious spender in permit signature', () => {
      const mockPermitData = JSON.stringify({
        domain: { name: 'Token', version: '1' },
        message: { spender: MOCK_SPENDER_ADDRESS },
        types: {},
      });

      const mockSignatureRequest = {
        id: MOCK_TRANSACTION_ID,
        type: 'eth_signTypedData',
        msgParams: {
          data: mockPermitData,
        },
      };

      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockSignatureRequest,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseTypedDataMessage.mockReturnValue({
        primaryType: 'Permit',
        message: { spender: MOCK_SPENDER_ADDRESS },
        domain: { name: 'Token', version: '1' },
        types: {},
      });

      // Mock malicious trust signal response
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Phishing address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedMaliciousAlert);
    });

    it('should return warning alert for warning spender in permit signature', () => {
      const mockPermitData = JSON.stringify({
        domain: { name: 'Token', version: '1' },
        message: { spender: MOCK_SPENDER_ADDRESS },
        types: {},
      });

      const mockSignatureRequest = {
        id: MOCK_TRANSACTION_ID,
        type: 'eth_signTypedData',
        msgParams: {
          data: mockPermitData,
        },
      };

      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockSignatureRequest,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseTypedDataMessage.mockReturnValue({
        primaryType: 'Permit',
        message: { spender: MOCK_SPENDER_ADDRESS },
        domain: { name: 'Token', version: '1' },
        types: {},
      });

      // Mock warning trust signal response
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Warning,
        label: 'Suspicious activity detected',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedWarningAlert);
    });

    it('should return empty array for non-permit signature', () => {
      const mockSignatureRequest = {
        id: MOCK_TRANSACTION_ID,
        type: 'eth_signTypedData',
        msgParams: {
          data: '{"primaryType": "Order"}',
        },
      };

      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockSignatureRequest,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseTypedDataMessage.mockReturnValue({
        primaryType: 'Order',
        message: {},
        domain: {},
        types: {},
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });
  });

  describe('revoke operations', () => {
    it('returns empty array for setApprovalForAll revocation with malicious spender', () => {
      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodSetApprovalForAll,
        chainId: '0x1',
        txParams: {
          data: MOCK_SET_APPROVAL_FOR_ALL_CALLDATA,
        },
      };
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockTransaction,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'setApprovalForAll',
        spender: MOCK_SPENDER_ADDRESS as `0x${string}`,
        isRevokeAll: true,
      });
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Known malicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('returns empty array for ERC20 approval revocation with malicious spender', () => {
      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodApprove,
        chainId: '0x1',
        txParams: {
          to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          data: MOCK_APPROVE_CALLDATA,
        },
      };
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockTransaction,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        spender: MOCK_SPENDER_ADDRESS as `0x${string}`,
        amountOrTokenId: new BigNumber(0),
        isRevokeAll: false,
      });
      mockUseIsNFT.mockReturnValue({ isNFT: false, pending: false });
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Known malicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('returns empty array for permit signature revocation with malicious spender', () => {
      const mockPermitData = JSON.stringify({
        domain: { name: 'Token', version: '1' },
        message: { spender: MOCK_SPENDER_ADDRESS, value: '0' },
        types: {},
      });
      const mockSignatureRequest = {
        id: MOCK_TRANSACTION_ID,
        type: 'eth_signTypedData',
        msgParams: {
          data: mockPermitData,
        },
      };
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockSignatureRequest,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseTypedDataMessage.mockReturnValue({
        primaryType: 'Permit',
        message: { spender: MOCK_SPENDER_ADDRESS, value: '0' },
        domain: { name: 'Token', version: '1' },
        types: {},
      });
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Known malicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('returns empty array for DAI permit revocation with malicious spender', () => {
      const mockPermitData = JSON.stringify({
        domain: {
          name: 'Dai',
          version: '1',
          verifyingContract: DAI_CONTRACT_ADDRESS,
        },
        message: { spender: MOCK_SPENDER_ADDRESS, allowed: false },
        types: {},
      });
      const mockSignatureRequest = {
        id: MOCK_TRANSACTION_ID,
        type: 'eth_signTypedData',
        msgParams: {
          data: mockPermitData,
        },
      };
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockSignatureRequest,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseTypedDataMessage.mockReturnValue({
        primaryType: 'Permit',
        message: { spender: MOCK_SPENDER_ADDRESS, allowed: false },
        domain: {
          name: 'Dai',
          version: '1',
          verifyingContract: DAI_CONTRACT_ADDRESS,
        },
        types: {},
      });
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Known malicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('returns alert for warning spender when NOT a revoke', () => {
      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodApprove,
        chainId: '0x1',
        txParams: {
          data: MOCK_APPROVE_CALLDATA,
        },
      };
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockTransaction,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        spender: MOCK_SPENDER_ADDRESS as `0x${string}`,
        amountOrTokenId: new BigNumber(1000),
        isRevokeAll: false,
      });
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Warning,
        label: 'Potentially suspicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedWarningAlert);
    });

    it('returns alert for NFT approval with token ID 0 (detected as NFT)', () => {
      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodApprove,
        chainId: '0x1',
        txParams: {
          to: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
          data: MOCK_APPROVE_CALLDATA,
        },
      };
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockTransaction,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        spender: MOCK_SPENDER_ADDRESS as `0x${string}`,
        amountOrTokenId: new BigNumber(0),
        isRevokeAll: false,
      });
      mockUseIsNFT.mockReturnValue({ isNFT: true, pending: false });
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Known malicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedMaliciousAlert);
    });

    it('returns empty array while NFT check is pending', () => {
      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodApprove,
        chainId: '0x1',
        txParams: {
          to: '0x6b175474e89094c44da98b954eedeac495271d0f',
          data: MOCK_APPROVE_CALLDATA,
        },
      };
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockTransaction,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        spender: MOCK_SPENDER_ADDRESS as `0x${string}`,
        amountOrTokenId: new BigNumber(0),
        isRevokeAll: false,
      });
      mockUseIsNFT.mockReturnValue({ isNFT: false, pending: true });
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Known malicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedMaliciousAlert);
    });

    it('returns empty array for PermitSingle revocation (amount=0) with malicious spender', () => {
      const mockPermitSingleData = JSON.stringify({
        primaryType: 'PermitSingle',
        domain: { name: 'Permit2', chainId: '1' },
        message: {
          details: {
            token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            amount: '0',
          },
          spender: MOCK_SPENDER_ADDRESS,
          sigDeadline: '1720297342',
        },
        types: {},
      });
      const mockSignatureRequest = {
        id: MOCK_TRANSACTION_ID,
        type: 'eth_signTypedData',
        msgParams: {
          data: mockPermitSingleData,
        },
      };
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockSignatureRequest,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseTypedDataMessage.mockReturnValue({
        primaryType: 'PermitSingle',
        message: {
          details: {
            token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            amount: '0',
          },
          spender: MOCK_SPENDER_ADDRESS,
          sigDeadline: '1720297342',
        },
        domain: { name: 'Permit2', chainId: '1' },
        types: {},
      });
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Known malicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('returns empty array for PermitBatch revocation (all amounts=0) with malicious spender', () => {
      const mockPermitBatchData = JSON.stringify({
        primaryType: 'PermitBatch',
        domain: { name: 'Permit2', chainId: '1' },
        message: {
          details: [
            {
              token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              amount: '0',
            },
            {
              token: '0x6b175474e89094c44da98b954eedeac495271d0f',
              amount: '0',
            },
          ],
          spender: MOCK_SPENDER_ADDRESS,
          sigDeadline: '1720297342',
        },
        types: {},
      });
      const mockSignatureRequest = {
        id: MOCK_TRANSACTION_ID,
        type: 'eth_signTypedData',
        msgParams: {
          data: mockPermitBatchData,
        },
      };
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockSignatureRequest,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseTypedDataMessage.mockReturnValue({
        primaryType: 'PermitBatch',
        message: {
          details: [
            {
              token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              amount: '0',
            },
            {
              token: '0x6b175474e89094c44da98b954eedeac495271d0f',
              amount: '0',
            },
          ],
          spender: MOCK_SPENDER_ADDRESS,
          sigDeadline: '1720297342',
        },
        domain: { name: 'Permit2', chainId: '1' },
        types: {},
      });
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Known malicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('returns alert for PermitSingle with non-zero amount', () => {
      const mockPermitSingleData = JSON.stringify({
        primaryType: 'PermitSingle',
        domain: { name: 'Permit2', chainId: '1' },
        message: {
          details: {
            token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            amount: '1000000',
          },
          spender: MOCK_SPENDER_ADDRESS,
          sigDeadline: '1720297342',
        },
        types: {},
      });
      const mockSignatureRequest = {
        id: MOCK_TRANSACTION_ID,
        type: 'eth_signTypedData',
        msgParams: {
          data: mockPermitSingleData,
        },
      };
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockSignatureRequest,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseTypedDataMessage.mockReturnValue({
        primaryType: 'PermitSingle',
        message: {
          details: {
            token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            amount: '1000000',
          },
          spender: MOCK_SPENDER_ADDRESS,
          sigDeadline: '1720297342',
        },
        domain: { name: 'Permit2', chainId: '1' },
        types: {},
      });
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Known malicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedMaliciousAlert);
    });

    it('returns alert for PermitBatch with mixed amounts (not all zero)', () => {
      const mockPermitBatchData = JSON.stringify({
        primaryType: 'PermitBatch',
        domain: { name: 'Permit2', chainId: '1' },
        message: {
          details: [
            {
              token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              amount: '0',
            },
            {
              token: '0x6b175474e89094c44da98b954eedeac495271d0f',
              amount: '1000',
            },
          ],
          spender: MOCK_SPENDER_ADDRESS,
          sigDeadline: '1720297342',
        },
        types: {},
      });
      const mockSignatureRequest = {
        id: MOCK_TRANSACTION_ID,
        type: 'eth_signTypedData',
        msgParams: {
          data: mockPermitBatchData,
        },
      };
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockSignatureRequest,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseTypedDataMessage.mockReturnValue({
        primaryType: 'PermitBatch',
        message: {
          details: [
            {
              token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              amount: '0',
            },
            {
              token: '0x6b175474e89094c44da98b954eedeac495271d0f',
              amount: '1000',
            },
          ],
          spender: MOCK_SPENDER_ADDRESS,
          sigDeadline: '1720297342',
        },
        domain: { name: 'Permit2', chainId: '1' },
        types: {},
      });
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Known malicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedMaliciousAlert);
    });

    it('returns empty array for PermitTransferFrom revocation (amount=0) with malicious spender', () => {
      const mockPermitTransferFromData = JSON.stringify({
        primaryType: 'PermitTransferFrom',
        domain: { name: 'Permit2', chainId: '1' },
        message: {
          permitted: {
            token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            amount: '0',
          },
          spender: MOCK_SPENDER_ADDRESS,
          nonce: '0',
          deadline: '1720297342',
        },
        types: {},
      });
      const mockSignatureRequest = {
        id: MOCK_TRANSACTION_ID,
        type: 'eth_signTypedData',
        msgParams: {
          data: mockPermitTransferFromData,
        },
      };
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockSignatureRequest,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseTypedDataMessage.mockReturnValue({
        primaryType: 'PermitTransferFrom',
        message: {
          permitted: {
            token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            amount: '0',
          },
          spender: MOCK_SPENDER_ADDRESS,
          nonce: '0',
          deadline: '1720297342',
        },
        domain: { name: 'Permit2', chainId: '1' },
        types: {},
      });
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Known malicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });
  });
});
