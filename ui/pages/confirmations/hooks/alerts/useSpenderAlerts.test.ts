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

const mockIsSecurityAlertsAPIEnabled = jest.requireMock(
  '../../../../../app/scripts/lib/ppom/security-alerts-api',
).isSecurityAlertsAPIEnabled;

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
        isRevoke: false,
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
        isRevoke: false,
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
        isRevoke: false,
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
        isRevoke: false,
      });

      // Mock unknown trust signal response
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Unknown,
        label: null,
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('should not return alert when revoking ERC-20 malicious spender (amount == 0)', () => {
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
        amountOrTokenId: new BigNumber(0),
        isRevoke: true, // Detected as revoke
      });

      // Mock malicious trust signal response
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Known malicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      // Should not show alert for ERC-20 revoke transaction
      expect(result.current).toHaveLength(0);
    });

    it('should not return alert when revoking with setApprovalForAll (isRevokeAll)', () => {
      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodSetApprovalForAll,
        chainId: '0x1',
        txParams: {
          data: '0xsetapprovalforalldata',
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
        isRevokeAll: true, // Revoking all approvals
        isRevoke: true, // Detected as revoke
      });

      // Mock malicious trust signal response
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Known malicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      // Should not show alert for revoke transaction
      expect(result.current).toHaveLength(0);
    });

    it('should return alert for ERC-721 approve with tokenId 0 (SECURITY: prevent bypass)', () => {
      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodApprove,
        chainId: '0x1',
        txParams: {
          data: '0xerc721approvedata',
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
        amountOrTokenId: new BigNumber(0), // TokenId 0 - NOT a revoke!
        isRevoke: false, // Correctly NOT detected as revoke
      });

      // Mock malicious trust signal response
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Known malicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      // SECURITY: Should show alert for NFT approval even with tokenId 0
      // This prevents attackers from bypassing the security alert
      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedMaliciousAlert);
    });

    it('should not return alert when revoking ERC-721 single token approval (address(0))', () => {
      const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodApprove,
        chainId: '0x1',
        txParams: {
          data: '0xerc721approvedata',
        },
      };

      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockTransaction,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      } as unknown as ReturnType<typeof useConfirmContext>);
      mockParseApprovalTransactionData.mockReturnValue({
        name: 'approve',
        spender: ZERO_ADDRESS as `0x${string}`, // Zero address = revoke for ERC-721
        amountOrTokenId: new BigNumber(123), // Some tokenId
        isRevoke: true, // Detected as revoke
      });

      // Mock malicious trust signal - but spender is zero address
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Unknown, // Zero address won't be malicious
        label: null,
      });

      const { result } = renderHook(() => useSpenderAlerts());

      // Should not show alert when revoking ERC-721 approval via approve(address(0), tokenId)
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

    it('should not return alert when revoking permit with malicious spender (value == 0)', () => {
      const mockPermitData = JSON.stringify({
        domain: { name: 'Token', version: '1' },
        message: { spender: MOCK_SPENDER_ADDRESS, value: 0 },
        types: {},
      });

      const mockSignatureRequest = {
        id: MOCK_TRANSACTION_ID,
        type: 'eth_signTypedData',
        chainId: '0x1',
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
        message: { spender: MOCK_SPENDER_ADDRESS, value: 0 }, // Zero value = revoke
        domain: { name: 'Token', version: '1' },
        types: {},
      });

      // Mock malicious trust signal response
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: 'Phishing address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      // Should not show alert for revoke permit
      expect(result.current).toHaveLength(0);
    });
  });
});
