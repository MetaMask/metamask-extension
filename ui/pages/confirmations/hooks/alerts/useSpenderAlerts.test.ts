import { renderHook } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';

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
      });
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
      });
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
      });
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
      });
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
      });
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
      });
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
      });
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
});
