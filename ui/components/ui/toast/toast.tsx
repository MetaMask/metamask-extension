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

  if (!isInteractiveUI() || process.env.IN_TEST) {
    return null;
  }

  return (
    <ToasterBase
      position="bottom-center"
      containerClassName="toast-container"
      containerStyle={{
        display: 'var(--toast-display, flex)',
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
  actionText,
  onActionClick,
}: {
  title: string;
  actionText?: string;
  onActionClick?: () => void;
}) => {
  return (
    <div>
      <p className="text-m-body-md">{title}</p>

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
