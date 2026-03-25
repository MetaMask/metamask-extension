import React from 'react';
import { toast, ToastBar, Toaster as ToasterBase } from 'react-hot-toast';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../shared/constants/app';
// eslint-disable-next-line import-x/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import {
  useTransactionDisplayData,
  type TransactionStatus,
} from '../../../helpers/utils/transaction-display';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { SPINNER_INPUT, ToastStatusIcon } from './toast-status-icon';

export const ToastContent = ({ variant }: { variant: TransactionStatus }) => {
  const { title } = useTransactionDisplayData(variant);

  return <p className="text-m-body-md">{title}</p>;
};

export function Toaster() {
  const t = useI18nContext();

  if (getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION) {
    return null;
  }

  return (
    <ToasterBase
      position="bottom-center"
      containerClassName="toast-container"
      toastOptions={{
        className: 'w-[360px] max-w-[360px] border border-border-muted',
        style: {
          background: 'var(--color-background-section)',
          color: 'var(--color-text-default)',
          borderRadius: 12,
          padding: 12,
        },
      }}
    >
      {(notification) => (
        <ToastBar
          toast={notification}
          position={notification.position ?? 'bottom-center'}
        >
          {({ message }) => (
            <>
              <ToastStatusIcon
                status={
                  SPINNER_INPUT[
                    notification.type as keyof typeof SPINNER_INPUT
                  ] ?? SPINNER_INPUT.loading
                }
              />

              {message}

              <ButtonIcon
                ariaLabel={t('close')}
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                onClick={() => toast.dismiss(notification.id)}
              />
            </>
          )}
        </ToastBar>
      )}
    </ToasterBase>
  );
}
