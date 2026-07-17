import React, { type CSSProperties } from 'react';
import {
  toast as hotToast,
  ToastBar,
  Toaster as ToasterBase,
  type DefaultToastOptions,
  type ToastOptions,
} from 'react-hot-toast';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Button,
  ButtonSize,
  ButtonVariant,
  TextVariant,
} from '@metamask/design-system-react';
import { SECOND } from '../../../../shared/constants/time';
import { isInteractiveUI } from '../../../../shared/lib/environment-type';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { StatusIcon } from '../status-icon/status-icon';

const statusMap = {
  loading: 'loading',
  success: 'success',
  error: 'fail',
} as const;

type ToastParams = {
  title: string;
  description?: string;
  actionText?: string;
  onActionClick?: () => void;
  dataTestId?: string;
  id?: string;
};

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
        <p className="text-m-body-md">{title}</p>

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

function toToastContent({
  title,
  description,
  actionText,
  onActionClick,
  dataTestId,
  id,
}: ToastParams) {
  return (
    <ToastContent
      title={title}
      description={description}
      actionText={actionText}
      onActionClick={onActionClick}
      dataTestId={dataTestId ?? id}
    />
  );
}

function showToast(
  variant: 'success' | 'error' | 'loading',
  params: ToastParams,
  options?: ToastOptions,
) {
  return hotToast[variant](toToastContent(params), {
    id: params.id,
    ...options,
  });
}

type ToastPromiseMessages<T> = {
  loading: ToastParams;
  success?: ToastParams | ((data: T) => ToastParams);
  error?: ToastParams | ((error: unknown) => ToastParams);
};

export const toast = {
  success: (params: ToastParams, options?: ToastOptions) =>
    showToast('success', params, options),
  error: (params: ToastParams, options?: ToastOptions) =>
    showToast('error', params, options),
  loading: (params: ToastParams, options?: ToastOptions) =>
    showToast('loading', params, options),
  promise: <T,>(
    promise: Promise<T> | (() => Promise<T>),
    msgs: ToastPromiseMessages<T>,
    options?: DefaultToastOptions,
  ) => {
    const { success, error } = msgs;

    return hotToast.promise(
      promise,
      {
        loading: toToastContent(msgs.loading),
        success: success
          ? (data) =>
              toToastContent(
                typeof success === 'function' ? success(data) : success,
              )
          : undefined,
        error: error
          ? (err) =>
              toToastContent(typeof error === 'function' ? error(err) : error)
          : undefined,
      },
      {
        id: msgs.loading.id,
        ...options,
      },
    );
  },
  dismiss: hotToast.dismiss,
  remove: hotToast.remove,
};

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
        bottom: 'var(--toaster-bottom-offset, 16px)',
      }}
      toastOptions={{
        duration: 5 * SECOND,
        loading: {
          duration: Infinity,
        },
        className: 'w-[360px] max-w-[360px] border border-border-muted',
        style: {
          background: 'var(--color-background-section)',
          color: 'var(--color-text-default)',
          borderRadius: 12,
          padding: 12,
          visibility:
            'var(--toast-visibility, visible)' as CSSProperties['visibility'],
        },
      }}
    >
      {(item) => (
        <ToastBar toast={item} position={item.position ?? 'bottom-center'}>
          {({ message }) => (
            <>
              {item.icon ?? (
                <StatusIcon
                  className="shrink-0"
                  state={
                    statusMap[item.type as keyof typeof statusMap] ??
                    statusMap.loading
                  }
                />
              )}

              {message}

              <ButtonIcon
                ariaLabel={t('close')}
                iconName={IconName.Close}
                size={ButtonIconSize.Sm}
                onClick={() => hotToast.dismiss(item.id)}
              />
            </>
          )}
        </ToastBar>
      )}
    </ToasterBase>
  );
}
