import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  TextVariant,
  Toaster as MmdsToaster,
  toast,
} from '@metamask/design-system-react';
import { isInteractiveUI } from '../../../../shared/lib/environment-type';

export { toast, ToastSeverity } from '@metamask/design-system-react';

export function Toaster() {
  if (!isInteractiveUI()) {
    return null;
  }

  return (
    <div style={{ display: 'var(--toast-display, flex)' }}>
      <MmdsToaster className="toast-container bottom-[var(--toaster-bottom-offset,16px)]" />
    </div>
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
