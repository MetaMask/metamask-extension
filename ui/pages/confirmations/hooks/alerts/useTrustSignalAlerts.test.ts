import { TransactionMeta } from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';

import {
  getMockConfirmStateForTransaction,
  getMockPersonalSignConfirmStateForRequest,
} from '../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { unapprovedPersonalSignMsg } from '../../../../../test/data/confirmations/personal_sign';
import { SignatureRequestType } from '../../types/confirm';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { Severity } from '../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { useTrustSignalAlerts } from './useTrustSignalAlerts';

jest.mock('../../../../hooks/useTrustSignals', () => ({
  useTrustSignal: jest.fn(),
  TrustSignalDisplayState: {
    Malicious: 'malicious',
    Warning: 'warning',
    Unknown: 'unknown',
  },
}));

jest.mock('../../../../../app/scripts/lib/ppom/security-alerts-api', () => ({
  isSecurityAlertsAPIEnabled: jest.fn(),
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(() => (key: string) => key),
}));

const mockUseTrustSignal = jest.requireMock(
  '../../../../hooks/useTrustSignals',
).useTrustSignal;
const mockIsSecurityAlertsAPIEnabled = jest.requireMock(
  '../../../../../app/scripts/lib/ppom/security-alerts-api',
).isSecurityAlertsAPIEnabled;

const MALICIOUS_ADDRESS = '0x0000000000000000000000000000000000000bad';
const WARNING_ADDRESS = '0x0000000000000000000000000000000000000001';
const SAFE_ADDRESS = '0x0000000000000000000000000000000000000002';

const expectedMaliciousAlert = {
  actions: [],
  field: RowAlertKey.InteractingWith,
  isBlocking: false,
  key: 'trustSignalMalicious',
  message: 'alertMessageAddressTrustSignal',
  reason: 'nameModalTitleMalicious',
  severity: Severity.Danger,
};

const expectedWarningAlert = {
  actions: [],
  field: RowAlertKey.InteractingWith,
  isBlocking: false,
  key: 'trustSignalWarning',
  message: 'alertMessageAddressTrustSignal',
  reason: 'nameModalTitleWarning',
  severity: Severity.Warning,
};

