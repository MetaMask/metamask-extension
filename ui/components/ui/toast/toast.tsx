import React from 'react';
import { toast, ToastBar, Toaster as ToasterBase } from 'react-hot-toast';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Button,
  ButtonSize,
  ButtonVariant,
  TextVariant,
} from '@metamask/design-system-react';
import { isInteractiveUI } from '../../../../shared/lib/environment-type';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { StatusIcon } from '../icon/status-icon';

export { toast } from 'react-hot-toast';

const statusMap = {
  loading: 'loading',
  success: 'success',
  error: 'fail',
} as const;

export function Toaster() {
  const t = useI18nContext();

  if (!isInteractiveUI()) {
    return null;
  }

  return (
    <ToasterBase
      position="bottom-center"
      containerClassName="toast-container"
      containerStyle={{
        display: 'var(--toast-display, flex)',
        bottom: 'var(--toaster-bottom-offset, 16px)',
      }}
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
                className="shrink-0"
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

export const ToastContent = ({
  title,
  description,
  actionText,
  onActionClick,
  dataTestId,
}: {
  title: string;
  description?: string;
  actionText?: string;
  dataTestId?: string;
  onActionClick?: () => void;
}) => {
  return (
    <div data-testid={dataTestId}>
      <div className="flex min-w-0 flex-col">
        <p className="text-m-body-md font-bold">{title}</p>

        {description && (
          <p className="mt-1 text-s-body-sm text-text-alternative">
            {description}
          </p>
        )}
      </div>

      {onActionClick && (
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Sm}
          className="mt-2 rounded-lg"
          textProps={{
            variant: TextVariant.BodySm,
          }}
          onClick={onActionClick}
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};
