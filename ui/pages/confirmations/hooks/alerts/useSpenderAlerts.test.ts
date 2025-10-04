import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../context/confirm';
import {
  parseApprovalTransactionData,
  parseTypedDataMessage,
} from '../../../../../shared/modules/transaction.utils';
import { Severity } from '../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { useSpenderAlerts } from './useSpenderAlerts';

// Mock dependencies
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

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

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
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

describe('useSpenderAlerts', () => {
  const mockT = (key: string) => key;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseI18nContext.mockReturnValue(mockT);
    mockUseSelector.mockReturnValue(undefined);
  });

  describe('approval transactions', () => {
    it('should return alert for malicious spender in tokenMethodApprove', () => {
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

      // Mock malicious security alert response
      mockUseSelector.mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result_type: 'Malicious',
        label: 'Known malicious address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual({
        actions: [],
        field: RowAlertKey.Spender,
        isBlocking: false,
        key: 'spenderTrustSignalMalicious',
        message: 'alertMessageAddressTrustSignal',
        reason: 'nameModalTitleMalicious',
        severity: Severity.Danger,
      });
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

      // Mock benign security alert response
      mockUseSelector.mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result_type: 'Benign',
        label: '',
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

      // Mock malicious security alert response
      mockUseSelector.mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result_type: 'Malicious',
        label: 'Phishing address',
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual({
        actions: [],
        field: RowAlertKey.Spender,
        isBlocking: false,
        key: 'spenderTrustSignalMalicious',
        message: 'alertMessageAddressTrustSignal',
        reason: 'nameModalTitleMalicious',
        severity: Severity.Danger,
      });
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

  describe('edge cases', () => {
    it('should return empty array when no confirmation', () => {
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: null,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: jest.fn(),
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('should return empty array when spender address not found', () => {
      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodApprove,
        txParams: {
          data: '0xapprovedata',
        },
      };

      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: mockTransaction,
      });
      mockParseApprovalTransactionData.mockReturnValue(undefined);

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('should return empty array when no security alert response', () => {
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

      // No security alert response
      mockUseSelector.mockReturnValue(undefined);

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });
  });
});
