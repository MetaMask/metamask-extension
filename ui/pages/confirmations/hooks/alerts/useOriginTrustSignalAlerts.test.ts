import { TransactionMeta } from '@metamask/transaction-controller';
import {
  getMockConfirmStateForTransaction,
  getMockPersonalSignConfirmStateForRequest,
} from '../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { unapprovedPersonalSignMsg } from '../../../../../test/data/confirmations/personal_sign';
import { SignatureRequestType } from '../../types/confirm';
import { Severity } from '../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { useOriginTrustSignals } from '../../../../hooks/useOriginTrustSignals';
import { useOriginTrustSignalAlerts } from './useOriginTrustSignalAlerts';

jest.mock('../../../../hooks/useOriginTrustSignals', () => ({
  useOriginTrustSignals: jest.fn(),
}));

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(() => (key: string) => key),
}));

const mockUseOriginTrustSignals = jest.mocked(useOriginTrustSignals);

const ORIGIN_MOCK = 'https://example.com';

const expectedMaliciousAlert = {
  key: 'originTrustSignalMalicious',
  reason: 'alertReasonOriginTrustSignalMalicious',
  field: RowAlertKey.RequestFrom,
  severity: Severity.Danger,
  message: 'alertMessageOriginTrustSignalMalicious',
};

const expectedWarningAlert = {
  key: 'originTrustSignalWarning',
  reason: 'alertReasonOriginTrustSignalWarning',
  field: RowAlertKey.RequestFrom,
  severity: Severity.Warning,
  message: 'alertMessageOriginTrustSignalWarning',
};

describe('useOriginTrustSignalAlerts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('transaction confirmations', () => {
    it('returns malicious alert for transaction with malicious origin', () => {
      mockUseOriginTrustSignals.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: null,
      });

      const contractInteraction =
        genUnapprovedContractInteractionConfirmation();
      const transactionWithOrigin = {
        ...contractInteraction,
        origin: ORIGIN_MOCK,
      } as TransactionMeta;

      const { result } = renderHookWithConfirmContextProvider(
        () => useOriginTrustSignalAlerts(),
        getMockConfirmStateForTransaction(transactionWithOrigin),
      );

      expect(result.current).toEqual([expectedMaliciousAlert]);
      expect(mockUseOriginTrustSignals).toHaveBeenCalledWith(ORIGIN_MOCK);
    });

    it('returns warning alert for transaction with warning origin', () => {
      mockUseOriginTrustSignals.mockReturnValue({
        state: TrustSignalDisplayState.Warning,
        label: null,
      });

      const contractInteraction =
        genUnapprovedContractInteractionConfirmation();
      const transactionWithOrigin = {
        ...contractInteraction,
        origin: ORIGIN_MOCK,
      } as TransactionMeta;

      const { result } = renderHookWithConfirmContextProvider(
        () => useOriginTrustSignalAlerts(),
        getMockConfirmStateForTransaction(transactionWithOrigin),
      );

      expect(result.current).toEqual([expectedWarningAlert]);
      expect(mockUseOriginTrustSignals).toHaveBeenCalledWith(ORIGIN_MOCK);
    });

    it('returns empty array for transaction with unknown origin state', () => {
      mockUseOriginTrustSignals.mockReturnValue({
        state: TrustSignalDisplayState.Unknown,
        label: null,
      });

      const contractInteraction =
        genUnapprovedContractInteractionConfirmation();
      const transactionWithOrigin = {
        ...contractInteraction,
        origin: ORIGIN_MOCK,
      } as TransactionMeta;

      const { result } = renderHookWithConfirmContextProvider(
        () => useOriginTrustSignalAlerts(),
        getMockConfirmStateForTransaction(transactionWithOrigin),
      );

      expect(result.current).toEqual([]);
    });

    it('returns empty array for transaction with no origin', () => {
      mockUseOriginTrustSignals.mockReturnValue({
        state: TrustSignalDisplayState.Unknown,
        label: null,
      });

      const contractInteraction =
        genUnapprovedContractInteractionConfirmation();
      const transactionWithoutOrigin = {
        ...contractInteraction,
        origin: '',
      } as TransactionMeta;

      const { result } = renderHookWithConfirmContextProvider(
        () => useOriginTrustSignalAlerts(),
        getMockConfirmStateForTransaction(transactionWithoutOrigin),
      );

      expect(result.current).toEqual([]);
      expect(mockUseOriginTrustSignals).toHaveBeenCalledWith('');
    });
  });

  describe('signature confirmations', () => {
    it('returns malicious alert for signature with malicious origin', () => {
      mockUseOriginTrustSignals.mockReturnValue({
        state: TrustSignalDisplayState.Malicious,
        label: null,
      });

      const signatureRequest = {
        ...unapprovedPersonalSignMsg,
        msgParams: {
          ...unapprovedPersonalSignMsg.msgParams,
          origin: ORIGIN_MOCK,
        },
      } as SignatureRequestType;

      const { result } = renderHookWithConfirmContextProvider(
        () => useOriginTrustSignalAlerts(),
        getMockPersonalSignConfirmStateForRequest(signatureRequest),
      );

      expect(result.current).toEqual([expectedMaliciousAlert]);
      expect(mockUseOriginTrustSignals).toHaveBeenCalledWith(ORIGIN_MOCK);
    });

    it('returns warning alert for signature with warning origin', () => {
      mockUseOriginTrustSignals.mockReturnValue({
        state: TrustSignalDisplayState.Warning,
        label: null,
      });

      const signatureRequest = {
        ...unapprovedPersonalSignMsg,
        msgParams: {
          ...unapprovedPersonalSignMsg.msgParams,
          origin: ORIGIN_MOCK,
        },
      } as SignatureRequestType;

      const { result } = renderHookWithConfirmContextProvider(
        () => useOriginTrustSignalAlerts(),
        getMockPersonalSignConfirmStateForRequest(signatureRequest),
      );

      expect(result.current).toEqual([expectedWarningAlert]);
      expect(mockUseOriginTrustSignals).toHaveBeenCalledWith(ORIGIN_MOCK);
    });

    it('returns empty array for signature with unknown origin state', () => {
      mockUseOriginTrustSignals.mockReturnValue({
        state: TrustSignalDisplayState.Unknown,
        label: null,
      });

      const signatureRequest = {
        ...unapprovedPersonalSignMsg,
        msgParams: {
          ...unapprovedPersonalSignMsg.msgParams,
          origin: ORIGIN_MOCK,
        },
      } as SignatureRequestType;

      const { result } = renderHookWithConfirmContextProvider(
        () => useOriginTrustSignalAlerts(),
        getMockPersonalSignConfirmStateForRequest(signatureRequest),
      );

      expect(result.current).toEqual([]);
    });

    it('returns empty array for signature with no origin', () => {
      mockUseOriginTrustSignals.mockReturnValue({
        state: TrustSignalDisplayState.Unknown,
        label: null,
      });

      const signatureRequest = {
        ...unapprovedPersonalSignMsg,
        msgParams: {
          ...unapprovedPersonalSignMsg.msgParams,
          origin: '',
        },
      } as SignatureRequestType;

      const { result } = renderHookWithConfirmContextProvider(
        () => useOriginTrustSignalAlerts(),
        getMockPersonalSignConfirmStateForRequest(signatureRequest),
      );

      expect(result.current).toEqual([]);
      expect(mockUseOriginTrustSignals).toHaveBeenCalledWith('');
    });
  });
});
