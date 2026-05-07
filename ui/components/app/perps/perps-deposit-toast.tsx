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

const id = 'perps-deposit-toast';
const duration = 5 * SECOND;

const Content = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="flex min-w-0 flex-1 flex-col" data-testid={id}>
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
      toast.dismiss(id);
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
      const content = <Content title={title} description={description} />;
      const options = { id, duration };

      if (isSuccess) {
        toast.success(content, options);
      } else {
        toast.error(content, options);
      }

      submitRequestToBackground('perpsClearDepositResult', []).catch(
        // Non-blocking: toast is already dismissed locally
      );
      return;
    }

    if (!depositInProgress) {
      toast.dismiss(id);
      return;
    }

    toast.loading(
      <Content
        title={t('perpsDepositToastPendingTitle')}
        description={t('perpsDepositToastPendingDescription')}
      />,
      {
        id,
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
