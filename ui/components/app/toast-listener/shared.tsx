import { toast } from '@metamask/design-system-react';

type ToastOptions = {
  title: string;
  description?: string;
  dataTestId?: string;
};

export function showPendingToast(id: string, options: ToastOptions) {
  toast({
    severity: 'default',
    title: options.title,
    description: options.description,
    'data-testid': options.dataTestId,
  });
}

export function showSuccessToast(id: string, options: ToastOptions) {
  toast({
    severity: 'success',
    title: options.title,
    description: options.description,
    'data-testid': options.dataTestId,
  });
}

export function showFailedToast(id: string, options: ToastOptions) {
  toast({
    severity: 'danger',
    title: options.title,
    description: options.description,
    'data-testid': options.dataTestId,
  });
}

export function dismissToast(id: string) {
  toast.dismiss();
}
