/* eslint-disable @typescript-eslint/naming-convention */
import { renderHook, act } from '@testing-library/react';
import { TransactionType } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { ORIGIN_METAMASK } from '../../../../../shared/constants/app';
import {
  BlockaidResultType,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';
import { MetaMetricsEventLocation } from '../../../../../shared/constants/metametrics';
import {
  SCAM_QUESTIONNAIRE_FLAG_KEY,
  SCAM_QUESTIONNAIRE_VARIANTS,
} from '../../../../../shared/lib/ab-testing/configs/scam-questionnaire';
import { ABTestVariant } from '../../../../../shared/lib/ab-testing/variants';
import useAlerts from '../../../../hooks/useAlerts';
import { useABTest } from '../../../../hooks/useABTest';
import { useConfirmContext } from '../../../../pages/confirmations/context/confirm';
import { ScamQuestionnaireTrigger } from './scam-questionnaire.constants';
import { useScamQuestionnaire } from './useScamQuestionnaire';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../../../../hooks/useAlerts');
jest.mock('../../../../hooks/useABTest');
jest.mock('../../../../pages/confirmations/context/confirm');

const mockUseSelector = jest.mocked(useSelector);
const mockUseAlerts = jest.mocked(useAlerts);
const mockUseABTest = jest.mocked(useABTest);
const mockUseConfirmContext = jest.mocked(useConfirmContext);

const OWNER_ID = 'tx-1';
const SECURITY_ALERT_KEY = 'security-alert-key';

// ─── Send-flow branch helpers ────────────────────────────────────────────────

function setupSendBranch({
  origin = ORIGIN_METAMASK,
  type = TransactionType.simpleSend,
  resultType = BlockaidResultType.Malicious,
  hasBlockaidAlert = true,
  isConfirmed = false,
  flagEnabled = true,
}: {
  origin?: string;
  type?: TransactionType;
  resultType?: BlockaidResultType;
  hasBlockaidAlert?: boolean;
  isConfirmed?: boolean;
  flagEnabled?: boolean;
} = {}) {
  const setAlertConfirmed = jest.fn();
  const onCancel = jest.fn();

  mockUseSelector.mockReturnValue({});

  mockUseABTest.mockReturnValue({
    variant: flagEnabled
      ? SCAM_QUESTIONNAIRE_VARIANTS[ABTestVariant.Treatment]
      : SCAM_QUESTIONNAIRE_VARIANTS[ABTestVariant.Control],
    variantName: flagEnabled ? ABTestVariant.Treatment : ABTestVariant.Control,
    isActive: flagEnabled,
  });

  mockUseConfirmContext.mockReturnValue({
    currentConfirmation: {
      id: OWNER_ID,
      origin,
      type,
      securityAlertResponse: { result_type: resultType },
    },
  } as unknown as ReturnType<typeof useConfirmContext>);

  mockUseAlerts.mockReturnValue({
    alerts: hasBlockaidAlert
      ? [{ key: SECURITY_ALERT_KEY, provider: SecurityProvider.Blockaid }]
      : [],
    setAlertConfirmed,
    isAlertConfirmed: () => isConfirmed,
  } as unknown as ReturnType<typeof useAlerts>);

  const view = renderHook(() =>
    useScamQuestionnaire({ ownerId: OWNER_ID, onCancel }),
  );
  return { ...view, setAlertConfirmed, onCancel };
}

// ─── Domain-list branch helpers ──────────────────────────────────────────────

function setupDomainBranch({
  origin = 'https://aurum.foundation',
  scamDomains = ['aurum.foundation'],
}: {
  origin?: string;
  scamDomains?: string[];
} = {}) {
  const setAlertConfirmed = jest.fn();
  const onCancel = jest.fn();

  mockUseSelector.mockReturnValue({
    [SCAM_QUESTIONNAIRE_FLAG_KEY]: {
      name: ABTestVariant.Control,
      value: scamDomains,
    },
  });

  mockUseABTest.mockReturnValue({
    variant: SCAM_QUESTIONNAIRE_VARIANTS[ABTestVariant.Control],
    variantName: ABTestVariant.Control,
    isActive: false,
  });

  mockUseConfirmContext.mockReturnValue({
    currentConfirmation: {
      id: OWNER_ID,
      origin,
      type: TransactionType.contractInteraction,
      securityAlertResponse: { result_type: BlockaidResultType.Benign },
    },
  } as unknown as ReturnType<typeof useConfirmContext>);

  mockUseAlerts.mockReturnValue({
    alerts: [],
    setAlertConfirmed,
    isAlertConfirmed: () => false,
  } as unknown as ReturnType<typeof useAlerts>);

  const view = renderHook(() =>
    useScamQuestionnaire({ ownerId: OWNER_ID, onCancel }),
  );
  return { ...view, setAlertConfirmed, onCancel };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useScamQuestionnaire', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('send-flow branch', () => {
    describe('isScamQuestionnaireRequired', () => {
      it('is true for a malicious MetaMask send with an unconfirmed Blockaid alert', () => {
        const { result } = setupSendBranch();
        expect(result.current.isScamQuestionnaireRequired).toBe(true);
      });

      it('is false when the verdict is not malicious', () => {
        const { result } = setupSendBranch({
          resultType: BlockaidResultType.Warning,
        });
        expect(result.current.isScamQuestionnaireRequired).toBe(false);
      });

      it('is false when the transaction is not a MetaMask send', () => {
        const { result } = setupSendBranch({ origin: 'https://dapp.example' });
        expect(result.current.isScamQuestionnaireRequired).toBe(false);
      });

      it('is false for a non-transfer transaction type', () => {
        const { result } = setupSendBranch({
          type: TransactionType.contractInteraction,
        });
        expect(result.current.isScamQuestionnaireRequired).toBe(false);
      });

      it('is false once the Blockaid alert is already confirmed', () => {
        const { result } = setupSendBranch({ isConfirmed: true });
        expect(result.current.isScamQuestionnaireRequired).toBe(false);
      });

      it('is false when there is no Blockaid alert', () => {
        const { result } = setupSendBranch({ hasBlockaidAlert: false });
        expect(result.current.isScamQuestionnaireRequired).toBe(false);
      });

      it('is false when the LaunchDarkly flag resolves to control', () => {
        const { result } = setupSendBranch({ flagEnabled: false });
        expect(result.current.isScamQuestionnaireRequired).toBe(false);
      });

      it('is false when the flag is off, even with all other conditions met', () => {
        const { result } = setupSendBranch({
          flagEnabled: false,
          origin: ORIGIN_METAMASK,
          type: TransactionType.simpleSend,
          resultType: BlockaidResultType.Malicious,
          hasBlockaidAlert: true,
          isConfirmed: false,
        });
        expect(result.current.isScamQuestionnaireRequired).toBe(false);
      });
    });

    it('calls useABTest with trackExposure disabled (rollout, not experiment)', () => {
      setupSendBranch();
      expect(mockUseABTest).toHaveBeenCalledWith(
        SCAM_QUESTIONNAIRE_FLAG_KEY,
        SCAM_QUESTIONNAIRE_VARIANTS,
        undefined,
        { trackExposure: false },
      );
    });

    it('showScamQuestionnaire toggles visibility', () => {
      const { result } = setupSendBranch();
      expect(result.current.isScamQuestionnaireVisible).toBe(false);
      act(() => result.current.showScamQuestionnaire());
      expect(result.current.isScamQuestionnaireVisible).toBe(true);
    });

    it('onCleanPass acknowledges the security alert and hides the modal', () => {
      const { result, setAlertConfirmed } = setupSendBranch();
      act(() => result.current.showScamQuestionnaire());

      act(() => result.current.scamQuestionnaireProps.onCleanPass());

      expect(setAlertConfirmed).toHaveBeenCalledWith(SECURITY_ALERT_KEY, true);
      expect(result.current.isScamQuestionnaireVisible).toBe(false);
    });

    it('onBypass acknowledges the security alert (same as clean pass)', () => {
      const { result, setAlertConfirmed } = setupSendBranch();
      act(() => result.current.scamQuestionnaireProps.onBypass());
      expect(setAlertConfirmed).toHaveBeenCalledWith(SECURITY_ALERT_KEY, true);
    });

    it('onReject cancels the confirmation and hides the modal', () => {
      const { result, onCancel, setAlertConfirmed } = setupSendBranch();
      act(() => result.current.showScamQuestionnaire());

      act(() => result.current.scamQuestionnaireProps.onReject());

      expect(onCancel).toHaveBeenCalledWith({
        location: MetaMetricsEventLocation.Confirmation,
      });
      expect(setAlertConfirmed).not.toHaveBeenCalled();
      expect(result.current.isScamQuestionnaireVisible).toBe(false);
    });

    it('onDismiss hides the modal without acknowledging', () => {
      const { result, setAlertConfirmed } = setupSendBranch();
      act(() => result.current.showScamQuestionnaire());

      act(() => result.current.scamQuestionnaireProps.onDismiss());

      expect(result.current.isScamQuestionnaireVisible).toBe(false);
      expect(setAlertConfirmed).not.toHaveBeenCalled();
    });

    it('reports trigger as security_alert', () => {
      const { result } = setupSendBranch();
      expect(result.current.scamQuestionnaireProps.trigger).toBe(
        ScamQuestionnaireTrigger.SecurityAlert,
      );
    });
  });

  describe('domain-list branch', () => {
    describe('isScamQuestionnaireRequired', () => {
      it('is true for a dapp-initiated tx from a listed scam domain', () => {
        const { result } = setupDomainBranch();
        expect(result.current.isScamQuestionnaireRequired).toBe(true);
      });

      it('is false when the scam domain list is empty', () => {
        const { result } = setupDomainBranch({ scamDomains: [] });
        expect(result.current.isScamQuestionnaireRequired).toBe(false);
      });

      it('is false when the origin does not match any listed domain', () => {
        const { result } = setupDomainBranch({
          origin: 'https://legitimate.example',
          scamDomains: ['aurum.foundation'],
        });
        expect(result.current.isScamQuestionnaireRequired).toBe(false);
      });

      it('is true for a subdomain of a listed root domain', () => {
        const { result } = setupDomainBranch({
          origin: 'https://app.aurum.foundation/invest',
          scamDomains: ['aurum.foundation'],
        });
        expect(result.current.isScamQuestionnaireRequired).toBe(true);
      });

      it('is false for a MetaMask-origin tx even if the domain list is non-empty', () => {
        const { result } = setupDomainBranch({
          origin: ORIGIN_METAMASK,
          scamDomains: ['aurum.foundation'],
        });
        expect(result.current.isScamQuestionnaireRequired).toBe(false);
      });

      it('is false after the user passes the questionnaire', () => {
        const { result } = setupDomainBranch();
        expect(result.current.isScamQuestionnaireRequired).toBe(true);

        act(() => result.current.showScamQuestionnaire());
        act(() => result.current.scamQuestionnaireProps.onCleanPass());

        expect(result.current.isScamQuestionnaireRequired).toBe(false);
      });
    });

    it('onCleanPass hides the modal without touching alert state', () => {
      const { result, setAlertConfirmed } = setupDomainBranch();
      act(() => result.current.showScamQuestionnaire());

      act(() => result.current.scamQuestionnaireProps.onCleanPass());

      expect(setAlertConfirmed).not.toHaveBeenCalled();
      expect(result.current.isScamQuestionnaireVisible).toBe(false);
    });

    it('onReject cancels the confirmation and hides the modal', () => {
      const { result, onCancel } = setupDomainBranch();
      act(() => result.current.showScamQuestionnaire());

      act(() => result.current.scamQuestionnaireProps.onReject());

      expect(onCancel).toHaveBeenCalledWith({
        location: MetaMetricsEventLocation.Confirmation,
      });
      expect(result.current.isScamQuestionnaireVisible).toBe(false);
    });

    it('resets pass state when the confirmation changes', () => {
      const { result, rerender } = setupDomainBranch();
      act(() => result.current.showScamQuestionnaire());
      act(() => result.current.scamQuestionnaireProps.onCleanPass());
      expect(result.current.isScamQuestionnaireRequired).toBe(false);

      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: {
          id: 'tx-2',
          origin: 'https://aurum.foundation',
          type: TransactionType.contractInteraction,
          securityAlertResponse: { result_type: BlockaidResultType.Benign },
        },
      } as unknown as ReturnType<typeof useConfirmContext>);
      act(() => rerender());

      expect(result.current.isScamQuestionnaireRequired).toBe(true);
      expect(result.current.isScamQuestionnaireVisible).toBe(false);
    });

    it('reports trigger as domain_list', () => {
      const { result } = setupDomainBranch();
      expect(result.current.scamQuestionnaireProps.trigger).toBe(
        ScamQuestionnaireTrigger.DomainList,
      );
    });
  });
});
