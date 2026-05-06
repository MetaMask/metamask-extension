import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { SECOND } from '../../../../shared/constants/time';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  selectPerpsDepositPending,
  selectPerpsLastDepositResult,
  selectPerpsLastDepositTransactionId,
  selectPerpsShouldShowDepositToast,
} from '../../../selectors/perps-controller';
import { toast } from '../../ui/toast/toast';

const PERPS_DEPOSIT_TOAST_ID = 'perps-deposit-toast';
const COMPLETION_TOAST_DURATION = 5 * SECOND;

const PerpsDepositToastContent = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div
    className="flex min-w-0 flex-1 flex-col"
    data-testid={PERPS_DEPOSIT_TOAST_ID}
  >
    <p className="text-m-body-md">{title}</p>
    <p className="mt-1 text-m-body-sm text-text-alternative">{description}</p>
  </div>
);

export function PerpsDepositToast() {
  const t = useI18nContext();
  const depositInProgress = useSelector(selectPerpsDepositPending);
  const lastDepositResult = useSelector(selectPerpsLastDepositResult);
  const lastDepositTransactionId = useSelector(
    selectPerpsLastDepositTransactionId,
  );
  const shouldShowDepositToast = useSelector(selectPerpsShouldShowDepositToast);
  const hasDepositResult = Boolean(lastDepositResult);
  const lastDepositResultError = lastDepositResult?.error;
  const lastDepositResultSuccess = lastDepositResult?.success;
  const lastDepositResultTimestamp = lastDepositResult?.timestamp;

  useEffect(() => {
    if (!shouldShowDepositToast) {
      toast.dismiss(PERPS_DEPOSIT_TOAST_ID);
      return;
    }

    if (hasDepositResult) {
      const isSuccess = lastDepositResultSuccess === true;
      const title = isSuccess
        ? t('perpsDepositToastSuccessTitle')
        : t('perpsDepositToastErrorTitle');
      const description = isSuccess
        ? t('perpsDepositToastSuccessDescription')
        : lastDepositResultError || t('perpsDepositToastErrorDescription');
      const content = (
        <PerpsDepositToastContent title={title} description={description} />
      );
      const options = {
        id: PERPS_DEPOSIT_TOAST_ID,
        duration: COMPLETION_TOAST_DURATION,
      };

      if (isSuccess) {
        toast.success(content, options);
      } else {
        toast.error(content, options);
      }

      submitRequestToBackground('perpsClearDepositResult', []).catch(
        () => undefined,
      );
      return;
    }

    if (!depositInProgress) {
      toast.dismiss(PERPS_DEPOSIT_TOAST_ID);
      return;
    }

    toast.loading(
      <PerpsDepositToastContent
        title={t('perpsDepositToastPendingTitle')}
        description={t('perpsDepositToastPendingDescription')}
      />,
      {
        id: PERPS_DEPOSIT_TOAST_ID,
        duration: Infinity,
      },
    );
  }, [
    depositInProgress,
    hasDepositResult,
    lastDepositResultError,
    lastDepositResultSuccess,
    lastDepositResultTimestamp,
    lastDepositTransactionId,
    shouldShowDepositToast,
    t,
  ]);

  return null;
}
