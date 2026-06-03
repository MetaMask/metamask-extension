import { showFailedToast, showPendingToast, showSuccessToast } from './shared';

const mockToast = jest.fn();
const mockToastDismiss = jest.fn();

jest.mock('@metamask/design-system-react', () => ({
  toast: Object.assign((...args: unknown[]) => mockToast(...args), {
    dismiss: (...args: unknown[]) => mockToastDismiss(...args),
  }),
}));

describe('toast-listener/shared', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a pending toast', () => {
    showPendingToast('toast-id', {
      title: 'Transaction submitted',
      description: 'Waiting for confirmation',
      dataTestId: 'pending-toast',
    });

    expect(mockToast).toHaveBeenCalledWith({
      severity: 'default',
      title: 'Transaction submitted',
      description: 'Waiting for confirmation',
      hasNoTimeout: true,
      'data-testid': 'pending-toast',
    });
  });

  it('shows a success toast', () => {
    showSuccessToast('toast-id', {
      title: 'Transaction confirmed',
      description: 'Completed',
      dataTestId: 'success-toast',
    });

    expect(mockToast).toHaveBeenCalledWith({
      severity: 'success',
      title: 'Transaction confirmed',
      description: 'Completed',
      'data-testid': 'success-toast',
    });
  });

  it('shows a failed toast', () => {
    showFailedToast('toast-id', {
      title: 'Transaction failed',
      description: 'Try again',
      dataTestId: 'failed-toast',
    });

    expect(mockToast).toHaveBeenCalledWith({
      severity: 'danger',
      title: 'Transaction failed',
      description: 'Try again',
      'data-testid': 'failed-toast',
    });
  });
});
