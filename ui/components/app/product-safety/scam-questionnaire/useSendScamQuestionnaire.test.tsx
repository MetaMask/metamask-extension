/* eslint-disable @typescript-eslint/naming-convention */
import { renderHook, act } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import { ORIGIN_METAMASK } from '../../../../../shared/constants/app';
import {
  BlockaidResultType,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';
import { MetaMetricsEventLocation } from '../../../../../shared/constants/metametrics';
import useAlerts from '../../../../hooks/useAlerts';
import { useConfirmContext } from '../../../../pages/confirmations/context/confirm';
import { useSendScamQuestionnaire } from './useSendScamQuestionnaire';

jest.mock('../../../../hooks/useAlerts');
jest.mock('../../../../pages/confirmations/context/confirm');

const mockUseAlerts = jest.mocked(useAlerts);
const mockUseConfirmContext = jest.mocked(useConfirmContext);

const OWNER_ID = 'tx-1';
const BLOCKAID_ALERT_KEY = 'blockaid-alert-key';

function setup({
  origin = ORIGIN_METAMASK,
  type = TransactionType.simpleSend,
  resultType = BlockaidResultType.Malicious,
  hasBlockaidAlert = true,
  isConfirmed = false,
}: {
  origin?: string;
  type?: TransactionType;
  resultType?: BlockaidResultType;
  hasBlockaidAlert?: boolean;
  isConfirmed?: boolean;
} = {}) {
  const setAlertConfirmed = jest.fn();
  const onCancel = jest.fn();

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
      ? [{ key: BLOCKAID_ALERT_KEY, provider: SecurityProvider.Blockaid }]
      : [],
    setAlertConfirmed,
    isAlertConfirmed: () => isConfirmed,
  } as unknown as ReturnType<typeof useAlerts>);

  const view = renderHook(() =>
    useSendScamQuestionnaire({ ownerId: OWNER_ID, onCancel }),
  );
  return { ...view, setAlertConfirmed, onCancel };
}

describe('useSendScamQuestionnaire', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('isScamQuestionnaireRequired', () => {
    it('is true for a malicious MetaMask send with an unconfirmed Blockaid alert', () => {
      const { result } = setup();
      expect(result.current.isScamQuestionnaireRequired).toBe(true);
    });

    it('is false when the verdict is not malicious', () => {
      const { result } = setup({ resultType: BlockaidResultType.Warning });
      expect(result.current.isScamQuestionnaireRequired).toBe(false);
    });

    it('is false when the transaction is not a MetaMask send', () => {
      const { result } = setup({ origin: 'https://dapp.example' });
      expect(result.current.isScamQuestionnaireRequired).toBe(false);
    });

    it('is false for a non-transfer transaction type', () => {
      const { result } = setup({ type: TransactionType.contractInteraction });
      expect(result.current.isScamQuestionnaireRequired).toBe(false);
    });

    it('is false once the Blockaid alert is already confirmed', () => {
      const { result } = setup({ isConfirmed: true });
      expect(result.current.isScamQuestionnaireRequired).toBe(false);
    });

    it('is false when there is no Blockaid alert', () => {
      const { result } = setup({ hasBlockaidAlert: false });
      expect(result.current.isScamQuestionnaireRequired).toBe(false);
    });
  });

  it('showScamQuestionnaire toggles visibility', () => {
    const { result } = setup();
    expect(result.current.isScamQuestionnaireVisible).toBe(false);
    act(() => result.current.showScamQuestionnaire());
    expect(result.current.isScamQuestionnaireVisible).toBe(true);
  });

  it('onCleanPass acknowledges the Blockaid alert and hides the modal', () => {
    const { result, setAlertConfirmed } = setup();
    act(() => result.current.showScamQuestionnaire());

    act(() => result.current.scamQuestionnaireProps.onCleanPass());

    expect(setAlertConfirmed).toHaveBeenCalledWith(BLOCKAID_ALERT_KEY, true);
    expect(result.current.isScamQuestionnaireVisible).toBe(false);
  });

  it('onBypass acknowledges the Blockaid alert (same as clean pass)', () => {
    const { result, setAlertConfirmed } = setup();
    act(() => result.current.scamQuestionnaireProps.onBypass());
    expect(setAlertConfirmed).toHaveBeenCalledWith(BLOCKAID_ALERT_KEY, true);
  });

  it('onReject cancels the confirmation and hides the modal', () => {
    const { result, onCancel, setAlertConfirmed } = setup();
    act(() => result.current.showScamQuestionnaire());

    act(() => result.current.scamQuestionnaireProps.onReject());

    expect(onCancel).toHaveBeenCalledWith({
      location: MetaMetricsEventLocation.Confirmation,
    });
    expect(setAlertConfirmed).not.toHaveBeenCalled();
    expect(result.current.isScamQuestionnaireVisible).toBe(false);
  });

  it('onDismiss hides the modal without acknowledging', () => {
    const { result, setAlertConfirmed } = setup();
    act(() => result.current.showScamQuestionnaire());

    act(() => result.current.scamQuestionnaireProps.onDismiss());

    expect(result.current.isScamQuestionnaireVisible).toBe(false);
    expect(setAlertConfirmed).not.toHaveBeenCalled();
  });
});
