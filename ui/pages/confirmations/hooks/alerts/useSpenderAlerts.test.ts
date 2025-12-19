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

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const MOCK_SPENDER_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_TRANSACTION_ID = 'test-tx-id';
const MOCK_TOKEN_ADDRESS = '0xTokenAddress';

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

type SetupOptions = {
  erc20Cache?: Record<string, { data: Record<string, unknown> }>;
  nftCache?: Record<string, Record<string, unknown>>;
  trustSignalState?: TrustSignalDisplayState;
  trustSignalLabel?: string | null;
};

function setupTest({
  erc20Cache = {},
  nftCache = {},
  trustSignalState = TrustSignalDisplayState.Unknown,
  trustSignalLabel = null,
}: SetupOptions = {}) {
  const mockT = (key: string) => key;

  const mockUseI18nContext = useI18nContext as jest.MockedFunction<
    typeof useI18nContext
  >;
  const mockUseTrustSignal = useTrustSignal as jest.MockedFunction<
    typeof useTrustSignal
  >;
  const mockIsSecurityAlertsAPIEnabled = jest.requireMock(
    '../../../../../app/scripts/lib/ppom/security-alerts-api',
  ).isSecurityAlertsAPIEnabled;
  const mockUseSelector = jest.requireMock('react-redux').useSelector;

  jest.clearAllMocks();

  mockUseI18nContext.mockReturnValue(mockT);
  mockUseTrustSignal.mockReturnValue({
    state: trustSignalState,
    label: trustSignalLabel,
  });
  mockIsSecurityAlertsAPIEnabled.mockReturnValue(true);
  mockUseSelector.mockReset();
  mockUseSelector.mockReturnValueOnce(erc20Cache).mockReturnValueOnce(nftCache);

  return {
    mockUseConfirmContext: useConfirmContext as jest.MockedFunction<
      typeof useConfirmContext
    >,
    mockParseApprovalTransactionData:
      parseApprovalTransactionData as jest.MockedFunction<
        typeof parseApprovalTransactionData
      >,
    mockParseTypedDataMessage: parseTypedDataMessage as jest.MockedFunction<
      typeof parseTypedDataMessage
    >,
    mockUseTrustSignal,
  };
}

describe('useSpenderAlerts', () => {
  describe('approval transactions', () => {
    it('returns alert for malicious spender in tokenMethodApprove', () => {
      const {
        mockUseConfirmContext,
        mockParseApprovalTransactionData,
        mockUseTrustSignal,
      } = setupTest({
        trustSignalState: TrustSignalDisplayState.Malicious,
        trustSignalLabel: 'Known malicious address',
      });

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

      const { result } = renderHook(() => useSpenderAlerts());

      expect(mockUseTrustSignal).toHaveBeenCalledWith(
        MOCK_SPENDER_ADDRESS,
        NameType.ETHEREUM_ADDRESS,
        '0x1',
      );
      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedMaliciousAlert);
    });

    it('returns alert for warning spender in tokenMethodApprove', () => {
      const { mockUseConfirmContext, mockParseApprovalTransactionData } =
        setupTest({
          trustSignalState: TrustSignalDisplayState.Warning,
          trustSignalLabel: 'Potentially suspicious address',
        });

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

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedWarningAlert);
    });

    it('returns empty array for benign spender', () => {
      const { mockUseConfirmContext, mockParseApprovalTransactionData } =
        setupTest({
          trustSignalState: TrustSignalDisplayState.Verified,
          trustSignalLabel: 'Verified contract',
        });

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

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('returns empty array for unknown trust signal state', () => {
      const { mockUseConfirmContext, mockParseApprovalTransactionData } =
        setupTest();

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

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });
  });

  describe('permit signatures', () => {
    it('returns alert for malicious spender in permit signature', () => {
      const { mockUseConfirmContext, mockParseTypedDataMessage } = setupTest({
        trustSignalState: TrustSignalDisplayState.Malicious,
        trustSignalLabel: 'Phishing address',
      });

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

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedMaliciousAlert);
    });

    it('returns warning alert for warning spender in permit signature', () => {
      const { mockUseConfirmContext, mockParseTypedDataMessage } = setupTest({
        trustSignalState: TrustSignalDisplayState.Warning,
        trustSignalLabel: 'Suspicious activity detected',
      });

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

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedWarningAlert);
    });

    it('returns empty array for non-permit signature', () => {
      const { mockUseConfirmContext, mockParseTypedDataMessage } = setupTest();

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
      const { mockUseConfirmContext, mockParseApprovalTransactionData } =
        setupTest({
          trustSignalState: TrustSignalDisplayState.Malicious,
          trustSignalLabel: 'Known malicious address',
        });

      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodSetApprovalForAll,
        chainId: '0x1',
        txParams: {
          data: '0xsetApprovalForAllRevokeData',
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

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('returns empty array for ERC20 approval revocation (zero amount) with malicious spender', () => {
      const tokenAddress = MOCK_TOKEN_ADDRESS.toLowerCase();
      const { mockUseConfirmContext, mockParseApprovalTransactionData } =
        setupTest({
          erc20Cache: { '0x1': { data: { [tokenAddress]: { symbol: 'TEST' } } } },
          trustSignalState: TrustSignalDisplayState.Malicious,
          trustSignalLabel: 'Known malicious address',
        });

      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodApprove,
        chainId: '0x1',
        txParams: {
          to: MOCK_TOKEN_ADDRESS,
          data: '0xapproveRevokeData',
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

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('returns empty array for permit signature revocation (zero value) with malicious spender', () => {
      const { mockUseConfirmContext, mockParseTypedDataMessage } = setupTest({
        trustSignalState: TrustSignalDisplayState.Malicious,
        trustSignalLabel: 'Known malicious address',
      });

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

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('returns empty array for DAI permit revocation (allowed: false) with malicious spender', () => {
      const { mockUseConfirmContext, mockParseTypedDataMessage } = setupTest({
        trustSignalState: TrustSignalDisplayState.Malicious,
        trustSignalLabel: 'Known malicious address',
      });

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

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('still returns alert for warning spender when NOT a revoke (non-zero amount)', () => {
      const { mockUseConfirmContext, mockParseApprovalTransactionData } =
        setupTest({
          trustSignalState: TrustSignalDisplayState.Warning,
          trustSignalLabel: 'Potentially suspicious address',
        });

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
        amountOrTokenId: new BigNumber(1000),
        isRevokeAll: false,
      });

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedWarningAlert);
    });

    it('still returns alert for NFT approval with token ID 0 (found in NFT cache)', () => {
      const nftContractAddress = '0xnftcontractaddress';
      const { mockUseConfirmContext, mockParseApprovalTransactionData } =
        setupTest({
          nftCache: { '0x1': { [nftContractAddress]: { name: 'TestNFT' } } },
          trustSignalState: TrustSignalDisplayState.Malicious,
          trustSignalLabel: 'Known malicious address',
        });

      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodApprove,
        chainId: '0x1',
        txParams: {
          to: '0xNFTContractAddress',
          data: '0xapproveNFTData',
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

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedMaliciousAlert);
    });
  });
});
