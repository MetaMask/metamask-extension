import { renderHook } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';
import { useSignatureRequestOptional } from '../useSignatureRequest';
import { useTransactionMetadataRequestOptional } from '../useTransactionMetadataRequest';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Severity } from '../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import {
  useTrustSignal,
  TrustSignalDisplayState,
} from '../../../../hooks/useTrustSignals';
import { useIsNFT } from '../../components/confirm/info/approve/hooks/use-is-nft';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { DAI_CONTRACT_ADDRESS } from '../../components/confirm/info/shared/constants';
import {
  buildApproveTransactionData,
  buildPermit2ApproveTransactionData,
} from '../../../../../test/data/confirmations/token-approve';
import { buildSetApproveForAllTransactionData } from '../../../../../test/data/confirmations/set-approval-for-all';
import { useSpenderAlerts } from './useSpenderAlerts';

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(),
}));

jest.mock('../useTransactionMetadataRequest', () => ({
  useTransactionMetadataRequestOptional: jest.fn(),
}));

jest.mock('../useSignatureRequest', () => ({
  useSignatureRequestOptional: jest.fn(),
}));

jest.mock('../../../../hooks/useTrustSignals', () => ({
  useTrustSignal: jest.fn(),
  TrustSignalDisplayState: {
    Loading: 'Loading',
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

jest.mock('../../../../hooks/useAsync', () => ({
  useAsyncResult: jest.fn(),
}));

jest.mock('../../../../store/actions', () => ({
  getTokenStandardAndDetailsByChain: jest.fn(),
}));

const mockIsSecurityAlertsAPIEnabled = jest.requireMock(
  '../../../../../app/scripts/lib/ppom/security-alerts-api',
).isSecurityAlertsAPIEnabled;

const mockUseIsNFT = useIsNFT as jest.MockedFunction<typeof useIsNFT>;
const mockUseAsyncResult = useAsyncResult as jest.MockedFunction<
  typeof useAsyncResult
>;
const mockUseTrustSignal = useTrustSignal as jest.MockedFunction<
  typeof useTrustSignal
>;
const mockUseI18nContext = useI18nContext as jest.MockedFunction<
  typeof useI18nContext
>;
const mockUseTransactionMetadataRequestOptional =
  useTransactionMetadataRequestOptional as jest.MockedFunction<
    typeof useTransactionMetadataRequestOptional
  >;
const mockUseSignatureRequestOptional =
  useSignatureRequestOptional as jest.MockedFunction<
    typeof useSignatureRequestOptional
  >;

const MOCK_SPENDER_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_TRANSACTION_ID = 'test-tx-id';

function setupDefaultMocks() {
  jest.clearAllMocks();
  mockUseTransactionMetadataRequestOptional.mockReturnValue(undefined);
  mockUseSignatureRequestOptional.mockReturnValue(undefined);
  mockUseI18nContext.mockReturnValue((key: string) => key);
  mockUseTrustSignal.mockReturnValue({
    state: TrustSignalDisplayState.Unknown,
    label: null,
  });
  mockIsSecurityAlertsAPIEnabled.mockReturnValue(true);
  mockUseIsNFT.mockReturnValue({ isNFT: false, pending: false });
  mockUseAsyncResult.mockReturnValue({
    value: null,
    pending: false,
    error: undefined,
  } as ReturnType<typeof useAsyncResult>);
}

function setupCurrentRequest(confirmation: unknown) {
  if (
    confirmation &&
    typeof confirmation === 'object' &&
    'txParams' in confirmation
  ) {
    mockUseTransactionMetadataRequestOptional.mockReturnValue(
      confirmation as never,
    );
    mockUseSignatureRequestOptional.mockReturnValue(undefined);
    return;
  }

  mockUseTransactionMetadataRequestOptional.mockReturnValue(undefined);
  mockUseSignatureRequestOptional.mockReturnValue(confirmation as never);
}

function setupTrustSignal(
  state: TrustSignalDisplayState,
  label: string | null = null,
) {
  mockUseTrustSignal.mockReturnValue({ state, label });
}

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

function buildApproveTransaction({
  spender = MOCK_SPENDER_ADDRESS,
  amount = 1000,
  to,
  chainId = '0x1',
}: {
  spender?: string;
  amount?: number;
  to?: string;
  chainId?: string;
} = {}) {
  return {
    id: MOCK_TRANSACTION_ID,
    type: TransactionType.tokenMethodApprove,
    chainId,
    txParams: {
      ...(to && { to }),
      data: buildApproveTransactionData(spender, amount),
    },
  };
}

function buildPermitSignatureRequest({
  spender = MOCK_SPENDER_ADDRESS,
  value = '1000',
  domain = { name: 'TestToken', version: '1' },
}: {
  spender?: string;
  value?: string;
  domain?: Record<string, unknown>;
} = {}) {
  const permitData = JSON.stringify({
    primaryType: 'Permit',
    domain,
    message: { spender, value },
    types: {},
  });

  return {
    id: MOCK_TRANSACTION_ID,
    type: 'eth_signTypedData',
    msgParams: { data: permitData },
  };
}

function buildPermit2Transaction({
  tokenAddress,
  spender = MOCK_SPENDER_ADDRESS,
  amount = 0,
  expiration = 9999999999,
  from = '0x1111111111111111111111111111111111111111',
  to = '0x2222222222222222222222222222222222222222',
  chainId = '0x1',
}: {
  tokenAddress: string;
  spender?: string;
  amount?: number;
  expiration?: number;
  from?: string;
  to?: string;
  chainId?: string;
}) {
  return {
    id: MOCK_TRANSACTION_ID,
    type: TransactionType.tokenMethodApprove,
    chainId,
    txParams: {
      from,
      to,
      data: buildPermit2ApproveTransactionData(
        tokenAddress,
        spender,
        amount,
        expiration,
      ),
    },
  };
}

// #endregion

describe('useSpenderAlerts', () => {
  describe('approval transactions', () => {
    it('returns alert for malicious spender in tokenMethodApprove', () => {
      setupDefaultMocks();
      const mockTransaction = buildApproveTransaction();
      setupCurrentRequest(mockTransaction);
      setupTrustSignal(
        TrustSignalDisplayState.Malicious,
        'Known malicious address',
      );

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
      setupDefaultMocks();
      const mockTransaction = buildApproveTransaction();
      setupCurrentRequest(mockTransaction);
      setupTrustSignal(
        TrustSignalDisplayState.Warning,
        'Potentially suspicious address',
      );

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedWarningAlert);
    });

    it('returns empty array for benign spender', () => {
      setupDefaultMocks();
      const mockTransaction = buildApproveTransaction();
      setupCurrentRequest(mockTransaction);
      setupTrustSignal(TrustSignalDisplayState.Verified, 'Verified contract');

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('returns empty array for unknown trust signal state', () => {
      setupDefaultMocks();
      const mockTransaction = buildApproveTransaction();
      setupCurrentRequest(mockTransaction);
      setupTrustSignal(TrustSignalDisplayState.Unknown);

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });
  });

  describe('permit signatures', () => {
    it('returns alert for malicious spender in permit signature', () => {
      setupDefaultMocks();
      const mockSignatureRequest = buildPermitSignatureRequest();
      setupCurrentRequest(mockSignatureRequest);
      setupTrustSignal(TrustSignalDisplayState.Malicious, 'Phishing address');

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedMaliciousAlert);
    });

    it('returns warning alert for warning spender in permit signature', () => {
      setupDefaultMocks();
      const mockSignatureRequest = buildPermitSignatureRequest();
      setupCurrentRequest(mockSignatureRequest);
      setupTrustSignal(
        TrustSignalDisplayState.Warning,
        'Suspicious activity detected',
      );

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedWarningAlert);
    });

    it('returns empty array for non-permit signature', () => {
      setupDefaultMocks();
      const mockSignatureData = JSON.stringify({
        primaryType: 'Order',
        domain: {},
        message: {},
        types: {},
      });
      const mockSignatureRequest = {
        id: MOCK_TRANSACTION_ID,
        type: 'eth_signTypedData',
        msgParams: { data: mockSignatureData },
      };
      setupCurrentRequest(mockSignatureRequest);

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });
  });

  describe('revoke operations', () => {
    it('returns empty array for setApprovalForAll revocation with malicious spender', () => {
      setupDefaultMocks();
      const mockTransaction = {
        id: MOCK_TRANSACTION_ID,
        type: TransactionType.tokenMethodSetApprovalForAll,
        chainId: '0x1',
        txParams: {
          data: buildSetApproveForAllTransactionData(
            MOCK_SPENDER_ADDRESS,
            false,
          ),
        },
      };
      setupCurrentRequest(mockTransaction);
      setupTrustSignal(
        TrustSignalDisplayState.Malicious,
        'Known malicious address',
      );

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('returns empty array for ERC20 approval revocation with malicious spender', () => {
      setupDefaultMocks();
      const mockTransaction = buildApproveTransaction({
        amount: 0,
        to: '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa',
      });
      setupCurrentRequest(mockTransaction);
      mockUseIsNFT.mockReturnValue({ isNFT: false, pending: false });
      setupTrustSignal(
        TrustSignalDisplayState.Malicious,
        'Known malicious address',
      );

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('returns empty array for permit signature revocation with malicious spender', () => {
      setupDefaultMocks();
      const mockSignatureRequest = buildPermitSignatureRequest({ value: '0' });
      setupCurrentRequest(mockSignatureRequest);
      setupTrustSignal(
        TrustSignalDisplayState.Malicious,
        'Known malicious address',
      );

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('returns empty array for DAI permit revocation with malicious spender', () => {
      setupDefaultMocks();
      const mockPermitData = JSON.stringify({
        primaryType: 'Permit',
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
        msgParams: { data: mockPermitData },
      };
      setupCurrentRequest(mockSignatureRequest);
      setupTrustSignal(
        TrustSignalDisplayState.Malicious,
        'Known malicious address',
      );

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('returns alert for warning spender when NOT a revoke', () => {
      setupDefaultMocks();
      const mockTransaction = buildApproveTransaction({ amount: 1000 });
      setupCurrentRequest(mockTransaction);
      setupTrustSignal(
        TrustSignalDisplayState.Warning,
        'Potentially suspicious address',
      );

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedWarningAlert);
    });

    it('returns alert for NFT approval with token ID 0 (detected as NFT)', () => {
      setupDefaultMocks();
      const mockTransaction = buildApproveTransaction({
        amount: 0,
        to: '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa',
      });
      setupCurrentRequest(mockTransaction);
      mockUseIsNFT.mockReturnValue({ isNFT: true, pending: false });
      setupTrustSignal(
        TrustSignalDisplayState.Malicious,
        'Known malicious address',
      );

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedMaliciousAlert);
    });

    it('returns alert while NFT check is pending', () => {
      setupDefaultMocks();
      const mockTransaction = buildApproveTransaction({
        amount: 0,
        to: '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa',
      });
      setupCurrentRequest(mockTransaction);
      mockUseIsNFT.mockReturnValue({ isNFT: false, pending: true });
      setupTrustSignal(
        TrustSignalDisplayState.Malicious,
        'Known malicious address',
      );

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedMaliciousAlert);
    });

    it('returns empty array for Permit2 ERC20 revocation', () => {
      setupDefaultMocks();
      const tokenAddress = '0x3333333333333333333333333333333333333333';
      const mockTransaction = buildPermit2Transaction({
        tokenAddress,
        amount: 0,
      });
      setupCurrentRequest(mockTransaction);
      mockUseAsyncResult.mockReturnValue({
        value: { standard: 'ERC20' },
        pending: false,
        error: undefined,
      } as ReturnType<typeof useAsyncResult>);
      setupTrustSignal(
        TrustSignalDisplayState.Malicious,
        'Known malicious address',
      );

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(0);
    });

    it('returns alert for Permit2 NFT approval', () => {
      setupDefaultMocks();
      const tokenAddress = '0x4444444444444444444444444444444444444444';
      const mockTransaction = buildPermit2Transaction({
        tokenAddress,
        amount: 0,
      });
      setupCurrentRequest(mockTransaction);
      mockUseAsyncResult.mockReturnValue({
        value: { standard: 'ERC721' },
        pending: false,
        error: undefined,
      } as ReturnType<typeof useAsyncResult>);
      setupTrustSignal(
        TrustSignalDisplayState.Malicious,
        'Known malicious address',
      );

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedMaliciousAlert);
    });

    it('returns alert while Permit2 token details are pending', () => {
      setupDefaultMocks();
      const tokenAddress = '0x3333333333333333333333333333333333333333';
      const mockTransaction = buildPermit2Transaction({
        tokenAddress,
        amount: 0,
      });
      setupCurrentRequest(mockTransaction);
      mockUseAsyncResult.mockReturnValue({
        value: undefined,
        pending: true,
        error: undefined,
      } as ReturnType<typeof useAsyncResult>);
      setupTrustSignal(
        TrustSignalDisplayState.Malicious,
        'Known malicious address',
      );

      const { result } = renderHook(() => useSpenderAlerts());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]).toEqual(expectedMaliciousAlert);
    });
  });
});
