import React from 'react';
import { useLocation } from 'react-router-dom';
import { toast, ToastBar, Toaster as ToasterBase } from 'react-hot-toast';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { isInteractiveUI } from '../../../../shared/lib/environment-type';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  useTransactionDisplay,
  type TransactionStatus,
} from '../../../helpers/utils/transaction-display';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { StatusIcon } from '../icon/status-icon';

const statusMap = {
  loading: 'loading',
  success: 'success',
  error: 'fail',
} as const;

export function Toaster() {
  const t = useI18nContext();
  const { pathname } = useLocation();

  if (!isInteractiveUI() || process.env.IN_TEST) {
    return null;
  }

  // Only show toast on the default (home) route
  const style = pathname === DEFAULT_ROUTE ? undefined : { display: 'none' };

  return (
    <ToasterBase
      position="bottom-center"
      containerClassName="toast-container"
      containerStyle={style}
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
      {(item) => (
        <ToastBar toast={item} position={item.position ?? 'bottom-center'}>
          {({ message }) => (
            <>
              <StatusIcon
                state={
                  statusMap[item.type as keyof typeof statusMap] ??
                  statusMap.loading
                }
              />

              {message}

              <ButtonIcon
                ariaLabel={t('close')}
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                onClick={() => toast.dismiss(item.id)}
              />
            </>
          )}
        </ToastBar>
      )}
    </ToasterBase>
  );
}

export const ToastContent = ({ status }: { status: TransactionStatus }) => {
  const { title } = useTransactionDisplay(status);

  return (
    <div>
      <p className="text-m-body-md">{title}</p>
    </div>
  );
};