describe('useTrustSignalAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSecurityAlertsAPIEnabled.mockReturnValue(true);
  });

  it('returns an empty array when security alerts API is disabled', () => {
    mockIsSecurityAlertsAPIEnabled.mockReturnValue(false);
    mockUseTrustSignal.mockReturnValue({
      state: TrustSignalDisplayState.Malicious,
    });

    const currentConfirmation = genUnapprovedContractInteractionConfirmation({
      chainId: CHAIN_IDS.GOERLI,
    });
    (currentConfirmation as TransactionMeta).txParams.to = MALICIOUS_ADDRESS;

    const { result } = renderHookWithConfirmContextProvider(
      () => useTrustSignalAlerts(),
      getMockConfirmStateForTransaction(currentConfirmation as TransactionMeta),
    );

    expect(result.current).toEqual([]);
  });

  describe('transaction confirmations', () => {
    it('returns malicious alert for transaction with malicious to address', () => {
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
      });

      const contractInteraction = genUnapprovedContractInteractionConfirmation({
        chainId: CHAIN_IDS.GOERLI,
      });

      const { result } = renderHookWithConfirmContextProvider(
        () => useTrustSignalAlerts(),
        getMockConfirmStateForTransaction({
          ...contractInteraction,
          txParams: {
            ...(contractInteraction as TransactionMeta).txParams,
            to: MALICIOUS_ADDRESS,
          },
        } as TransactionMeta),
      );

      expect(result.current).toEqual([expectedMaliciousAlert]);
      expect(mockUseTrustSignal).toHaveBeenCalledWith(
        MALICIOUS_ADDRESS,
        NameType.ETHEREUM_ADDRESS,
      );
    });

    it('returns warning alert for transaction with warning to address', () => {
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Warning,
      });

      const contractInteraction = genUnapprovedContractInteractionConfirmation({
        chainId: CHAIN_IDS.GOERLI,
      });

      const { result } = renderHookWithConfirmContextProvider(
        () => useTrustSignalAlerts(),
        getMockConfirmStateForTransaction({
          ...contractInteraction,
          txParams: {
            ...(contractInteraction as TransactionMeta).txParams,
            to: WARNING_ADDRESS,
          },
        } as TransactionMeta),
      );

      expect(result.current).toEqual([expectedWarningAlert]);
      expect(mockUseTrustSignal).toHaveBeenCalledWith(
        WARNING_ADDRESS,
        NameType.ETHEREUM_ADDRESS,
      );
    });

    it('returns empty array for transaction with safe to address', () => {
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Unknown,
      });

      const contractInteraction = genUnapprovedContractInteractionConfirmation({
        chainId: CHAIN_IDS.GOERLI,
      });

      const { result } = renderHookWithConfirmContextProvider(
        () => useTrustSignalAlerts(),
        getMockConfirmStateForTransaction({
          ...contractInteraction,
          txParams: {
            ...(contractInteraction as TransactionMeta).txParams,
            to: SAFE_ADDRESS,
          },
        } as TransactionMeta),
      );

      expect(result.current).toEqual([]);
    });
  });

  describe('signature confirmations', () => {
    it('returns malicious alert for signature with malicious verifying contract', () => {
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
      });

      const signatureRequest = {
        ...unapprovedPersonalSignMsg,
        msgParams: {
          ...unapprovedPersonalSignMsg.msgParams,
          data: JSON.stringify({
            domain: {
              verifyingContract: MALICIOUS_ADDRESS,
            },
          }),
        },
      } as SignatureRequestType;

      const { result } = renderHookWithConfirmContextProvider(
        () => useTrustSignalAlerts(),
        getMockPersonalSignConfirmStateForRequest(signatureRequest),
      );

      expect(result.current).toEqual([expectedMaliciousAlert]);
      expect(mockUseTrustSignal).toHaveBeenCalledWith(
        MALICIOUS_ADDRESS,
        NameType.ETHEREUM_ADDRESS,
      );
    });

    it('returns warning alert for signature with warning verifying contract', () => {
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Warning,
      });

      const signatureRequest = {
        ...unapprovedPersonalSignMsg,
        msgParams: {
          ...unapprovedPersonalSignMsg.msgParams,
          data: JSON.stringify({
            domain: {
              verifyingContract: WARNING_ADDRESS,
            },
          }),
        },
      } as SignatureRequestType;

      const { result } = renderHookWithConfirmContextProvider(
        () => useTrustSignalAlerts(),
        getMockPersonalSignConfirmStateForRequest(signatureRequest),
      );

      expect(result.current).toEqual([expectedWarningAlert]);
    });

    it('returns empty array for signature without verifying contract', () => {
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Unknown,
      });

      const signatureRequest = {
        ...unapprovedPersonalSignMsg,
        msgParams: {
          ...unapprovedPersonalSignMsg.msgParams,
          data: JSON.stringify({
            message: 'Sign this message',
          }),
        },
      } as SignatureRequestType;

      const { result } = renderHookWithConfirmContextProvider(
        () => useTrustSignalAlerts(),
        getMockPersonalSignConfirmStateForRequest(signatureRequest),
      );

      expect(result.current).toEqual([]);
      // Since there's no verifying contract, useTrustSignal should be called with empty string
      expect(mockUseTrustSignal).toHaveBeenCalledWith(
        '',
        NameType.ETHEREUM_ADDRESS,
      );
    });

    it('handles malformed signature data gracefully', () => {
      mockUseTrustSignal.mockReturnValue({
        state: TrustSignalDisplayState.Unknown,
      });

      const signatureRequest = {
        ...unapprovedPersonalSignMsg,
        msgParams: {
          ...unapprovedPersonalSignMsg.msgParams,
          data: 'invalid json data',
        },
      } as SignatureRequestType;

      const { result } = renderHookWithConfirmContextProvider(
        () => useTrustSignalAlerts(),
        getMockPersonalSignConfirmStateForRequest(signatureRequest),
      );

      expect(result.current).toEqual([]);
      // Should call with empty string when parsing fails
      expect(mockUseTrustSignal).toHaveBeenCalledWith(
        '',
        NameType.ETHEREUM_ADDRESS,
      );
    });
  });
});
